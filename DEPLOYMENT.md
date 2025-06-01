# GitHub Pages Deployment Guide

## 📁 Files to Deploy

For GitHub Pages, you only need these frontend files:

### Required Files:
```
index.html          # Main application
main.js             # Frontend JavaScript
vanity_wasm.js      # WebAssembly JavaScript bindings
vanity_wasm_bg.wasm # Compiled WebAssembly module
```

### Optional Files:
```
vanity_wasm.d.ts         # TypeScript definitions
vanity_wasm_bg.wasm.d.ts # WASM TypeScript definitions
```

The WebAssembly files are automatically generated from the Rust source code in `wasm-module/src/lib.rs`.

## 🚀 Deployment Methods

### Method 1: Automatic GitHub Actions (Recommended)

**Zero configuration required!** Just push to GitHub:

1. **Enable GitHub Pages** in repository settings:
   - Settings → Pages → Source: Deploy from a branch → Branch: `gh-pages`

2. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **Automatic deployment** via GitHub Actions workflow
4. **Access your site** at: `https://your-username.github.io/repository-name/`

### Method 2: Manual Local Build

Test locally before deploying:

```bash
# Build the project
npm run build

# Create deployment package
npm run deploy

# Test locally  
npm run deploy:preview
# Visit: http://localhost:8080
```

### Method 3: Direct File Upload

For other static hosting providers:

```bash
# Prepare deployment files
mkdir deploy
cp index.html main.js vanity_wasm* deploy/
```

Upload the `deploy` folder contents to your hosting provider.

## ⚙️ GitHub Configuration

### Repository Settings

1. **Pages Settings**:
   - Source: Deploy from a branch
   - Branch: `gh-pages` (auto-created by workflow)
   - Folder: `/` (root)

2. **Actions Settings**:
   - Enable GitHub Actions (should be enabled by default)
   - Allow all actions (or allow specific actions)

### No Manual Configuration Required

- ✅ **Build Settings**: Handled by `.github/workflows/pages.yml`
- ✅ **Environment Variables**: None needed (client-side only)
- ✅ **Custom Domain**: Optional (configure in repository settings)
- ✅ **HTTPS**: Automatically enabled by GitHub

## 📋 Deployment Checklist

### ✅ Prerequisites
- [ ] Repository pushed to GitHub
- [ ] GitHub Pages enabled in repository settings
- [ ] `.github/workflows/pages.yml` workflow file present

### ✅ Files Ready for Deployment
- [ ] `index.html` - Main application interface
- [ ] `main.js` - Frontend JavaScript logic
- [ ] `vanity_wasm.js` - WebAssembly JavaScript bindings  
- [ ] `vanity_wasm_bg.wasm` - Compiled WebAssembly module
- [ ] `wasm-module/src/lib.rs` - Rust source code

### 🌐 Post-Deployment Verification

1. **Load Test**: Verify the application loads without errors
2. **WASM Test**: Check that WebAssembly module loads correctly
3. **Generation Test**: Generate a test vanity address
4. **Mobile Test**: Verify responsive design on mobile devices
5. **Performance Test**: Check load times and responsiveness

### 🔒 Security Features

GitHub Pages automatically provides:
- **HTTPS enforcement** (no mixed content)
- **Global CDN** distribution
- **DDoS protection** 
- **No server-side execution** (static files only)
- **Client-side only** operation (no data transmission)

### 📊 Performance Optimization

GitHub automatically provides:
- Global CDN distribution via GitHub's infrastructure
- Gzip compression for assets
- Browser caching headers
- Fast global edge locations

Expected load times:
- Initial load: ~2-3 seconds (WebAssembly compilation)
- Subsequent visits: <1 second (browser cached)

### 🚨 Troubleshooting

**GitHub Actions build fails**:
- Check Actions tab in your repository for error logs
- Ensure Rust toolchain installs correctly
- Verify `wasm-pack` installation succeeds

**WASM fails to load**:
- Check browser console for errors
- Verify HTTPS is enabled (required for SharedArrayBuffer)
- Test in different browsers (Chrome, Firefox, Safari)

**Pages not updating**:
- Check GitHub Actions workflow completed successfully
- Verify `gh-pages` branch was updated
- Clear browser cache and try again

**Build artifacts missing**:
- Ensure `wasm-module/src/lib.rs` exists
- Check Rust compilation succeeds
- Verify wasm-pack generates expected files

---

## 🎯 Deployment Methods Summary

| Method | Difficulty | Automation | Best For |
|--------|------------|------------|----------|
| **GitHub Actions** | Easy | Full | Production |
| **Manual Build** | Medium | None | Development |
| **Direct Upload** | Easy | Manual | Other hosts |

### Quick Deploy Commands

```bash
# Verify deployment readiness
npm run verify

# Build locally for testing
npm run build

# Create local deployment package
npm run deploy

# Test deployment locally
npm run deploy:preview

# Clean build artifacts
npm run clean
```

### GitHub Actions Workflow

The workflow (`.github/workflows/pages.yml`) automatically:
1. Installs Rust with WebAssembly target
2. Installs wasm-pack
3. Builds the WebAssembly module
4. Deploys to GitHub Pages

**🎉 Your MANTRA vanity address generator is now live on GitHub Pages!**
