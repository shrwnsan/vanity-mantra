#!/bin/bash
echo "🔍 MANTRA Vanity Generator - GitHub Pages Deployment Verification"
echo "============================================================="

# Check required files
FILES=("index.html" "main.js" "vanity_wasm.js" "vanity_wasm_bg.wasm")

echo "📂 Checking deployment files..."
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        echo "✅ $file ($size)"
    else
        echo "❌ $file (MISSING)"
    fi
done

echo ""
if [ -f "vanity_wasm_bg.wasm" ]; then
    wasm_size=$(stat -c%s "vanity_wasm_bg.wasm" 2>/dev/null)
    echo "📊 WASM size: $(($wasm_size / 1024))KB"
fi

echo ""
echo "🚀 Ready for GitHub Pages deployment!"
echo "Push to main branch to trigger deployment"
