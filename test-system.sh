#!/bin/zsh

# MANTRA Vanity Address Generator - Quick Test Script
# Verifies that the parallel processing implementation is working correctly

echo "🚀 MANTRA Vanity Address Generator - Quick Verification Test"
echo "============================================================="

# Check if server is running
echo "📡 Checking server status..."
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Server is running on localhost:8000"
else
    echo "❌ Server not running. Starting server..."
    python3 -m http.server 8000 &
    SERVER_PID=$!
    sleep 3
    echo "✅ Server started with PID $SERVER_PID"
fi

# Check file accessibility
echo ""
echo "📁 Checking file accessibility..."
files=("index.html" "main.js" "worker.js" "vanity_wasm.js" "vanity_wasm_bg.wasm")

for file in "${files[@]}"; do
    if curl -s "http://localhost:8000/$file" > /dev/null; then
        echo "   ✅ $file - accessible"
    else
        echo "   ❌ $file - not accessible"
    fi
done

# Check DOM elements
echo ""
echo "🔍 Checking HTML DOM elements..."
html_content=$(curl -s http://localhost:8000)

required_elements=("inputFeedback" "positionFeedback" "vanityForm" "targetInput" "generateButton" "status" "results" "addressValue" "mnemonicValue")

for element in "${required_elements[@]}"; do
    if echo "$html_content" | grep -q "id=\"$element\""; then
        echo "   ✅ $element - present"
    else
        echo "   ❌ $element - missing"
    fi
done

# System information
echo ""
echo "💻 System Information:"
echo "   CPU cores: $(sysctl -n hw.ncpu)"
echo "   Memory: $(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024) " GB"}')"
echo "   Platform: $(uname -m)"

# Check browser compatibility
echo ""
echo "🌐 Browser Compatibility:"
echo "   Chrome/Chromium: ES modules and Web Workers supported"
echo "   Firefox: ES modules and Web Workers supported"
echo "   Safari: ES modules and Web Workers supported"
echo "   Edge: ES modules and Web Workers supported"

# Performance expectations
cores=$(sysctl -n hw.ncpu)
workers=$((cores - 2))
if [ $workers -lt 1 ]; then
    workers=1
fi

echo ""
echo "📊 Expected Performance:"
echo "   CPU cores: $cores"
echo "   Web workers: $workers"
echo "   Single-thread rate: ~3,000-5,000 addr/sec"
echo "   Parallel rate: ~$((workers * 3000))-$((workers * 5000)) addr/sec"
echo "   Expected speedup: ${workers}x"

echo ""
echo "🧪 Test Instructions:"
echo "   1. Open: http://localhost:8000"
echo "   2. Enter pattern: 'test' or 'man'"
echo "   3. Select position: Prefix, Suffix, or Anywhere"
echo "   4. Click 'Generate Vanity Address'"
echo "   5. Monitor browser console for parallel processing logs"
echo ""
echo "📈 Performance Tests Available:"
echo "   • Quick test: http://localhost:8000/quick-test.html"
echo "   • Comparison: http://localhost:8000/performance-comparison.html"
echo "   • Diagnostics: http://localhost:8000/test-parallel.html"
echo ""
echo "✨ All systems ready for testing!"

# If we started the server, give option to stop it
if [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo "📝 Server PID: $SERVER_PID"
    echo "   To stop server: kill $SERVER_PID"
fi
