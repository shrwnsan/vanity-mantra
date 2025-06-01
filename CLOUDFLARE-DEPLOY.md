# 🚀 Cloudflare Pages Deployment - Quick Start Guide

## 📦 What You're Deploying

**MANTRA Vanity Address Generator** - A secure, client-side cryptocurrency vanity address generator built with Rust/WebAssembly.

**Total Size**: ~396KB (322KB WebAssembly + 74KB assets)

## 🎯 Deployment Options

### Option 1: GitHub + Cloudflare Pages (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Pages → Create a project → Connect to Git
   - Select your repository
   - Configure build settings:
     - **Framework preset**: None
     - **Build command**: `./cloudflare-build.sh`
     - **Build output directory**: `/`
     - **Node.js version**: 18+ (optional)

3. **Deploy**: Cloudflare will automatically build and deploy

### Option 2: Direct File Upload

1. **Prepare files**:
   ```bash
   npm run deploy
   ```

2. **Upload**: Drag the `dist/` folder contents to Cloudflare Pages

### Option 3: Manual Build

If you prefer manual control:
```bash
# Build WebAssembly
npm run build

# Copy files manually
mkdir deploy-package
cp index.html main.js vanity_wasm* _headers _redirects deploy-package/
```

## 📁 Required Files for Deployment

```
✅ index.html          (13KB) - Main application interface
✅ main.js             (13KB) - Frontend JavaScript logic  
✅ vanity_wasm.js      (20KB) - WebAssembly bindings
✅ vanity_wasm_bg.wasm (322KB) - Compiled Rust code
✅ _headers            (710B) - Security headers
✅ _redirects          (68B)  - SPA routing
```

**Optional TypeScript definitions**:
- `vanity_wasm.d.ts`
- `vanity_wasm_bg.wasm.d.ts`

## ⚙️ Cloudflare Configuration

### Build Settings
- **Build command**: `./cloudflare-build.sh`
- **Build output directory**: `/` (root)
- **Install command**: (none - uses system Rust)

### Environment Variables
None required! This app runs entirely client-side.

### Custom Domain (Optional)
- Add your domain in Pages settings
- SSL certificate automatically provisioned

## 🔒 Security Features

The deployment includes:
- **Security headers** via `_headers` file
- **Content Security Policy** for WebAssembly
- **HTTPS only** (automatic on Cloudflare)
- **No external requests** (fully client-side)

## 🌐 Post-Deployment Testing

1. **Access your site**: `https://your-project-name.pages.dev`
2. **Test functionality**:
   - Generate a vanity address
   - Verify WASM loads without errors
   - Check mobile responsiveness
   - Confirm no console errors

## 📊 Performance Expectations

- **First load**: ~2-3 seconds (WebAssembly compilation)
- **Subsequent loads**: <1 second (cached)
- **Generation speed**: 100-1000+ addresses/second
- **Global CDN**: Edge locations worldwide

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
# Then visit: http://localhost:8080

# Clean build artifacts
npm run clean
```

## 🐛 Troubleshooting

**Build fails on Cloudflare**:
- Ensure Rust is available in build environment
- Check `cloudflare-build.sh` has execute permissions

**WASM doesn't load**:
- Verify MIME type for `.wasm` files
- Check browser console for CSP errors
- Ensure HTTPS is enabled

**Performance issues**:
- Enable Cloudflare's auto-minify
- Use Brotli compression (automatic)
- Consider enabling Argo Smart Routing

## 📞 Support

- **Repository**: [GitHub Issues](https://github.com/your-username/mantra-vanity-generator/issues)
- **Documentation**: See `README.md`, `DEPLOYMENT.md`
- **Security**: See `SECURITY.md`

---

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Cloudflare Pages project created
- [ ] Build settings configured
- [ ] First deployment successful
- [ ] Site loads without errors
- [ ] Vanity generation works
- [ ] Mobile testing completed
- [ ] Custom domain configured (optional)

**🎉 Ready to generate MANTRA vanity addresses!**
