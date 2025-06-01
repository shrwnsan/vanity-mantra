# Contributing to MANTRA Vanity Address Generator

Thank you for your interest in contributing to the MANTRA Vanity Address Generator! We welcome contributions from the community.

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a new branch for your feature/fix
4. **Make** your changes
5. **Test** your changes thoroughly
6. **Submit** a pull request

## 🛠️ Development Setup

### Prerequisites

- Rust (latest stable version)
- `wasm-pack` for WebAssembly compilation
- Python 3 (for development server)

### Building the Project

```bash
# Install wasm-pack if you haven't already
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build the WebAssembly module
./build.sh

# Start development server
npm run dev
```

## 🧪 Testing

Before submitting a pull request, please ensure:

1. **Security**: Any cryptographic changes maintain BIP32/BIP44 compatibility
2. **Performance**: Address generation performance is not significantly degraded
3. **UI/UX**: Interface remains responsive and intuitive
4. **Browser Compatibility**: Test in major browsers (Chrome, Firefox, Safari, Edge)

## 📝 Code Style

- **Rust**: Follow standard Rust formatting (`cargo fmt`)
- **JavaScript**: Use consistent indentation and clear variable names
- **HTML/CSS**: Maintain the existing responsive design patterns

## 🔒 Security Considerations

This project generates cryptocurrency private keys. Please ensure:

- All randomness sources remain cryptographically secure
- Private keys are never logged or transmitted
- HD derivation paths follow BIP44 standards
- No sensitive data is cached or stored

## 📋 Pull Request Guidelines

- **Clear Description**: Explain what your PR does and why
- **Small Scope**: Keep PRs focused on a single feature/fix
- **Documentation**: Update README.md if adding new features
- **Testing**: Include testing steps in your PR description

## 🐛 Reporting Issues

When reporting bugs, please include:

- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

## 💡 Feature Requests

We welcome feature requests! Please:

- Check if the feature already exists
- Explain the use case and benefit
- Consider security implications
- Be open to discussion about implementation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make MANTRA Vanity Address Generator better! 🎉
