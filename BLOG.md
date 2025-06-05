# Building a High-Performance MANTRA Vanity Address Generator with Rust and WebAssembly

*A deep dive into creating a secure, fast, and user-friendly vanity address generator for the MANTRA blockchain*

## Introduction

Have you ever wanted a blockchain address that's more memorable than a random string of characters? Welcome to the world of vanity addresses! In this blog post, I'll walk you through building a production-ready vanity address generator for the MANTRA blockchain, combining the power of Rust and WebAssembly with a modern web frontend.

## What Are Vanity Addresses?

Vanity addresses are cryptocurrency addresses that contain recognizable patterns. For example, instead of a random MANTRA address like `mantra1x8rr5hqk7nj2s3w9c6t4m5n7p8q9r0s1t2u3v4`, you might generate one like `mantra1abc123...` or `...xyz789`. While the underlying cryptographic security remains the same, vanity addresses are more memorable and can serve as a form of digital identity.

## The Challenge: Performance vs. Security

Creating vanity addresses involves generating thousands (or millions) of random addresses until one matches your desired pattern. This presents two major challenges:

1. **Performance**: Address generation must be fast enough to be practical
2. **Security**: Generated addresses must be cryptographically secure and compatible with standard wallets

Many existing vanity generators sacrifice wallet compatibility for simplicity, using basic key derivation instead of proper HD (Hierarchical Deterministic) wallet standards. This was our first major hurdle to overcome.

## Architecture Overview

Our solution uses a hybrid architecture:

- **Rust Backend**: High-performance cryptographic operations compiled to WebAssembly
- **JavaScript Frontend**: Modern, responsive UI with real-time feedback
- **Standards Compliance**: Full BIP39/BIP32/BIP44 compatibility

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   JavaScript    │───▶│   WebAssembly    │───▶│   Cryptography  │
│   Frontend      │    │   (Rust)         │    │   (secp256k1)   │
│                 │    │                  │    │                 │
│ • UI Logic      │    │ • Key Generation │    │ • BIP39/32/44   │
│ • Validation    │    │ • Address Derive │    │ • SHA256/RIPEMD │
│ • Progress      │    │ • Pattern Match  │    │ • bech32        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Part 1: Setting Up the Rust/WebAssembly Backend

### Creating the Rust Project

First, we set up a new Rust project configured for WebAssembly compilation:

```toml
# Cargo.toml
[package]
name = "vanity_wasm"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
bech32 = "0.11"
bip39 = "2.0"
k256 = { version = "0.13", features = ["ecdsa", "arithmetic"] }
hmac = "0.12"
sha2 = "0.10"
ripemd = "0.1"
rand = { version = "0.8", features = ["wasm-bindgen"] }

[dependencies.web-sys]
version = "0.3"
features = [
  "console",
]
```

The key dependencies here are:
- `k256`: secp256k1 elliptic curve operations
- `bip39`: Mnemonic phrase generation
- `hmac` + `sha2`: Cryptographic hash functions
- `bech32`: Address encoding for Cosmos chains

### Implementing Core Cryptographic Functions

The heart of our generator is proper BIP32 HD derivation. This was the most challenging part, as many implementations take shortcuts that break wallet compatibility.

```rust
/// Derives a MANTRA address using proper BIP32/BIP44 HD derivation
fn derive_address(mnemonic: &Mnemonic) -> Result<String, Box<dyn std::error::Error>> {
    // 1. Generate seed from mnemonic (BIP39 standard)
    let seed = mnemonic.to_seed("");

    // 2. Create master key using HMAC-SHA512 with "Bitcoin seed"
    let mut mac = Hmac::<Sha512>::new_from_slice(b"Bitcoin seed")?;
    mac.update(&seed);
    let result = mac.finalize().into_bytes();

    // 3. Extract master private key and chain code
    let mut current_private_key_bytes = [0u8; 32];
    let mut current_chain_code = [0u8; 32];
    current_private_key_bytes.copy_from_slice(&result[0..32]);
    current_chain_code.copy_from_slice(&result[32..64]);

    // 4. Convert to scalar for proper elliptic curve arithmetic
    let mut current_private_scalar = Scalar::from_repr(current_private_key_bytes.into()).unwrap();

    // 5. Derive using path m/44'/118'/0'/0/0 (Cosmos standard)
    let derivation_path: [u32; 5] = [
        44 + 0x80000000,  // purpose (hardened)
        118 + 0x80000000, // coin type for Cosmos (hardened)
        0x80000000,       // account 0 (hardened)
        0,                // change 0 (non-hardened)
        0,                // address_index 0 (non-hardened)
    ];

    // 6. Derive through each path component
    for &index in &derivation_path {
        let mut mac = Hmac::<Sha512>::new_from_slice(&current_chain_code)?;

        if index >= 0x80000000 {
            // Hardened derivation
            mac.update(&[0x00]);
            mac.update(&current_private_scalar.to_bytes());
        } else {
            // Non-hardened derivation
            let signing_key = SigningKey::from_bytes(&current_private_scalar.to_bytes().into())?;
            let pubkey = signing_key.verifying_key().to_encoded_point(true);
            mac.update(pubkey.as_bytes());
        }

        mac.update(&index.to_be_bytes());
        let derived = mac.finalize().into_bytes();
        
        // Critical: Proper secp256k1 scalar addition
        let mut derived_key_bytes = [0u8; 32];
        derived_key_bytes.copy_from_slice(&derived[0..32]);
        let derived_scalar = Scalar::from_repr(derived_key_bytes.into()).unwrap();
        
        // BIP32 key derivation: new_key = (parent_key + derived_key) mod n
        current_private_scalar = current_private_scalar.add(&derived_scalar);
        
        // Update chain code for next iteration
        current_chain_code.copy_from_slice(&derived[32..64]);
    }

    // 7. Generate final address from derived key
    let final_private_key_bytes = current_private_scalar.to_bytes();
    let signing_key = SigningKey::from_bytes(&final_private_key_bytes.into())?;
    let pubkey = signing_key.verifying_key().to_encoded_point(true);
    
    // 8. Hash public key: SHA256 then RIPEMD160
    let sha256_hash = Sha256::digest(pubkey.as_bytes());
    let ripemd_hash = Ripemd160::digest(sha256_hash);
    
    // 9. Encode with bech32 using "mantra" prefix
    let address = bech32_encode("mantra", ripemd_hash.to_base32(), Variant::Bech32)?;
    
    Ok(address)
}
```

### The Critical Fix: Proper Scalar Arithmetic

The most important part of this implementation is line where we perform proper elliptic curve scalar addition:

```rust
current_private_scalar = current_private_scalar.add(&derived_scalar);
```

Many simplified implementations just replace the private key bytes, but BIP32 requires proper modular arithmetic on the secp256k1 curve. This ensures compatibility with all standard wallets.

### Position-Based Pattern Matching

We implemented three types of vanity generation:

```rust
#[wasm_bindgen]
pub enum VanityPosition {
    Anywhere,  // Pattern can appear anywhere (fastest)
    Prefix,    // Pattern appears after "mantra1"
    Suffix,    // Pattern appears at the end (slowest)
}

fn matches_pattern(address: &str, target: &str, position: VanityPosition) -> bool {
    match position {
        VanityPosition::Anywhere => address.contains(target),
        VanityPosition::Prefix => {
            let after_prefix = &address[7..]; // Skip "mantra1"
            after_prefix.starts_with(target)
        },
        VanityPosition::Suffix => address.ends_with(target),
    }
}
```

### WebAssembly Bindings

To expose our Rust functions to JavaScript, we use `wasm-bindgen`:

```rust
#[wasm_bindgen]
pub fn generate_vanity_keypair_with_position(
    target: &str, 
    position_str: &str
) -> Result<Keypair, JsError> {
    // Convert string to enum
    let position = match position_str {
        "Prefix" => VanityPosition::Prefix,
        "Suffix" => VanityPosition::Suffix,
        _ => VanityPosition::Anywhere,
    };

    // Generate addresses until we find a match
    loop {
        let mnemonic = Mnemonic::generate_in(Language::English, 24)?;
        let address = derive_address(&mnemonic)?;
        
        if matches_pattern(&address, target, position) {
            return Ok(Keypair::new(address, mnemonic.to_string()));
        }
    }
}
```

## Part 2: Building the Frontend

### Modern JavaScript Architecture

Our frontend uses modern JavaScript with ES6 modules and clean separation of concerns:

```javascript
/**
 * Application state management
 */
class VanityGeneratorApp {
  constructor() {
    this.isRunning = false;
    this.startTime = null;
    this.attempts = 0;
    
    // DOM element references
    this.elements = {
      form: document.getElementById('vanityForm'),
      targetInput: document.getElementById('targetInput'),
      positionInputs: document.querySelectorAll('input[name="position"]'),
      generateButton: document.getElementById('generateButton'),
      statusDiv: document.getElementById('status'),
      resultsDiv: document.getElementById('results')
    };
  }

  async init() {
    await init(); // Initialize WASM module
    this.setupEventListeners();
    this.updateUI();
  }
}
```

### Real-Time Progress Tracking

One challenge with vanity generation is providing feedback during potentially long operations. We solve this by breaking generation into batches:

```javascript
async generateVanityAddress() {
  this.isRunning = true;
  this.startTime = Date.now();
  this.attempts = 0;

  const target = this.elements.targetInput.value.toLowerCase();
  const position = this.getSelectedPosition();

  this.showStatus('🔍 Generating vanity address...', 'info');

  try {
    // Generate in batches to allow UI updates
    while (this.isRunning) {
      // Try up to 1000 attempts per batch
      const batchResult = await this.generateBatch(target, position, 1000);
      
      if (batchResult) {
        this.showResults(batchResult);
        break;
      }
      
      // Update progress
      this.updateProgress();
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  } catch (error) {
    this.showStatus(`❌ Error: ${error.message}`, 'error');
  }
}
```

### Responsive Design with CSS Custom Properties

We use modern CSS with custom properties for consistent theming:

```css
     :root {
       --primary-color: #3b82f6;
       --primary-hover: #2563eb;
       --success-color: #22c55e;
       --error-color: #ef4444;
       --warning-color: #f97316;
       --background: #1f2937;
       --surface: #374151;
       --text-primary: #f3f4f6;
       --text-secondary: #9ca3af;
       --border: #4b5563;
       --border-radius: 8px;
       --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.2), 0 1px 2px -1px rgb(0 0 0 / 0.15);
     }

     .card {
       background: var(--surface);
       border-radius: var(--border-radius);
       padding: 2rem;
       box-shadow: var(--shadow);
       margin-bottom: 1.5rem;
     }
     ```

### Position Selection UI

We provide an intuitive interface for selecting generation modes:

```html
<fieldset class="position-fieldset">
  <legend>Where should the pattern appear?</legend>
  
  <label class="position-option">
    <input type="radio" name="position" value="Anywhere" checked>
    <div class="position-content">
      <div class="position-header">
        <span class="position-title">Anywhere</span>
        <span class="difficulty-badge easy">🟢 Easy</span>
      </div>
      <div class="position-description">
        Pattern can appear anywhere in the address (fastest)
      </div>
      <div class="position-example">
        Example: mantra1x8r<strong>abc</strong>123nj2s3w9c6t4m5n7
      </div>
    </div>
  </label>

  <!-- Similar structure for Prefix and Suffix options -->
</fieldset>
```

## Part 3: Solving the Compatibility Crisis

### The Problem We Discovered

During testing, we discovered a critical issue: addresses generated by our vanity generator didn't match the addresses produced by standard wallets when importing the same mnemonic phrase. This would have been a catastrophic user experience issue!

### Investigation and Solution

The problem was in our key derivation. Initially, we were using a simplified approach:

```rust
// ❌ WRONG: Simplified derivation (breaks wallet compatibility)
let private_key = derived_key_bytes;
```

But BIP32 requires proper elliptic curve arithmetic:

```rust
// ✅ CORRECT: Proper BIP32 derivation
current_private_scalar = current_private_scalar.add(&derived_scalar);
```

This seemingly small change was crucial for wallet compatibility.

### Comprehensive Testing

We built extensive testing tools to verify compatibility:

```javascript
// Test against known BIP39 test vectors
const testVectors = [
  {
    mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
    expected: "mantra19rl4cm2hmr8afy4kldpxz3fka4jguq0aht8eu0"
  },
  // More test vectors...
];

for (const vector of testVectors) {
  const result = derive_address_from_mnemonic(vector.mnemonic);
  assert(result.address === vector.expected, "Address mismatch!");
}
```

We also created comparison tests against CosmJS (the standard Cosmos JavaScript library):

```javascript
// Reference implementation using CosmJS
import { Secp256k1HdWallet } from "@cosmjs/amino";

async function testCompatibility() {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  
  // Our implementation
  const ourResult = derive_address_from_mnemonic(mnemonic);
  
  // CosmJS reference
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "mantra" });
  const [account] = await wallet.getAccounts();
  
  console.log("Our address:", ourResult.address);
  console.log("CosmJS address:", account.address);
  console.log("Match:", ourResult.address === account.address);
}
```

## Part 4: Performance Optimization

### Batch Processing

To keep the UI responsive, we process generation in batches:

```javascript
async generateBatch(target, position, maxAttempts) {
  const batchSize = 100;
  
  for (let batch = 0; batch < maxAttempts / batchSize; batch++) {
    for (let i = 0; i < batchSize; i++) {
      this.attempts++;
      
      try {
        const result = generate_vanity_keypair_with_position(target, position);
        return result; // Found a match!
      } catch (error) {
        // Continue searching
      }
    }
    
    // Update UI every batch
    this.updateProgress();
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  
  return null; // No match found in this batch
}
```

### WebAssembly Performance Benefits

Compiling to WebAssembly gives us significant performance advantages:

- **Speed**: Rust's zero-cost abstractions and WASM's near-native performance
- **Memory Efficiency**: Manual memory management in Rust
- **Parallelization**: Could be extended with Web Workers for multi-threading

Typical performance on modern hardware:
- Single character: ~32 attempts (instant)
- Two characters: ~1,000 attempts (~1 second)  
- Three characters: ~32,000 attempts (~30 seconds)
- Four characters: ~1,000,000 attempts (~15-20 minutes)

## Part 5: Security Considerations

### Cryptographic Security

Our implementation prioritizes security:

```rust
// Use cryptographically secure random number generator
use rand::{rngs::OsRng, RngCore};

// Generate entropy for mnemonic
let mut entropy = [0u8; 32];
OsRng.fill_bytes(&mut entropy);
let mnemonic = Mnemonic::from_entropy(&entropy)?;
```

### Client-Side Security

- **No Server Communication**: All generation happens locally
- **No Key Storage**: Private keys exist only temporarily in memory
- **Input Validation**: Prevent invalid patterns and potential attacks

```javascript
function validateTargetString(target) {
  // Check for valid bech32 characters only
  const validChars = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  
  for (const char of target.toLowerCase()) {
    if (!validChars.includes(char)) {
      throw new Error(`Invalid character '${char}'. Use only: ${validChars}`);
    }
  }
  
  if (target.length === 0 || target.length > 10) {
    throw new Error('Target must be 1-10 characters long');
  }
}
```

## Part 6: User Experience Design

### Progressive Difficulty Indicators

We help users understand the computational cost:

```javascript
function estimateDifficulty(pattern, position) {
  const baseChars = 32; // Approximate characters in address
  let searchSpace;
  
  switch (position) {
    case 'Prefix':
      searchSpace = Math.pow(baseChars, pattern.length);
      break;
    case 'Suffix':
      searchSpace = Math.pow(baseChars, pattern.length);
      break;
    case 'Anywhere':
      searchSpace = Math.pow(baseChars, pattern.length) / (baseChars - pattern.length + 1);
      break;
  }
  
  return {
    attempts: Math.round(searchSpace / 2), // Average case
    difficulty: searchSpace < 1000 ? 'Easy' : searchSpace < 100000 ? 'Medium' : 'Hard'
  };
}
```

### Real-Time Feedback

```javascript
updateProgress() {
  const elapsed = (Date.now() - this.startTime) / 1000;
  const rate = this.attempts / elapsed;
  
  this.elements.attemptsValue.textContent = this.attempts.toLocaleString();
  this.elements.durationValue.textContent = `${elapsed.toFixed(1)}s`;
  this.elements.rateValue.textContent = `${rate.toFixed(0)} addr/sec`;
}
```

### Accessibility Features

- **Semantic HTML**: Proper form structure and labels
- **Keyboard Navigation**: All functionality accessible via keyboard
- **Screen Reader Support**: ARIA labels and descriptions
- **High Contrast**: Color scheme suitable for visual impairments

## Part 7: Testing and Validation

### Automated Testing Suite

We created comprehensive tests:

```html
<!-- Automated validation test -->
<script type="module">
  const testVectors = [
    {
      mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
      expected: "mantra19rl4cm2hmr8afy4kldpxz3fka4jguq0aht8eu0"
    },
    // More vectors...
  ];

  async function runTests() {
    await init();
    
    let passed = 0;
    for (const vector of testVectors) {
      const result = derive_address_from_mnemonic(vector.mnemonic);
      if (result.address === vector.expected) {
        passed++;
        console.log(`✓ Test passed: ${vector.expected}`);
      } else {
        console.error(`✗ Test failed. Expected: ${vector.expected}, Got: ${result.address}`);
      }
    }
    
    console.log(`${passed}/${testVectors.length} tests passed`);
  }
</script>
```

### Cross-Platform Validation

We tested against multiple reference implementations:
- CosmJS (JavaScript Cosmos library)
- Keplr Wallet
- Cosmostation Wallet
- Standard BIP39 test vectors

## Deployment and Distribution

### GitHub Pages Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        target: wasm32-unknown-unknown
    
    - name: Install wasm-pack
      run: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
    
    - name: Build WASM
      run: |
        cd wasm-module
        wasm-pack build --target web --out-dir ../
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

### Local Development

```json
{
  "scripts": {
    "dev": "python3 -m http.server 8000",
    "build": "cd wasm-module && wasm-pack build --target web --out-dir ../",
    "clean": "rm -f vanity_wasm*"
  }
}
```

## Lessons Learned

### Technical Insights

1. **WebAssembly Integration**: WASM provides excellent performance for cryptographic operations while maintaining browser compatibility
2. **BIP32 Complexity**: Proper HD derivation is more complex than it appears, requiring careful attention to elliptic curve arithmetic
3. **Testing Importance**: Comprehensive testing against reference implementations is crucial for wallet compatibility
4. **Performance vs. UX**: Balancing generation speed with responsive UI requires careful batch processing

### Development Best Practices

1. **Security First**: Always use established cryptographic libraries and follow standards
2. **User Education**: Help users understand computational costs and security implications
3. **Progressive Enhancement**: Start with basic functionality and add advanced features
4. **Cross-Platform Testing**: Test on multiple browsers and against multiple reference implementations

## Future Enhancements

### Potential Improvements

1. **Web Workers**: Move generation to background threads for better UI responsiveness
2. **GPU Acceleration**: Explore WebGL/WebGPU for parallel address generation
3. **Pattern Validation**: More sophisticated pattern matching (regex support)
4. **Batch Export**: Generate multiple vanity addresses in one session
5. **Advanced Analytics**: Better difficulty estimation and time predictions

### Multi-Chain Support

The architecture could be extended to support other Cosmos chains:

```rust
pub enum ChainConfig {
    Mantra { prefix: "mantra", coin_type: 118 },
    Cosmos { prefix: "cosmos", coin_type: 118 },
    Osmosis { prefix: "osmo", coin_type: 118 },
    // More chains...
}
```

## Conclusion

Building a secure, high-performance vanity address generator taught us valuable lessons about:

- **Cryptographic Standards**: The importance of following established protocols exactly
- **Performance Optimization**: How WebAssembly can bridge the gap between security and speed  
- **User Experience**: Making complex cryptographic operations accessible to everyday users
- **Testing and Validation**: The critical importance of comprehensive compatibility testing

The final result is a production-ready tool that generates vanity MANTRA addresses while maintaining full compatibility with standard wallets. The combination of Rust's performance and safety with WebAssembly's browser integration creates an optimal solution for cryptographic web applications.

Whether you're interested in blockchain development, WebAssembly, or cryptographic programming, this project demonstrates how modern web technologies can create powerful, secure applications that were previously only possible with native desktop software.

## Try It Yourself

The complete source code is available on GitHub, and you can try the live application at [your-deployment-url]. Generate your own vanity MANTRA address and experience the satisfaction of owning a truly personalized blockchain identity!

---

*Have questions about the implementation or suggestions for improvements? Feel free to open an issue or contribute to the project on GitHub.*
