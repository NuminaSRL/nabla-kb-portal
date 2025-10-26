#!/bin/bash

# Comprehensive E2E Test Runner Script
# Runs all E2E tests with proper setup and reporting

set -e

echo "🚀 Starting KB Portal E2E Test Suite"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found, creating from .env.example${NC}"
    cp .env.example .env.local
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install Playwright browsers if needed
echo "🌐 Checking Playwright browsers..."
npx playwright install --with-deps

# Build the application
echo "🔨 Building application..."
npm run build

# Create test results directory
mkdir -p test-results
mkdir -p playwright-report

# Function to run tests and capture results
run_test_suite() {
    local test_name=$1
    local test_file=$2
    local project=${3:-chromium}
    
    echo ""
    echo "▶️  Running: $test_name"
    echo "----------------------------------------"
    
    if npx playwright test "$test_file" --project="$project" --reporter=html; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name: FAILED${NC}"
        return 1
    fi
}

# Track test results
FAILED_TESTS=()
PASSED_TESTS=()

# Run Authentication Tests
if run_test_suite "Authentication Tests" "tests/auth.spec.ts"; then
    PASSED_TESTS+=("Authentication")
else
    FAILED_TESTS+=("Authentication")
fi

# Run Search Tests
if run_test_suite "Search Tests" "tests/search.spec.ts"; then
    PASSED_TESTS+=("Search")
else
    FAILED_TESTS+=("Search")
fi

# Run Quota Enforcement Tests
if run_test_suite "Quota Enforcement Tests" "tests/quota-enforcement.spec.ts"; then
    PASSED_TESTS+=("Quota Enforcement")
else
    FAILED_TESTS+=("Quota Enforcement")
fi

# Run Search Performance Tests
if run_test_suite "Search Performance Tests" "tests/search-performance.spec.ts"; then
    PASSED_TESTS+=("Search Performance")
else
    FAILED_TESTS+=("Search Performance")
fi

# Run Document Viewer Tests
if run_test_suite "Document Viewer Tests" "tests/document-viewer-comprehensive.spec.ts"; then
    PASSED_TESTS+=("Document Viewer")
else
    FAILED_TESTS+=("Document Viewer")
fi

# Run Saved Searches Tests
if run_test_suite "Saved Searches Tests" "tests/saved-searches.spec.ts"; then
    PASSED_TESTS+=("Saved Searches")
else
    FAILED_TESTS+=("Saved Searches")
fi

# Run Citations Tests
if run_test_suite "Citations Tests" "tests/citations.spec.ts"; then
    PASSED_TESTS+=("Citations")
else
    FAILED_TESTS+=("Citations")
fi

# Run Export Tests
if run_test_suite "Export Tests" "tests/export.spec.ts"; then
    PASSED_TESTS+=("Export")
else
    FAILED_TESTS+=("Export")
fi

# Run Recommendations Tests
if run_test_suite "Recommendations Tests" "tests/recommendations.spec.ts"; then
    PASSED_TESTS+=("Recommendations")
else
    FAILED_TESTS+=("Recommendations")
fi

# Run Comprehensive E2E Tests
if run_test_suite "Comprehensive E2E Tests" "tests/e2e-comprehensive.spec.ts"; then
    PASSED_TESTS+=("Comprehensive E2E")
else
    FAILED_TESTS+=("Comprehensive E2E")
fi

# Print summary
echo ""
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo ""

if [ ${#PASSED_TESTS[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Passed Tests (${#PASSED_TESTS[@]}):${NC}"
    for test in "${PASSED_TESTS[@]}"; do
        echo "   - $test"
    done
    echo ""
fi

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Failed Tests (${#FAILED_TESTS[@]}):${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo "   - $test"
    done
    echo ""
fi

TOTAL_TESTS=$((${#PASSED_TESTS[@]} + ${#FAILED_TESTS[@]}))
PASS_RATE=$((${#PASSED_TESTS[@]} * 100 / TOTAL_TESTS))

echo "Total Tests: $TOTAL_TESTS"
echo "Pass Rate: $PASS_RATE%"
echo ""

# Open test report
if command -v open &> /dev/null; then
    echo "📄 Opening test report..."
    open playwright-report/index.html
elif command -v xdg-open &> /dev/null; then
    echo "📄 Opening test report..."
    xdg-open playwright-report/index.html
else
    echo "📄 Test report available at: playwright-report/index.html"
fi

# Exit with error if any tests failed
if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed. Please review the report.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
fi
