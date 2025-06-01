# Cloudflare Pages Deployment Guide

## 📁 Files to Deploy

For Cloudflare Pages, you only need these frontend files:

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

## 🚀 Deployment Methods

### Method 1: Direct Upload (Easiest)

1. **Prepare deployment files**:
   ```bash
   mkdir deploy
   cp index.html main.js vanity_wasm* deploy/
   ```

2. **Upload to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Pages → Create a project → Upload assets
   - Drag the `deploy` folder contents
   - Set project name: `mantra-vanity-generator`

### Method 2: GitHub Integration (Recommended)

1. **Push to GitHub** (with proper .gitignore)
2. **Connect Cloudflare Pages to GitHub**:
   - Pages → Create a project → Connect to Git
   - Select your repository
   - Build settings:
     - **Framework preset**: None
     - **Build command**: `./build.sh`
     - **Build output directory**: `/`
     - **Root directory**: `/`

### Method 3: Automated Deployment Script

Run this script to create a clean deployment package:

```bash
npm run deploy
```

## 🔧 Configuration

### Custom Domain (Optional)
- Add your domain in Cloudflare Pages settings
- SSL is automatically provided

### Headers (Optional)
Create `_headers` file for security:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Redirects (Optional)
Create `_redirects` file:
```
# SPA fallback
/* /index.html 200
```

## 📋 Deployment Checklist

Before deploying to Cloudflare Pages, verify:

### ✅ Files Ready for Deployment
- [ ] `index.html` - Main application interface
- [ ] `main.js` - Frontend JavaScript logic
- [ ] `vanity_wasm.js` - WebAssembly JavaScript bindings  
- [ ] `vanity_wasm_bg.wasm` - Compiled WebAssembly module
- [ ] `_headers` - Security headers for Cloudflare
- [ ] `_redirects` - SPA routing configuration

### 🔧 Cloudflare Pages Settings

**Framework preset**: None  
**Build command**: `./cloudflare-build.sh`  
**Build output directory**: `/`  
**Root directory**: `/`  

### 🛠️ Environment Variables (None Required)
This application runs entirely client-side with no backend dependencies.

### 🌐 Post-Deployment Verification

1. **Load Test**: Verify the application loads without errors
2. **WASM Test**: Check that WebAssembly module loads correctly
3. **Generation Test**: Generate a test vanity address
4. **Mobile Test**: Verify responsive design on mobile devices
5. **Security Test**: Confirm HTTPS is enabled and headers are set

### 🔒 Security Verification

- [ ] HTTPS enabled automatically
- [ ] Security headers applied via `_headers` file
- [ ] No external network requests (check browser dev tools)
- [ ] CSP (Content Security Policy) allows WASM execution
- [ ] Private keys never transmitted (client-side only)

### 📊 Performance Optimization

Cloudflare automatically provides:
- Global CDN distribution
- Brotli/Gzip compression  
- Edge caching
- HTTP/3 support

Expected load times:
- Initial load: ~2-3 seconds (324KB WASM)
- Subsequent visits: <1 second (cached)

### 🚨 Troubleshooting

**WASM fails to load**:
- Check MIME type for `.wasm` files
- Verify CORS headers allow WASM execution

**Build fails**:
- Ensure Rust toolchain is available
- Verify `wasm-pack` is installed
- Check build script permissions

**Security errors**:
- Review CSP headers
- Verify HTTPS is enabled
- Check for mixed content warnings

---

## 🎯 Deployment Methods Summary

| Method | Difficulty | Automation | Best For |
|--------|------------|------------|----------|
| **Cloudflare + GitHub** | Easy | Full | Production |
| **Direct Upload** | Easy | Manual | Quick deploy |
| **Other Static Hosts** | Medium | Varies | Alternative |

### Quick Deploy Commands

```bash
# Build and deploy locally
npm run deploy

# Preview deployment
npm run deploy:preview

# Clean and rebuild
npm run clean && npm run build
```
