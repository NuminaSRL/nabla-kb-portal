#!/bin/bash

# Setup monitoring and alerting for KB Portal production

set -e

echo "📊 Setting up monitoring for KB Portal"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Setup Vercel Analytics
echo -e "\n${YELLOW}Enabling Vercel Analytics...${NC}"
vercel env add NEXT_PUBLIC_VERCEL_ANALYTICS_ID production

# Setup Vercel Speed Insights
echo -e "\n${YELLOW}Enabling Vercel Speed Insights...${NC}"
echo "Add @vercel/speed-insights to your Next.js app"

# Setup Sentry (if not already configured)
echo -e "\n${YELLOW}Configuring Sentry...${NC}"
if [ ! -f "sentry.properties" ]; then
    cat > sentry.properties << EOF
defaults.url=https://sentry.io/
defaults.org=nabla
defaults.project=kb-portal
EOF
fi

# Create monitoring dashboard script
cat > scripts/check-health.sh << 'EOF'
#!/bin/bash

# Quick health check script
echo "Checking KB Portal health..."

HEALTH=$(curl -s https://kb.nabla.ai/api/health)
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" = "healthy" ]; then
    echo "✅ KB Portal is healthy"
    echo $HEALTH | jq '.'
    exit 0
else
    echo "❌ KB Portal is $STATUS"
    echo $HEALTH | jq '.'
    exit 1
fi
EOF

chmod +x scripts/check-health.sh

echo -e "\n${GREEN}✅ Monitoring setup complete${NC}"
echo -e "\nMonitoring endpoints:"
echo -e "  - Health: https://kb.nabla.ai/api/health"
echo -e "  - Vercel Dashboard: https://vercel.com/dashboard"
echo -e "\nQuick health check: ./scripts/check-health.sh"
