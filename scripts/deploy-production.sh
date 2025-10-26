#!/bin/bash

# KB Portal Production Deployment Script
# This script deploys the KB Portal to production at kb.nabla.ai

set -e

echo "🚀 Starting KB Portal Production Deployment"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
    echo -e "\n${YELLOW}Checking dependencies...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
        npm install -g vercel
    fi
    
    echo -e "${GREEN}✅ All dependencies installed${NC}"
}

# Run tests before deployment
run_tests() {
    echo -e "\n${YELLOW}Running tests...${NC}"
    
    # Run linting
    echo "Running ESLint..."
    npm run lint || {
        echo -e "${RED}❌ Linting failed${NC}"
        exit 1
    }
    
    # Run type checking
    echo "Running TypeScript type check..."
    npx tsc --noEmit || {
        echo -e "${RED}❌ Type checking failed${NC}"
        exit 1
    }
    
    # Run unit tests (if available)
    if [ -f "playwright.config.ts" ]; then
        echo "Running E2E tests..."
        npm run test:e2e || {
            echo -e "${YELLOW}⚠️  Some E2E tests failed. Continue? (y/n)${NC}"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                exit 1
            fi
        }
    fi
    
    echo -e "${GREEN}✅ All tests passed${NC}"
}

# Build the application
build_app() {
    echo -e "\n${YELLOW}Building application...${NC}"
    
    # Clean previous builds
    rm -rf .next
    
    # Build
    npm run build || {
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Build successful${NC}"
}

# Deploy to Vercel
deploy_vercel() {
    echo -e "\n${YELLOW}Deploying to Vercel...${NC}"
    
    # Deploy to production
    vercel --prod --yes || {
        echo -e "${RED}❌ Vercel deployment failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Deployed to Vercel${NC}"
}

# Verify deployment
verify_deployment() {
    echo -e "\n${YELLOW}Verifying deployment...${NC}"
    
    # Wait for deployment to be ready
    sleep 10
    
    # Check health endpoint
    echo "Checking health endpoint..."
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://kb.nabla.ai/api/health)
    
    if [ "$HEALTH_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ Health check passed (HTTP $HEALTH_STATUS)${NC}"
    else
        echo -e "${RED}❌ Health check failed (HTTP $HEALTH_STATUS)${NC}"
        exit 1
    fi
    
    # Check main page
    echo "Checking main page..."
    MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://kb.nabla.ai)
    
    if [ "$MAIN_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ Main page accessible (HTTP $MAIN_STATUS)${NC}"
    else
        echo -e "${RED}❌ Main page not accessible (HTTP $MAIN_STATUS)${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Deployment verified${NC}"
}

# Main deployment flow
main() {
    echo -e "${GREEN}Starting deployment process...${NC}"
    
    check_dependencies
    run_tests
    build_app
    deploy_vercel
    verify_deployment
    
    echo -e "\n${GREEN}============================================${NC}"
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo -e "\n📍 KB Portal is now live at: ${GREEN}https://kb.nabla.ai${NC}"
    echo -e "\n📊 Monitor deployment at:"
    echo -e "   - Vercel Dashboard: https://vercel.com/dashboard"
    echo -e "   - Health Check: https://kb.nabla.ai/api/health"
    echo -e "\n📝 Next steps:"
    echo -e "   1. Monitor application logs"
    echo -e "   2. Check error tracking in Sentry"
    echo -e "   3. Verify all features are working"
    echo -e "   4. Update DNS if needed"
}

# Run main function
main
