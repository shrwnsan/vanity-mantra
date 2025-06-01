#!/bin/bash

# MANTRA Vanity Address Generator - Build Script
# This script builds the WebAssembly module and prepares the project for deployment

set -e

echo "🔧 Building MANTRA Vanity Address Generator..."
echo

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed. Please install from: https://rustup.rs/"
    exit 1
fi

if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack is not installed. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

echo "✅ Prerequisites check passed"
echo

# Add WebAssembly target
echo "🎯 Adding WebAssembly target..."
rustup target add wasm32-unknown-unknown

# Build the WebAssembly module
echo "🏗️  Building WebAssembly module..."
cd wasm-module
wasm-pack build --target web --out-dir ../

echo "🧹 Cleaning up build artifacts..."
rm -f ../package.json  # Remove the generated package.json
cd ..

echo
echo "✅ Build completed successfully!"
echo
echo "🚀 To run the application:"
echo "   npm run dev"
echo "   # or"
echo "   python3 -m http.server 8000"
echo
echo "📂 Open: http://localhost:8000"
echo

# Verify the build
if [ -f "vanity_wasm.js" ] && [ -f "vanity_wasm_bg.wasm" ]; then
    echo "✅ WebAssembly files generated successfully"
    echo "   - vanity_wasm.js ($(du -h vanity_wasm.js | cut -f1))"
    echo "   - vanity_wasm_bg.wasm ($(du -h vanity_wasm_bg.wasm | cut -f1))"
    echo "   - Type definitions included"
else
    echo "❌ Build verification failed - missing WebAssembly files"
    exit 1
fi
