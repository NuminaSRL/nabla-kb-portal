#!/bin/bash

# Verify KB Portal is ready for production deployment

set -e

echo "🔍 Verifying KB Portal Deployment Readiness"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

checks_passed=0
checks_failed=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        ((checks_passed++))
    else
        echo -e "${RED}❌ $description - File not found: $file${NC}"
        ((checks_failed++))
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        ((checks_passed++))
    else
        echo -e "${RED}❌ $description - Directory not found: $dir${NC}"
        ((checks_failed++))
    fi
}

echo -e "\n${YELLOW}Checking Configuration Files...${NC}"
check_file ".env.production" "Production environment template"
check_file "vercel.production.json" "Vercel production config"
check_file "railway.production.json" "Railway production config"
check_file "next.config.js" "Next.js configuration"

echo -e "\n${YELLOW}Checking Deployment Scripts...${NC}"
check_file "scripts/deploy-production.sh" "Deployment script"
check_file "scripts/setup-monitoring.sh" "Monitoring setup script"
check_file "scripts/performance-check.sh" "Performance check script"

echo -e "\n${YELLOW}Checking API Endpoints...${NC}"
check_file "src/app/api/health/route.ts" "Health check endpoint"

echo -e "\n${YELLOW}Checking Documentation...${NC}"
check_file "PRODUCTION_DEPLOYMENT.md" "Production deployment guide"
check_file "DEPLOYMENT_CHECKLIST.md" "Deployment checklist"
check_file "DEPLOYMENT_QUICK_START.md" "Quick start guide"

echo -e "\n${YELLOW}Checking Monitoring Configuration...${NC}"
check_dir "monitoring" "Monitoring directory"
check_file "monitoring/vercel-monitoring.json" "Monitoring configuration"

echo -e "\n${YELLOW}Checking Database Migrations...${NC}"
check_dir "database/migrations" "Migrations directory"

echo -e "\n${YELLOW}Checking Build Configuration...${NC}"
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json exists${NC}"
    ((checks_passed++))
    
    # Check for required scripts
    if grep -q '"build"' package.json; then
        echo -e "${GREEN}✅ Build script configured${NC}"
        ((checks_passed++))
    else
        echo -e "${RED}❌ Build script missing${NC}"
        ((checks_failed++))
    fi
else
    echo -e "${RED}❌ package.json not found${NC}"
    ((checks_failed++))
fi

# Summary
echo -e "\n==========================================="
echo -e "Deployment Readiness Check Complete"
echo -e "==========================================="
echo -e "Checks Passed: ${GREEN}$checks_passed${NC}"
echo -e "Checks Failed: ${RED}$checks_failed${NC}"

if [ $checks_failed -eq 0 ]; then
    echo -e "\n${GREEN}✅ KB Portal is READY for production deployment!${NC}"
    echo -e "\nNext steps:"
    echo -e "  1. Configure production environment variables in Vercel"
    echo -e "  2. Apply database migrations to production Supabase"
    echo -e "  3. Run: ./scripts/deploy-production.sh"
    exit 0
else
    echo -e "\n${RED}❌ KB Portal is NOT ready for deployment${NC}"
    echo -e "Please fix the issues above before deploying."
    exit 1
fi
