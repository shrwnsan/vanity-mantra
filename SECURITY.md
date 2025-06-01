# Security Policy

## 🔒 Security Considerations

The MANTRA Vanity Address Generator handles cryptocurrency private keys and addresses. Security is our top priority.

## ⚠️ Important Security Notes

### Client-Side Only
- **All cryptographic operations happen locally in your browser**
- **No data is ever transmitted to external servers**
- **Private keys and mnemonics never leave your device**

### Secure Usage Recommendations

1. **Use Offline**: For maximum security, download and run offline
2. **Verify Source**: Only download from official repositories
3. **Fresh Environment**: Use in a clean browser session
4. **Save Securely**: Store generated mnemonics in a secure location
5. **Verify Addresses**: Always verify generated addresses in your wallet

## 🛡️ Cryptographic Standards

- **BIP32**: Hierarchical Deterministic wallets
- **BIP44**: Multi-account hierarchy
- **BIP39**: Mnemonic phrases
- **secp256k1**: Elliptic curve cryptography
- **BLAKE2b**: Secure hashing (for MANTRA addresses)

## 🐛 Reporting Security Vulnerabilities

If you discover a security vulnerability, please:

1. **DO NOT** create a public issue
2. **Email**: [Your email here] with details
3. **Include**: Steps to reproduce and potential impact
4. **Wait**: For acknowledgment before public disclosure

### Response Timeline

- **24 hours**: Initial acknowledgment
- **72 hours**: Preliminary assessment
- **7 days**: Detailed response and fix timeline

## ✅ Security Checklist for Contributors

Before submitting cryptographic changes:

- [ ] Maintains BIP32/BIP44 compatibility
- [ ] Uses secure randomness sources
- [ ] No private key logging or transmission
- [ ] Follows established cryptographic standards
- [ ] Includes security testing

## 🔍 Security Auditing

This project welcomes security audits. Areas of focus:

- **Key Generation**: Entropy and randomness
- **HD Derivation**: BIP32/BIP44 compliance  
- **Address Generation**: MANTRA-specific encoding
- **Memory Management**: Private key handling
- **WebAssembly Security**: WASM module isolation

## 📝 Known Limitations

- **Browser Security**: Relies on browser's crypto.getRandomValues()
- **Client Trust**: User must trust the execution environment
- **Physical Security**: No protection against local attacks

## 🛠️ Secure Development Practices

- All dependencies are audited
- WebAssembly provides memory isolation
- No external network requests
- Minimal attack surface

---

**Remember**: This tool generates real cryptocurrency addresses and private keys. Always practice good security hygiene and never share your private keys or mnemonic phrases.
