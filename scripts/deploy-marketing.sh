#!/bin/bash

# NABLA KB Portal - Marketing & Onboarding Deployment Script
# This script deploys all marketing and onboarding components

set -e

echo "🚀 NABLA KB Portal - Marketing Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the kb-portal directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must be run from kb-portal directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment Checklist${NC}"
echo "----------------------------"

# Check Node.js version
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js version: $NODE_VERSION"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}  Installing dependencies..."
    npm install
fi
echo -e "${GREEN}✓${NC} Dependencies installed"

# Run type checking
echo ""
echo -e "${BLUE}🔍 Running Type Checks${NC}"
echo "----------------------"
npx tsc --noEmit || {
    echo -e "${RED}❌ Type checking failed${NC}"
    exit 1
}
echo -e "${GREEN}✓${NC} Type checking passed"

# Run linting
echo ""
echo -e "${BLUE}🔍 Running Linter${NC}"
echo "-----------------"
npm run lint || {
    echo -e "${YELLOW}⚠${NC}  Linting warnings found (continuing anyway)"
}
echo -e "${GREEN}✓${NC} Linting complete"

# Build the application
echo ""
echo -e "${BLUE}🏗️  Building Application${NC}"
echo "------------------------"
npm run build || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓${NC} Build successful"

# Verify marketing pages exist
echo ""
echo -e "${BLUE}✅ Verifying Marketing Pages${NC}"
echo "-----------------------------"

PAGES=(
    "src/app/landing/page.tsx"
    "src/app/pricing-comparison/page.tsx"
    "src/app/onboarding/page.tsx"
    "src/app/help/page.tsx"
)

for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo -e "${GREEN}✓${NC} $page"
    else
        echo -e "${RED}❌${NC} $page (missing)"
        exit 1
    fi
done

# Verify documentation
echo ""
echo -e "${BLUE}📚 Verifying Documentation${NC}"
echo "---------------------------"

DOCS=(
    "TUTORIALS.md"
    "MARKETING_DEPLOYMENT.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc"
    else
        echo -e "${RED}❌${NC} $doc (missing)"
        exit 1
    fi
done

# Check environment variables
echo ""
echo -e "${BLUE}🔐 Checking Environment Variables${NC}"
echo "----------------------------------"

if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓${NC} .env.production exists"
    
    # Check for required variables
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "NEXT_PUBLIC_APP_URL"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env.production; then
            echo -e "${GREEN}✓${NC} $var configured"
        else
            echo -e "${YELLOW}⚠${NC}  $var not found in .env.production"
        fi
    done
else
    echo -e "${YELLOW}⚠${NC}  .env.production not found"
fi

# Test pages locally (optional)
echo ""
echo -e "${BLUE}🧪 Local Testing${NC}"
echo "----------------"
read -p "Do you want to test pages locally before deploying? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Starting local server...${NC}"
    echo "Visit the following URLs to test:"
    echo "  - http://localhost:3000/landing"
    echo "  - http://localhost:3000/pricing-comparison"
    echo "  - http://localhost:3000/onboarding"
    echo "  - http://localhost:3000/help"
    echo ""
    echo "Press Ctrl+C when done testing"
    npm run dev
fi

# Deploy to Vercel
echo ""
echo -e "${BLUE}🚀 Deploying to Vercel${NC}"
echo "----------------------"
read -p "Deploy to production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}⚠${NC}  Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    echo -e "${YELLOW}Deploying to Vercel...${NC}"
    vercel --prod || {
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    }
    
    echo ""
    echo -e "${GREEN}✅ Deployment Successful!${NC}"
    echo ""
    echo "Marketing pages are now live:"
    echo "  - Landing: https://your-domain.com/landing"
    echo "  - Pricing: https://your-domain.com/pricing-comparison"
    echo "  - Onboarding: https://your-domain.com/onboarding"
    echo "  - Help: https://your-domain.com/help"
else
    echo -e "${YELLOW}Deployment cancelled${NC}"
fi

# Post-deployment checklist
echo ""
echo -e "${BLUE}📋 Post-Deployment Checklist${NC}"
echo "-----------------------------"
echo "Please verify the following:"
echo ""
echo "[ ] Landing page loads in <1s"
echo "[ ] All CTAs link correctly"
echo "[ ] Pricing page displays all tiers"
echo "[ ] Onboarding flow works end-to-end"
echo "[ ] Help center search is functional"
echo "[ ] Mobile responsive design works"
echo "[ ] Analytics tracking configured"
echo "[ ] SEO metadata is correct"
echo "[ ] All images load properly"
echo "[ ] Contact forms work"
echo ""

# Analytics setup reminder
echo -e "${BLUE}📊 Analytics Setup${NC}"
echo "------------------"
echo "Don't forget to:"
echo "1. Configure Google Analytics"
echo "2. Set up conversion tracking"
echo "3. Create custom events for key actions"
echo "4. Set up email campaign tracking"
echo "5. Configure A/B testing tools"
echo ""

# Success message
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Marketing Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review MARKETING_DEPLOYMENT.md for launch checklist"
echo "2. Set up email campaigns"
echo "3. Configure analytics and tracking"
echo "4. Run A/B tests on key pages"
echo "5. Monitor conversion metrics"
echo ""
echo "For support: support@nabla-kb.com"
echo ""
