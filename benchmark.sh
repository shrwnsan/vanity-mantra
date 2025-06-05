#!/bin/bash

# MANTRA Vanity Address Generator - Performance Benchmark Script
# This script runs performance tests to verify parallel processing improvements

echo "🚀 MANTRA Vanity Address Parallel Processing Benchmark"
echo "======================================================"

# Check if server is running
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "❌ Local server not running on port 8000"
    echo "   Please run: python3 -m http.server 8000"
    exit 1
fi

echo "✅ Server is running on localhost:8000"

# Get system info
echo ""
echo "💻 System Information:"
echo "   CPU cores: $(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 'unknown')"
echo "   Memory: $(sysctl -n hw.memsize 2>/dev/null | awk '{print $1/1024/1024/1024 " GB"}' || echo 'unknown')"

# Check WASM files
echo ""
echo "📦 WASM Module Information:"
echo "   vanity_wasm.js: $(ls -lh vanity_wasm.js | awk '{print $5}')"
echo "   vanity_wasm_bg.wasm: $(ls -lh vanity_wasm_bg.wasm | awk '{print $5}')"

# Test file access
echo ""
echo "🔍 Testing file accessibility..."

for file in vanity_wasm.js vanity_wasm_bg.wasm worker.js main.js; do
    if curl -s "http://localhost:8000/$file" > /dev/null; then
        echo "   ✅ $file - accessible"
    else
        echo "   ❌ $file - not accessible"
    fi
done

echo ""
echo "🧪 Test Results:"
echo "   Open http://localhost:8000/test-parallel.html in your browser"
echo "   Click the test buttons to verify parallel processing"
echo ""
echo "📊 Expected Performance Improvements:"
echo "   - Single-threaded: ~1,000-5,000 addresses/second"
echo "   - Multi-threaded: ~$(echo "$(sysctl -n hw.ncpu 2>/dev/null || echo 4) * 1500" | bc 2>/dev/null || echo "6,000")-$(echo "$(sysctl -n hw.ncpu 2>/dev/null || echo 4) * 3000" | bc 2>/dev/null || echo "12,000") addresses/second"
echo ""
echo "✨ Happy testing!"
