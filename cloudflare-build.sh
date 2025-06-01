#!/bin/bash
# Cloudflare Pages build script

echo "🚀 Building MANTRA Vanity Generator for Cloudflare Pages..."

# Check if we're in Cloudflare build environment
if [ "$CF_PAGES" = "1" ]; then
    echo "📦 Detected Cloudflare Pages environment"
    
    # Install Rust if not available
    if ! command -v rustc &> /dev/null; then
        echo "🦀 Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
    fi
    
    # Add WebAssembly target
    rustup target add wasm32-unknown-unknown
    
    # Install wasm-pack if not available
    if ! command -v wasm-pack &> /dev/null; then
        echo "📦 Installing wasm-pack..."
        curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
    fi
fi

# Build the WebAssembly module
echo "🏗️ Building WebAssembly module..."
cd wasm-module

# Build to a temporary directory first
wasm-pack build --target web --out-dir ../temp-wasm

cd ..

# Copy the WASM files but preserve our package.json
if [ -d "temp-wasm" ]; then
    cp temp-wasm/vanity_wasm* .
    rm -rf temp-wasm
fi

# Verify build outputs
echo "✅ Verifying build outputs..."
for file in vanity_wasm.js vanity_wasm_bg.wasm; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing build output: $file"
        exit 1
    fi
done

echo "🎉 Build completed successfully!"
echo "📁 Deployment files ready:"
echo "   - index.html"
echo "   - main.js" 
echo "   - vanity_wasm.js"
echo "   - vanity_wasm_bg.wasm"
echo "   - vanity_wasm.d.ts"
echo "   - vanity_wasm_bg.wasm.d.ts"
