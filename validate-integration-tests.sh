#!/bin/bash

# Integration Test Validation Script
# This script validates that the integration test suite is properly configured

echo "🧪 MANTRA Integration Test Validation"
echo "====================================="

# Check if required files exist
echo "📁 Checking required files..."

required_files=(
    "test-integration.html"
    "index.html"
    "main.js"
    "worker.js"
    "vanity_wasm.js"
    "vanity_wasm_bg.wasm"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file - Found"
    else
        echo "❌ $file - Missing"
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo ""
    echo "⚠️  Missing files detected. Please ensure all required files are present."
    exit 1
fi

echo ""
echo "🌐 Checking HTTP server availability..."

# Check if port 8081 is in use (server running)
if lsof -i :8081 > /dev/null 2>&1; then
    echo "✅ HTTP server is running on port 8081"
    
    # Test basic connectivity
    if curl -s -f http://localhost:8081/test-integration.html > /dev/null; then
        echo "✅ Integration test page is accessible"
    else
        echo "❌ Integration test page is not accessible"
        exit 1
    fi
    
    if curl -s -f http://localhost:8081/index.html > /dev/null; then
        echo "✅ Main application page is accessible"
    else
        echo "❌ Main application page is not accessible"
        exit 1
    fi
else
    echo "❌ HTTP server is not running on port 8081"
    echo "💡 Start server with: python3 -m http.server 8081"
    exit 1
fi

echo ""
echo "🔍 Analyzing test structure..."

# Check test file structure
if grep -q "Core Integration Tests" test-integration.html; then
    echo "✅ Core integration tests section found"
else
    echo "❌ Core integration tests section missing"
    exit 1
fi

# Check for the four main tests
test_ids=(
    "wasm-init-test"
    "workers-init-test"
    "parallel-gen-test"
    "fallback-test"
)

for test_id in "${test_ids[@]}"; do
    if grep -q "$test_id" test-integration.html; then
        echo "✅ Test found: $test_id"
    else
        echo "❌ Test missing: $test_id"
        exit 1
    fi
done

echo ""
echo "🧪 Checking test functions..."

# Check for required JavaScript functions
test_functions=(
    "runCoreIntegrationTests"
    "testWasmInitialization"
    "testWebWorkersInitialization"
    "testParallelVanityGeneration"
    "testFallbackMode"
    "exportTestLog"
    "updateLogDisplay"
)

for func in "${test_functions[@]}"; do
    if grep -q "function $func" test-integration.html; then
        echo "✅ Function found: $func"
    else
        echo "❌ Function missing: $func"
        exit 1
    fi
done

echo ""
echo "📊 Test Statistics"
echo "-----------------"

# Count total tests
total_tests=$(grep -o 'status-indicator' test-integration.html | wc -l | tr -d ' ')
echo "Total test indicators: $total_tests"

# Count test sections
sections=$(grep -o '<h3>' test-integration.html | wc -l | tr -d ' ')
echo "Test sections: $sections"

# Check total test count in JavaScript
js_total=$(grep -o 'totalTests = [0-9]*' test-integration.html | grep -o '[0-9]*')
echo "JavaScript total count: $js_total"

if [[ "$total_tests" == "$js_total" ]]; then
    echo "✅ Test count consistency verified"
else
    echo "⚠️  Test count mismatch (indicators: $total_tests, JS: $js_total)"
fi

echo ""
echo "🎯 Validation Summary"
echo "===================="
echo "✅ All required files present"
echo "✅ HTTP server running and accessible"
echo "✅ Core integration tests implemented"
echo "✅ All test functions present"
echo "✅ Test structure validated"

echo ""
echo "🚀 Integration test suite is ready!"
echo "📱 Open: http://localhost:8081/test-integration.html"
echo "🧪 Click 'Run All Tests' to execute the complete test suite"

echo ""
echo "📋 Quick Test Commands:"
echo "  - Full test suite: Open browser and click '🚀 Run All Tests'"
echo "  - Performance only: Click '⚡ Test Performance'"
echo "  - Core tests only: Click '🔬 Core Integration'"
echo "  - Export logs: Click '📋 Export Log'"
echo "  - Reset tests: Click '🔄 Reset Tests'"
echo "  - View live log: Check the test log section at the bottom"
