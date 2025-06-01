/* tslint:disable */
/* eslint-disable */
export function main(): void;
/**
 * Generates a random keypair for the MANTRA blockchain
 *
 * This function creates a cryptographically secure random mnemonic phrase
 * and derives the corresponding MANTRA address. The process ensures:
 * - High entropy through OS random number generator
 * - 24-word mnemonic for maximum security (256 bits entropy)
 * - Deterministic address derivation following standards
 *
 * # Returns
 * * `Keypair` - A new keypair with random mnemonic and derived address
 *
 * # Example
 * ```javascript
 * const keypair = generate_random_keypair();
 * console.log(`Address: ${keypair.address}`);
 * console.log(`Mnemonic: ${keypair.mnemonic}`);
 * ```
 */
export function generate_random_keypair(): Keypair;
/**
 * Validates if a target string is compatible with bech32 encoding
 *
 * This function checks if the provided target string contains only
 * characters that are valid in bech32 addresses, preventing invalid
 * search patterns that could never be found.
 *
 * # Arguments
 * * `target` - The target string to validate
 *
 * # Returns
 * * `bool` - true if the target is valid for bech32 addresses
 */
export function validate_target_string(target: string): boolean;
/**
 * Advanced keypair generation with pattern matching
 *
 * This function generates keypairs until one is found that contains
 * the specified target pattern in its address at the specified position.
 * This is useful for creating "vanity" addresses with custom patterns.
 *
 * # Arguments
 * * `target` - The substring pattern to search for in addresses
 * * `position` - Where the pattern should appear (Anywhere, Prefix, or Suffix)
 * * `max_attempts` - Maximum number of generation attempts (0 = unlimited)
 *
 * # Returns
 * * `Option<Keypair>` - The first matching keypair, or None if max_attempts reached
 *
 * # Examples
 * - Prefix: "mantra1test..." (pattern "test" right after prefix)
 * - Suffix: "...test" (pattern "test" at the end)
 * - Anywhere: "...test..." (pattern "test" anywhere in address)
 *
 * # Note
 * This function can be computationally expensive for rare patterns.
 * Prefix matching is generally faster than suffix matching.
 */
export function generate_vanity_keypair_with_position(target: string, position: VanityPosition, max_attempts: number): Keypair | undefined;
/**
 * Advanced keypair generation with pattern matching (legacy function for backward compatibility)
 *
 * This function generates keypairs until one is found that contains
 * the specified target pattern anywhere in its address.
 *
 * # Arguments
 * * `target` - The substring pattern to search for in addresses
 * * `max_attempts` - Maximum number of generation attempts (0 = unlimited)
 *
 * # Returns
 * * `Option<Keypair>` - The first matching keypair, or None if max_attempts reached
 *
 * # Note
 * This function can be computationally expensive for rare patterns.
 * Consider the probability: for a 3-character pattern, expect ~32,768 attempts.
 */
export function generate_vanity_keypair(target: string, max_attempts: number): Keypair | undefined;
/**
 * Derives a MANTRA address from a given mnemonic string (for testing purposes)
 *
 * This function allows users to test address derivation with their own mnemonic
 * to verify that our derivation matches standard wallets.
 *
 * # Arguments
 * * `mnemonic_str` - The mnemonic phrase as a string
 *
 * # Returns
 * * `String` - The derived MANTRA address, or error message if invalid
 *
 * # Example
 * ```javascript
 * const address = derive_address_from_mnemonic("word1 word2 ... word24");
 * console.log(`Derived address: ${address}`);
 * ```
 */
export function derive_address_from_mnemonic(mnemonic_str: string): string;
/**
 * Position where the vanity string should appear in the address
 */
export enum VanityPosition {
  /**
   * Match anywhere in the address (default behavior)
   */
  Anywhere = 0,
  /**
   * Match immediately after "mantra1" prefix
   */
  Prefix = 1,
  /**
   * Match at the end of the address (in checksum portion)
   */
  Suffix = 2,
}
/**
 * Represents a cryptographic keypair with its associated MANTRA address
 *
 * This struct encapsulates the core data needed for a blockchain identity:
 * - The bech32-encoded address for receiving funds
 * - The BIP39 mnemonic phrase for wallet recovery
 */
export class Keypair {
  free(): void;
  /**
   * Creates a new keypair instance
   *
   * # Arguments
   * * `address` - The bech32-encoded MANTRA address
   * * `mnemonic` - The BIP39 mnemonic phrase
   */
  constructor(address: string, mnemonic: string);
  /**
   * Gets the address field (getter for JavaScript)
   */
  readonly address: string;
  /**
   * Gets the mnemonic field (getter for JavaScript)
   */
  readonly mnemonic: string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_keypair_free: (a: number, b: number) => void;
  readonly keypair_new: (a: number, b: number, c: number, d: number) => number;
  readonly keypair_address: (a: number) => [number, number];
  readonly keypair_mnemonic: (a: number) => [number, number];
  readonly generate_random_keypair: () => number;
  readonly validate_target_string: (a: number, b: number) => number;
  readonly generate_vanity_keypair_with_position: (a: number, b: number, c: number, d: number) => number;
  readonly generate_vanity_keypair: (a: number, b: number, c: number) => number;
  readonly derive_address_from_mnemonic: (a: number, b: number) => [number, number];
  readonly main: () => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
