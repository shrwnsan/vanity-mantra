# MANTRA Vanity Address Generator

![MANTRA Vanity Generator](https://img.shields.io/badge/Blockchain-MANTRA-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![WebAssembly](https://img.shields.io/badge/WebAssembly-Rust-orange)
![Cosmos](https://img.shields.io/badge/Cosmos-SDK-purple)
![Build Status](https://img.shields.io/github/actions/workflow/status/your-username/mantra-vanity-generator/build.yml?branch=main)
![Security](https://img.shields.io/badge/Security-Audited-brightgreen)

A modern, secure, and high-performance vanity address generator for the MANTRA blockchain. Generate custom MANTRA addresses with your desired patterns while maintaining full compatibility with standard wallet software.

## ✨ Features

- **🎯 Position-Based Pattern Matching**: Choose where your vanity pattern appears
  - **Prefix**: Pattern appears right after "mantra1" (e.g., `mantra1abc...`)
  - **Suffix**: Pattern appears at the end (e.g., `...xyz`)  
  - **Anywhere**: Pattern can appear anywhere in the address (fastest)

- **🔒 Cryptographically Secure**: Uses proper BIP32/BIP44 HD derivation compatible with all standard wallets
- **⚡ High Performance**: Rust/WebAssembly backend for optimal speed
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🎨 Modern UI**: Clean, intuitive interface with a default dark theme and real-time feedback
- **📋 One-Click Copy**: Easy copying of addresses and mnemonic phrases
- **🔄 Real-Time Progress**: Live updates during generation

## 🚀 Quick Start

### Option 1: Run Locally

```bash
# Clone the repository
git clone https://github.com/your-username/mantra-vanity-generator.git
cd mantra-vanity-generator

# Start the development server
npm run dev
# or
python3 -m http.server 8000

# Open your browser
open http://localhost:8000
```

### Option 2: Use Online

Visit the hosted version at: [https://your-username.github.io/mantra-vanity-generator](https://your-username.github.io/mantra-vanity-generator)

## 📖 How to Use

1. **Enter Your Pattern**: Type the letters/numbers you want in your address
2. **Choose Position**: Select where the pattern should appear:
   - **Anywhere** (🟢 Easy): Fastest generation, pattern can be anywhere
   - **Prefix** (🟡 Medium): Pattern appears after "mantra1"
   - **Suffix** (🔴 Hard): Pattern appears at the end (takes longer)
3. **Generate**: Click "Generate Vanity Address" and wait for results
4. **Save Safely**: Copy your mnemonic phrase and store it securely
5. **Import to Wallet**: Use the mnemonic in any standard Cosmos wallet

## 🔧 Technical Details

### Architecture

- **Frontend**: Vanilla JavaScript with WebAssembly integration
- **Backend**: Rust compiled to WebAssembly for cryptographic operations
- **Standards**: BIP39 (mnemonic), BIP32 (HD derivation), BIP44 (account structure)
- **Compatibility**: Works with Keplr, Cosmostation, and all standard Cosmos wallets

### Derivation Path

Follows Cosmos standard: `m/44'/118'/0'/0/0`
- Purpose: 44 (BIP44)
- Coin Type: 118 (Cosmos)
- Account: 0
- Change: 0  
- Index: 0

### Security Features

- ✅ Proper secp256k1 elliptic curve arithmetic
- ✅ Cryptographically secure random number generation
- ✅ BIP32 compliant hierarchical deterministic derivation
- ✅ Compatible with all standard Cosmos wallets
- ✅ Client-side only - no data sent to servers

## 🛠️ Development

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- Python 3 (for local server)

### Building from Source

```bash
# Install dependencies
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Clone and build
git clone https://github.com/your-username/mantra-vanity-generator.git
cd mantra-vanity-generator

# Build WebAssembly module
npm run build

# Start development server
npm run dev
```

### Project Structure

```
├── index.html          # Main application interface
├── main.js             # Frontend JavaScript logic
├── wasm-module/        # Rust WebAssembly backend
│   ├── src/lib.rs      # Core cryptographic functions
│   └── Cargo.toml      # Rust dependencies
├── vanity_wasm.*       # Generated WebAssembly files
└── package.json        # Project configuration
```

### Key Dependencies

**Rust (WebAssembly)**:
- `k256` - secp256k1 elliptic curve operations
- `bip39` - BIP39 mnemonic phrase generation
- `hmac` + `sha2` - HMAC-SHA cryptographic functions
- `bech32` - Address encoding for Cosmos chains
- `wasm-bindgen` - JavaScript/WebAssembly bindings

**Frontend**:
- Vanilla JavaScript (no frameworks)
- WebAssembly for performance-critical operations

## 🔒 Security Considerations

- **Private Key Security**: All generation happens locally in your browser
- **Mnemonic Backup**: Always backup your mnemonic phrase securely
- **Pattern Complexity**: Longer patterns take exponentially more time
- **Suffix Generation**: Can take significantly longer than prefix/anywhere

## 🚀 Deployment

### GitHub Pages (Recommended)

The easiest way to deploy this application is using GitHub Pages with automatic deployment:

#### Automatic Deployment
1. **Push your repository to GitHub**
2. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (auto-created)
3. **Push to main branch** - deployment happens automatically via GitHub Actions
4. **Access your site** at: `https://your-username.github.io/repository-name/`

#### Manual Local Testing
```bash
# Build and test locally
npm run build
npm run deploy:preview
# Visit: http://localhost:8080
```

#### Required Files
The deployment automatically includes:
- `index.html` - Main application interface
- `main.js` - Frontend JavaScript logic
- `vanity_wasm.js` - WebAssembly bindings
- `vanity_wasm_bg.wasm` - Compiled Rust code

### Other Hosting Providers

This application works on any static hosting service:
- **Netlify**: Connect to GitHub for automatic deployment
- **Vercel**: Deploy with `vercel --prod`
- **Static hosting**: Upload static files to any web server
- **AWS S3**: Upload to S3 bucket with static hosting

### Build Requirements

For automated deployments, ensure your hosting provider has:
- Rust toolchain
- `wasm-pack` installed
- Support for build scripts

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This tool is provided as-is for educational and utility purposes. Always verify generated addresses work correctly with small amounts before using for significant transactions. The authors are not responsible for any loss of funds.

## 🙏 Acknowledgments

- [MANTRA](https://mantrachain.io/) - The MANTRA blockchain
- [Cosmos SDK](https://cosmos.network/) - Blockchain framework
- [Rust](https://rust-lang.org/) - Systems programming language
- [WebAssembly](https://webassembly.org/) - High-performance web execution

---

**⭐ If this project helped you, please give it a star!**
