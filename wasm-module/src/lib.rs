//! MANTRA Vanity Address Generator
//!
//! This module provides WebAssembly bindings for generating MANTRA blockchain addresses
//! with custom patterns (vanity addresses). It follows SOLID principles with:
//! - Single Responsibility: Each function has one clear purpose
//! - Open/Closed: Easy to extend with new address types or validation rules
//! - Dependency Inversion: Uses trait-based abstractions where applicable

use bech32::{encode as bech32_encode, ToBase32, Variant};
use bip39::Mnemonic;
use hmac::{Hmac, Mac};
use k256::{
    ecdsa::SigningKey,
    elliptic_curve::{sec1::ToEncodedPoint, PrimeField},
    Scalar,
};
use rand::{rngs::OsRng, RngCore};
use ripemd::Ripemd160;
use sha2::{Digest, Sha256, Sha512};
use wasm_bindgen::prelude::*;

// When the `console_error_panic_hook` feature is enabled, we can call the
// `set_panic_hook` function at least once during initialization, and then
// we will get better error messages if our code ever panics.
//
// For more details see
// https://github.com/rustwasm/console_error_panic_hook#readme
#[cfg(feature = "console_error_panic_hook")]
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

/// Represents a cryptographic keypair with its associated MANTRA address
///
/// This struct encapsulates the core data needed for a blockchain identity:
/// - The bech32-encoded address for receiving funds
/// - The BIP39 mnemonic phrase for wallet recovery
#[wasm_bindgen]
pub struct Keypair {
    address: String,
    mnemonic: String,
}

#[wasm_bindgen]
impl Keypair {
    /// Creates a new keypair instance
    ///
    /// # Arguments
    /// * `address` - The bech32-encoded MANTRA address
    /// * `mnemonic` - The BIP39 mnemonic phrase
    #[wasm_bindgen(constructor)]
    pub fn new(address: String, mnemonic: String) -> Keypair {
        Keypair { address, mnemonic }
    }

    /// Gets the address field (getter for JavaScript)
    #[wasm_bindgen(getter)]
    pub fn address(&self) -> String {
        self.address.clone()
    }

    /// Gets the mnemonic field (getter for JavaScript)
    #[wasm_bindgen(getter)]
    pub fn mnemonic(&self) -> String {
        self.mnemonic.clone()
    }
}

/// Derives a MANTRA address from a BIP39 mnemonic phrase using proper BIP32 secp256k1 HD derivation
///
/// This function implements the EXACT same derivation that CosmJS uses:
/// 1. Generate seed from mnemonic (BIP39 standard)
/// 2. Derive master key using HMAC-SHA512 with "Bitcoin seed"
/// 3. Follow derivation path m/44'/118'/0'/0/0 with proper secp256k1 arithmetic
/// 4. Hash derived public key with SHA256 then RIPEMD160
/// 5. Encode with bech32 using "mantra" prefix
///
/// # Arguments
/// * `mnemonic` - The BIP39 mnemonic to derive from
///
/// # Returns
/// * `String` - The bech32-encoded MANTRA address
fn derive_address(mnemonic: &Mnemonic) -> Result<String, Box<dyn std::error::Error>> {
    // Generate seed from mnemonic (BIP39 standard with empty passphrase)
    let seed = mnemonic.to_seed("");

    // Create master key using HMAC-SHA512 with "Bitcoin seed" (BIP32 standard)
    let mut mac = Hmac::<Sha512>::new_from_slice(b"Bitcoin seed")
        .map_err(|e| format!("Failed to create HMAC: {}", e))?;
    mac.update(&seed);
    let result = mac.finalize().into_bytes();

    // Split into master private key (left 32 bytes) and chain code (right 32 bytes)
    let mut current_private_key_bytes = [0u8; 32];
    let mut current_chain_code = [0u8; 32];
    current_private_key_bytes.copy_from_slice(&result[0..32]);
    current_chain_code.copy_from_slice(&result[32..64]);

    // Convert to scalar for arithmetic operations
    let mut current_private_scalar = Scalar::from_repr(current_private_key_bytes.into()).unwrap(); // Safe unwrap - master key is always valid

    // Derive using path m/44'/118'/0'/0/0 (Cosmos standard for MANTRA)
    let derivation_path: [u32; 5] = [
        44 + 0x80000000,  // purpose (hardened) - BIP44
        118 + 0x80000000, // coin type for Cosmos (hardened)
        0x80000000,       // account 0 (hardened)
        0,                // change 0 (non-hardened)
        0,                // address_index 0 (non-hardened)
    ];

    // Derive through each path component using proper BIP32 secp256k1 derivation
    for &index in &derivation_path {
        let mut mac = Hmac::<Sha512>::new_from_slice(&current_chain_code)
            .map_err(|e| format!("Failed to create HMAC for derivation: {}", e))?;

        if index >= 0x80000000 {
            // Hardened derivation: use 0x00 + private_key + index
            mac.update(&[0x00]);
            mac.update(&current_private_scalar.to_bytes());
        } else {
            // Non-hardened derivation: use compressed_public_key + index
            let signing_key = SigningKey::from_bytes(&current_private_scalar.to_bytes().into())
                .map_err(|e| format!("Failed to create signing key for derivation: {}", e))?;
            let pubkey = signing_key.verifying_key().to_encoded_point(true);
            mac.update(pubkey.as_bytes());
        }

        mac.update(&index.to_be_bytes());
        let derived = mac.finalize().into_bytes();

        // Parse left 32 bytes as the derived key scalar
        let mut derived_key_bytes = [0u8; 32];
        derived_key_bytes.copy_from_slice(&derived[0..32]);
        let derived_scalar = Scalar::from_repr(derived_key_bytes.into()).unwrap(); // Safe unwrap - derived key is always valid

        // BIP32 key derivation: new_key = (parent_key + derived_key) mod n
        // This is the critical step that was missing in our previous implementation
        current_private_scalar = current_private_scalar.add(&derived_scalar);

        // Update chain code for next iteration
        current_chain_code.copy_from_slice(&derived[32..64]);
    }

    // Create final signing key from the computed private key
    let final_private_key_bytes = current_private_scalar.to_bytes();
    let signing_key = SigningKey::from_bytes(&final_private_key_bytes.into())
        .map_err(|e| format!("Failed to create final signing key: {}", e))?;

    // Get compressed public key bytes (33 bytes, starts with 0x02 or 0x03)
    let pubkey = signing_key.verifying_key().to_encoded_point(true);
    let pubkey_bytes = pubkey.as_bytes();

    // Standard Cosmos address derivation: SHA256 then RIPEMD160 of public key
    let sha256_hash = Sha256::digest(pubkey_bytes);
    let ripemd_hash = Ripemd160::digest(&sha256_hash);

    // Encode with bech32 using MANTRA prefix
    let address = bech32_encode("mantra", ripemd_hash.to_base32(), Variant::Bech32)
        .map_err(|e| format!("Failed to encode bech32 address: {}", e))?;

    Ok(address)
}

/// Generates a random keypair for the MANTRA blockchain
///
/// This function creates a cryptographically secure random mnemonic phrase
/// and derives the corresponding MANTRA address. The process ensures:
/// - High entropy through OS random number generator
/// - 24-word mnemonic for maximum security (256 bits entropy)
/// - Deterministic address derivation following standards
///
/// # Returns
/// * `Keypair` - A new keypair with random mnemonic and derived address
///
/// # Example
/// ```javascript
/// const keypair = generate_random_keypair();
/// console.log(`Address: ${keypair.address}`);
/// console.log(`Mnemonic: ${keypair.mnemonic}`);
/// ```
#[wasm_bindgen]
pub fn generate_random_keypair() -> Keypair {
    let mut rng = OsRng;

    // Generate 32 bytes of entropy for 24-word mnemonic (256 bits entropy)
    let mut entropy = [0u8; 32];
    rng.fill_bytes(&mut entropy);

    // Generate mnemonic from entropy
    let mnemonic = Mnemonic::from_entropy(&entropy).expect("Failed to generate mnemonic");

    // Derive the corresponding MANTRA address
    let address = derive_address(&mnemonic).expect("Failed to derive address from mnemonic");

    Keypair::new(address, mnemonic.to_string())
}

/// Validates if a target string is compatible with bech32 encoding
///
/// This function checks if the provided target string contains only
/// characters that are valid in bech32 addresses, preventing invalid
/// search patterns that could never be found.
///
/// # Arguments
/// * `target` - The target string to validate
///
/// # Returns
/// * `bool` - true if the target is valid for bech32 addresses
#[wasm_bindgen]
pub fn validate_target_string(target: &str) -> bool {
    let bech32_alphabet = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

    target
        .chars()
        .all(|ch| ch == '1' || bech32_alphabet.contains(ch))
}

/// Position where the vanity string should appear in the address
#[wasm_bindgen]
#[derive(Copy, Clone, PartialEq)]
pub enum VanityPosition {
    /// Match anywhere in the address (default behavior)
    Anywhere = 0,
    /// Match immediately after "mantra1" prefix
    Prefix = 1,
    /// Match at the end of the address (in checksum portion)
    Suffix = 2,
}

impl Default for VanityPosition {
    fn default() -> Self {
        VanityPosition::Anywhere
    }
}

/// Advanced keypair generation with pattern matching
///
/// This function generates keypairs until one is found that contains
/// the specified target pattern in its address at the specified position.
/// This is useful for creating "vanity" addresses with custom patterns.
///
/// # Arguments
/// * `target` - The substring pattern to search for in addresses
/// * `position` - Where the pattern should appear (Anywhere, Prefix, or Suffix)
/// * `max_attempts` - Maximum number of generation attempts (0 = unlimited)
///
/// # Returns
/// * `Option<Keypair>` - The first matching keypair, or None if max_attempts reached
///
/// # Examples
/// - Prefix: "mantra1test..." (pattern "test" right after prefix)
/// - Suffix: "...test" (pattern "test" at the end)
/// - Anywhere: "...test..." (pattern "test" anywhere in address)
///
/// # Note
/// This function can be computationally expensive for rare patterns.
/// Prefix matching is generally faster than suffix matching.
#[wasm_bindgen]
pub fn generate_vanity_keypair_with_position(
    target: &str,
    position: VanityPosition,
    max_attempts: u32,
) -> Option<Keypair> {
    let target_lower = target.to_lowercase();
    let mut attempts = 0;

    loop {
        if max_attempts > 0 && attempts >= max_attempts {
            return None;
        }

        let keypair = generate_random_keypair();
        let address_lower = keypair.address.to_lowercase();

        let matches = match position {
            VanityPosition::Anywhere => address_lower.contains(&target_lower),
            VanityPosition::Prefix => {
                // Check if pattern appears right after "mantra1"
                if address_lower.len() > 7 + target_lower.len() {
                    address_lower[7..].starts_with(&target_lower)
                } else {
                    false
                }
            }
            VanityPosition::Suffix => {
                // Check if pattern appears at the end
                address_lower.ends_with(&target_lower)
            }
        };

        if matches {
            return Some(keypair);
        }

        attempts += 1;
    }
}

/// Advanced keypair generation with pattern matching (legacy function for backward compatibility)
///
/// This function generates keypairs until one is found that contains
/// the specified target pattern anywhere in its address.
///
/// # Arguments
/// * `target` - The substring pattern to search for in addresses
/// * `max_attempts` - Maximum number of generation attempts (0 = unlimited)
///
/// # Returns
/// * `Option<Keypair>` - The first matching keypair, or None if max_attempts reached
///
/// # Note
/// This function can be computationally expensive for rare patterns.
/// Consider the probability: for a 3-character pattern, expect ~32,768 attempts.
#[wasm_bindgen]
pub fn generate_vanity_keypair(target: &str, max_attempts: u32) -> Option<Keypair> {
    generate_vanity_keypair_with_position(target, VanityPosition::Anywhere, max_attempts)
}

/// Derives a MANTRA address from a given mnemonic string (for testing purposes)
///
/// This function allows users to test address derivation with their own mnemonic
/// to verify that our derivation matches standard wallets.
///
/// # Arguments
/// * `mnemonic_str` - The mnemonic phrase as a string
///
/// # Returns
/// * `String` - The derived MANTRA address, or error message if invalid
///
/// # Example
/// ```javascript
/// const address = derive_address_from_mnemonic("word1 word2 ... word24");
/// console.log(`Derived address: ${address}`);
/// ```
#[wasm_bindgen]
pub fn derive_address_from_mnemonic(mnemonic_str: &str) -> String {
    match Mnemonic::parse(mnemonic_str) {
        Ok(mnemonic) => match derive_address(&mnemonic) {
            Ok(address) => address,
            Err(e) => format!("Error deriving address: {}", e),
        },
        Err(e) => format!("Invalid mnemonic: {}", e),
    }
}
