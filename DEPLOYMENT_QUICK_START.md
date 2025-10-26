# KB Portal - Production Deployment Quick Start

## 🚀 Quick Deployment Guide

This is a condensed version of the full deployment guide. For complete details, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md).

## Prerequisites

```bash
# Install required tools
npm install -g vercel

# Verify installation
vercel --version
node --version
npm --version
```

## 5-Minute Deployment

### 1. Configure Environment Variables

In Vercel Dashboard, add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://kb.nabla.ai
```

### 2. Apply Database Migrations

```bash
cd kb-portal/database/migrations
# Apply all migrations to production Supabase
```

### 3. Deploy

```bash
cd kb-portal
./scripts/deploy-production.sh
```

### 4. Configure Domain

In Vercel Dashboard:
1. Go to Settings > Domains
2. Add: `kb.nabla.ai`
3. Update DNS: `CNAME kb -> cname.vercel-dns.com`

### 5. Verify

```bash
# Check health
curl https://kb.nabla.ai/api/health

# Run performance check
./scripts/performance-check.sh
```

## Common Commands

```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs --follow

# Rollback deployment
vercel rollback

# Check health
./scripts/check-health.sh

# Performance check
./scripts/performance-check.sh
```

## Monitoring URLs

- **Health Check**: https://kb.nabla.ai/api/health
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Main Site**: https://kb.nabla.ai

## Quick Troubleshooting

### Deployment Failed
```bash
# Check build logs
vercel logs

# Verify environment variables
vercel env ls
```

### Health Check Failing
```bash
# Check Supabase connection
curl https://kb.nabla.ai/api/health | jq '.services.supabase'
```

### SSL Issues
- Wait 5-10 minutes for certificate provisioning
- Verify DNS: `dig kb.nabla.ai`

## Emergency Rollback

```bash
# Immediate rollback to previous version
vercel rollback

# Or rollback to specific deployment
vercel rollback [deployment-url]
```

## Support

- **Documentation**: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Email**: ops@nabla.ai

## Next Steps After Deployment

1. ✅ Monitor for 1 hour
2. ✅ Check error rates in Sentry
3. ✅ Verify all features working
4. ✅ Update team on deployment status
5. ✅ Schedule post-deployment review

---

**Need Help?** See the full [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
