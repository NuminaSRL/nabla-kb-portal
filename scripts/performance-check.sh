#!/bin/bash

# Performance monitoring script for KB Portal

set -e

echo "🔍 KB Portal Performance Check"
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="https://kb.nabla.ai"

# Function to measure response time
measure_response_time() {
    local url=$1
    local name=$2
    
    echo -e "\n${YELLOW}Testing: $name${NC}"
    
    # Measure response time
    response_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$url")
    status_code=$(curl -o /dev/null -s -w '%{http_code}\n' "$url")
    
    # Convert to milliseconds
    response_ms=$(echo "$response_time * 1000" | bc)
    
    echo "  URL: $url"
    echo "  Status: $status_code"
    echo "  Response Time: ${response_ms}ms"
    
    # Check thresholds
    if (( $(echo "$response_time > 5" | bc -l) )); then
        echo -e "  ${RED}❌ CRITICAL: Response time > 5s${NC}"
        return 1
    elif (( $(echo "$response_time > 2" | bc -l) )); then
        echo -e "  ${YELLOW}⚠️  WARNING: Response time > 2s${NC}"
    else
        echo -e "  ${GREEN}✅ OK${NC}"
    fi
    
    return 0
}

# Function to check SSL
check_ssl() {
    echo -e "\n${YELLOW}Checking SSL Certificate...${NC}"
    
    ssl_info=$(echo | openssl s_client -servername kb.nabla.ai -connect kb.nabla.ai:443 2>/dev/null | openssl x509 -noout -dates)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ SSL Certificate Valid${NC}"
        echo "$ssl_info"
    else
        echo -e "${RED}❌ SSL Certificate Issues${NC}"
        return 1
    fi
}

# Function to check CDN
check_cdn() {
    echo -e "\n${YELLOW}Checking CDN Configuration...${NC}"
    
    cdn_headers=$(curl -s -I "$BASE_URL" | grep -i "cache\|cdn\|x-vercel")
    
    if [ -n "$cdn_headers" ]; then
        echo -e "${GREEN}✅ CDN Active${NC}"
        echo "$cdn_headers"
    else
        echo -e "${YELLOW}⚠️  CDN headers not detected${NC}"
    fi
}

# Function to check security headers
check_security_headers() {
    echo -e "\n${YELLOW}Checking Security Headers...${NC}"
    
    headers=$(curl -s -I "$BASE_URL")
    
    required_headers=(
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
        "Referrer-Policy"
    )
    
    all_present=true
    for header in "${required_headers[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            echo -e "  ${GREEN}✅ $header${NC}"
        else
            echo -e "  ${RED}❌ $header missing${NC}"
            all_present=false
        fi
    done
    
    if [ "$all_present" = true ]; then
        echo -e "\n${GREEN}✅ All security headers present${NC}"
    else
        echo -e "\n${RED}❌ Some security headers missing${NC}"
        return 1
    fi
}

# Function to check compression
check_compression() {
    echo -e "\n${YELLOW}Checking Compression...${NC}"
    
    encoding=$(curl -s -I -H "Accept-Encoding: gzip, deflate, br" "$BASE_URL" | grep -i "content-encoding")
    
    if echo "$encoding" | grep -qi "gzip\|br"; then
        echo -e "${GREEN}✅ Compression Enabled${NC}"
        echo "$encoding"
    else
        echo -e "${YELLOW}⚠️  Compression not detected${NC}"
    fi
}

# Main performance tests
main() {
    echo -e "${GREEN}Starting performance checks...${NC}\n"
    
    failed_checks=0
    
    # Test critical endpoints
    measure_response_time "$BASE_URL" "Home Page" || ((failed_checks++))
    measure_response_time "$BASE_URL/api/health" "Health Check" || ((failed_checks++))
    measure_response_time "$BASE_URL/search" "Search Page" || ((failed_checks++))
    measure_response_time "$BASE_URL/login" "Login Page" || ((failed_checks++))
    
    # SSL check
    check_ssl || ((failed_checks++))
    
    # CDN check
    check_cdn
    
    # Security headers
    check_security_headers || ((failed_checks++))
    
    # Compression
    check_compression
    
    # Summary
    echo -e "\n=============================="
    if [ $failed_checks -eq 0 ]; then
        echo -e "${GREEN}✅ All performance checks passed${NC}"
        exit 0
    else
        echo -e "${RED}❌ $failed_checks check(s) failed${NC}"
        exit 1
    fi
}

# Run main function
main
