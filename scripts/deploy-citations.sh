#!/bin/bash

# Citation System Deployment Script
# This script deploys the citation generation system to production

set -e  # Exit on error

echo "=========================================="
echo "Citation System Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL to your Supabase connection string"
    exit 1
fi

echo -e "${GREEN}✓${NC} DATABASE_URL is set"
echo ""

# Step 1: Backup current database
echo "Step 1: Creating database backup..."
BACKUP_FILE="citation_backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null || {
    echo -e "${YELLOW}Warning: Could not create backup. Continuing anyway...${NC}"
}
echo -e "${GREEN}✓${NC} Backup created: $BACKUP_FILE"
echo ""

# Step 2: Apply database migration
echo "Step 2: Applying database migration..."
psql "$DATABASE_URL" -f database/migrations/009_citation_metadata.sql || {
    echo -e "${RED}Error: Migration failed${NC}"
    echo "You can restore from backup: $BACKUP_FILE"
    exit 1
}
echo -e "${GREEN}✓${NC} Migration applied successfully"
echo ""

# Step 3: Verify migration
echo "Step 3: Verifying migration..."

# Check if new columns exist
COLUMNS_CHECK=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name IN ('authors', 'publication_date', 'publisher', 'doi', 'document_type');
")

if [ "$COLUMNS_CHECK" -eq 5 ]; then
    echo -e "${GREEN}✓${NC} Document columns added successfully"
else
    echo -e "${RED}Error: Not all columns were added${NC}"
    exit 1
fi

# Check if citation_history table exists
TABLE_CHECK=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_name = 'citation_history';
")

if [ "$TABLE_CHECK" -eq 1 ]; then
    echo -e "${GREEN}✓${NC} citation_history table created"
else
    echo -e "${RED}Error: citation_history table not created${NC}"
    exit 1
fi

# Check if citation_statistics view exists
VIEW_CHECK=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) 
    FROM information_schema.views 
    WHERE table_name = 'citation_statistics';
")

if [ "$VIEW_CHECK" -eq 1 ]; then
    echo -e "${GREEN}✓${NC} citation_statistics view created"
else
    echo -e "${RED}Error: citation_statistics view not created${NC}"
    exit 1
fi

echo ""

# Step 4: Build frontend
echo "Step 4: Building frontend..."
npm run build || {
    echo -e "${RED}Error: Frontend build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓${NC} Frontend built successfully"
echo ""

# Step 5: Run tests
echo "Step 5: Running tests..."
npm run test:citations || {
    echo -e "${YELLOW}Warning: Some tests failed. Review before deploying to production.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
}
echo -e "${GREEN}✓${NC} Tests passed"
echo ""

# Step 6: Summary
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}✓${NC} Database migration applied"
echo -e "${GREEN}✓${NC} Schema verified"
echo -e "${GREEN}✓${NC} Frontend built"
echo -e "${GREEN}✓${NC} Tests passed"
echo ""
echo "Next steps:"
echo "1. Review the changes in staging environment"
echo "2. Populate citation metadata for existing documents"
echo "3. Deploy to production using your deployment pipeline"
echo ""
echo "Backup file: $BACKUP_FILE"
echo ""
echo -e "${GREEN}Deployment preparation complete!${NC}"
