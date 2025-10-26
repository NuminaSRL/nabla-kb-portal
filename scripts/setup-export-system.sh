#!/bin/bash

# Export System Setup Script
# This script sets up the export functionality for KB Portal

set -e

echo "🚀 Setting up Export System..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the kb-portal directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must be run from kb-portal directory${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "\n${YELLOW}Step 1: Installing dependencies...${NC}"
npm install pdfkit @types/pdfkit date-fns

# Step 2: Check Supabase connection
echo -e "\n${YELLOW}Step 2: Checking Supabase connection...${NC}"
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}Warning: NEXT_PUBLIC_SUPABASE_URL not set${NC}"
    echo "Please set your Supabase environment variables in .env.local"
else
    echo -e "${GREEN}✓ Supabase URL configured${NC}"
fi

# Step 3: Database migration instructions
echo -e "\n${YELLOW}Step 3: Database Migration${NC}"
echo "Please apply the database migration:"
echo "  1. Open Supabase Dashboard"
echo "  2. Go to SQL Editor"
echo "  3. Copy contents of database/migrations/008_export_system.sql"
echo "  4. Execute the SQL"
echo ""
echo "Or use Supabase CLI:"
echo "  supabase db push"

# Step 4: Storage bucket setup
echo -e "\n${YELLOW}Step 4: Storage Bucket Setup${NC}"
echo "Create the 'exports' bucket in Supabase Storage:"
echo "  1. Go to Supabase Dashboard > Storage"
echo "  2. Create new bucket named 'exports'"
echo "  3. Set as public bucket"
echo "  4. Apply RLS policies (see EXPORT_SYSTEM_GUIDE.md)"

# Step 5: Tier limits update
echo -e "\n${YELLOW}Step 5: Tier Limits${NC}"
echo "Update tier limits to enable export:"
echo "  UPDATE tier_limits"
echo "  SET export_enabled = true"
echo "  WHERE tier IN ('pro', 'enterprise');"

# Step 6: Build and test
echo -e "\n${YELLOW}Step 6: Build and Test${NC}"
echo "Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Step 7: Run tests
echo -e "\n${YELLOW}Step 7: Running Tests${NC}"
echo "To run export tests:"
echo "  npm run test tests/export.spec.ts"

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Export System Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Apply database migration"
echo "  2. Create storage bucket"
echo "  3. Update tier limits"
echo "  4. Run tests: npm run test tests/export.spec.ts"
echo "  5. Deploy to production"
echo ""
echo "Documentation:"
echo "  - EXPORT_SYSTEM_GUIDE.md"
echo "  - TASK_043_VERIFICATION_CHECKLIST.md"
echo "  - TASK_043_COMPLETION_REPORT.md"
echo ""
echo -e "${GREEN}Happy exporting! 📄✨${NC}"
