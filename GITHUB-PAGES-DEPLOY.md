# 🚀 GitHub Pages Deployment Guide

## 📦 What You're Deploying

**MANTRA Vanity Address Generator** - A secure, client-side cryptocurrency vanity address generator built with Rust/WebAssembly.

**Total Size**: ~396KB (322KB WebAssembly + 74KB assets)

## 🎯 Deployment Process

### Automatic Deployment (Recommended)

GitHub Pages deployment is fully automated via GitHub Actions:

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

2. **GitHub Actions will automatically**:
   - Install Rust and wasm-pack
   - Build the WebAssembly module
   - Deploy to GitHub Pages
   - Your site will be available at: `https://your-username.github.io/your-repository-name/`

### Manual Local Testing

Test the deployment locally before pushing:

```bash
# Build the project
npm run build

# Create deployment package
npm run deploy

# Test locally
npm run deploy:preview
# Visit: http://localhost:8080
```

## 📁 Required Files

The following files are automatically deployed:

```
✅ index.html          (~13KB) - Main application interface
✅ main.js             (~13KB) - Frontend JavaScript logic  
✅ vanity_wasm.js      (~20KB) - WebAssembly bindings
✅ vanity_wasm_bg.wasm (~322KB) - Compiled Rust code
```

**Optional TypeScript definitions** (included):
- `vanity_wasm.d.ts`
- `vanity_wasm_bg.wasm.d.ts`

## ⚙️ GitHub Pages Configuration

### Repository Settings

1. Go to your repository → **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `gh-pages` (automatically created by workflow)
4. **Folder**: `/` (root)

### Build Process

The GitHub Actions workflow (`.github/workflows/pages.yml`):
- Installs Rust toolchain with WebAssembly target
- Installs wasm-pack
- Builds the WebAssembly module
- Deploys to GitHub Pages

### No Configuration Required

- ✅ **Environment Variables**: None needed (client-side only)
- ✅ **Build Settings**: Handled by GitHub Actions
- ✅ **Custom Domain**: Optional (configure in repository settings)
- ✅ **HTTPS**: Automatically enabled

## 🔒 Security Features

GitHub Pages automatically provides:
- **HTTPS enforcement**
- **Global CDN** via GitHub's infrastructure
- **No server-side processing** (static files only)
- **Client-side only** execution (no data transmission)

## 🌐 Post-Deployment Testing

After deployment, verify:

1. **Access your site**: `https://your-username.github.io/repository-name/`
2. **Test functionality**:
   - Generate a vanity address
   - Verify WASM loads without errors
   - Check mobile responsiveness
   - Confirm no console errors

## 📊 Performance Expectations

- **First load**: ~2-3 seconds (WebAssembly compilation)
- **Subsequent loads**: <1 second (browser cached)
- **Generation speed**: 100-1000+ addresses/second
- **Global availability**: GitHub's CDN

## 🛠️ Useful Commands

```bash
# Verify deployment readiness
npm run verify

# Build for production
npm run build

# Create deployment package
npm run deploy

# Test locally
npm run deploy:preview

# Clean build artifacts
npm run clean
```

## 🐛 Troubleshooting

**Deployment fails**:
- Check GitHub Actions logs in your repository
- Ensure Rust build completes successfully
- Verify all required files are present

**WASM doesn't load**:
- Check browser console for errors
- Verify HTTPS is enabled (required for SharedArrayBuffer)
- Test in different browsers

**Build issues**:
- Ensure `wasm-module/src/lib.rs` is present
- Check Rust toolchain in GitHub Actions
- Verify wasm-pack installation

## 📞 Support

- **Repository Issues**: Use GitHub Issues for bug reports
- **Documentation**: See `README.md` for full documentation
- **Security**: See `SECURITY.md` for security information

---

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] GitHub Pages enabled in repository settings
- [ ] GitHub Actions workflow runs successfully
- [ ] Site loads at `https://your-username.github.io/repository-name/`
- [ ] Vanity generation works correctly
- [ ] Mobile testing completed
- [ ] Custom domain configured (optional)

## 🎉 Advantages of GitHub Pages

- **Free hosting** for public repositories
- **Automatic deployments** on every push
- **Global CDN** with excellent performance
- **Custom domains** with free SSL
- **Version control** integrated deployment
- **No vendor lock-in** (standard Git repository)

**🎯 Your MANTRA vanity address generator is now live on GitHub Pages!**
