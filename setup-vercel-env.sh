#!/bin/bash

# Setup Vercel Environment Variables for KB Portal
# This script configures all required environment variables for production deployment

set -e

echo "🔧 Setting up Vercel environment variables for KB Portal..."
echo "============================================"

# Supabase Configuration
echo "Setting Supabase variables..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://qrczmdhhrzyxwbnpixta.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyY3ptZGhocnp5eHdibnBpeHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjgxODYsImV4cCI6MjA3MzgwNDE4Nn0.qTpdEstW-aWweP9vr3q1x0qsr_9SkBUhATlGcpxrBTA"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyY3ptZGhocnp5eHdibnBpeHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIyODE4NiwiZXhwIjoyMDczODA0MTg2fQ.Q6smJh9wNmsroYreEKMt7DTf9FLAhcOUb068u7I-Jcc"

# Application Configuration
echo "Setting application variables..."
vercel env add NEXT_PUBLIC_APP_URL production <<< "https://kb.nabla.ai"
vercel env add NEXT_PUBLIC_APP_NAME production <<< "NABLA KB Portal"
vercel env add NODE_ENV production <<< "production"

# Feature Flags
echo "Setting feature flags..."
vercel env add NEXT_PUBLIC_ENABLE_SEARCH production <<< "true"
vercel env add NEXT_PUBLIC_ENABLE_AUTH production <<< "true"
vercel env add NEXT_PUBLIC_ENABLE_2FA production <<< "true"
vercel env add NEXT_PUBLIC_ENABLE_ANALYTICS production <<< "true"

# Voyage AI (for embeddings)
echo "Setting Voyage AI variables..."
vercel env add VOYAGE_API_KEY production <<< "pa-7eXPpy-s4gGexJwoDXo1L-HzaWR0v5eQ0H9kuPd0umj"

echo ""
echo "✅ All environment variables configured!"
echo ""
echo "📝 Note: Stripe variables are optional and can be added later if needed:"
echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo "   - STRIPE_SECRET_KEY"
echo "   - NEXT_PUBLIC_STRIPE_PRO_PRICE_ID"
echo "   - NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID"
echo "   - STRIPE_WEBHOOK_SECRET"
echo ""
echo "🚀 Ready to deploy! Run: vercel --prod"
