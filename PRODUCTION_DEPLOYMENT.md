# KB Portal Production Deployment Guide

## Overview

This guide covers the complete production deployment of the NABLA KB Portal to **kb.nabla.ai**.

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Vercel CLI (`npm install -g vercel`)
- Git
- Access to:
  - Vercel account with deployment permissions
  - Supabase production project
  - Railway account (for backend services)
  - Domain registrar for kb.nabla.ai

### Required Credentials
- Supabase production URL and keys
- Stripe API keys (production)
- Sentry DSN (optional but recommended)
- Domain DNS access

## Pre-Deployment Checklist

- [ ] All tests passing (`npm run test:all`)
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)
- [ ] ESLint checks passing (`npm run lint`)
- [ ] Production environment variables configured
- [ ] Database migrations applied to production Supabase
- [ ] SSL certificate ready (handled by Vercel)
- [ ] Monitoring and alerting configured

## Deployment Steps

### 1. Configure Production Environment

#### Vercel Environment Variables

Set these in Vercel Dashboard (Settings > Environment Variables):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Application
NEXT_PUBLIC_APP_URL=https://kb.nabla.ai
NEXT_PUBLIC_APP_NAME=NABLA KB Portal
NODE_ENV=production

# Stripe (Production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Feature Flags
NEXT_PUBLIC_ENABLE_SEARCH=true
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_ENABLE_2FA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...
```

### 2. Apply Database Migrations

```bash
cd kb-portal/database/migrations

# Connect to production Supabase
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Apply migrations in order
\i 001_auth_tier_system.sql
\i 002_user_profiles.sql
\i 003_search_system.sql
\i 004_advanced_filters.sql
\i 005_quota_management.sql
\i 006_document_viewer.sql
\i 007_annotations.sql
\i 008_export_system.sql
\i 009_citation_metadata.sql
\i 010_saved_searches_alerts.sql
\i 011_personalized_recommendations.sql
\i 012_integration_tables.sql
```

### 3. Deploy to Vercel

#### Option A: Automated Deployment Script

```bash
cd kb-portal
./scripts/deploy-production.sh
```

#### Option B: Manual Deployment

```bash
# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Deploy to production
vercel --prod
```

### 4. Configure Custom Domain

#### In Vercel Dashboard:

1. Go to Project Settings > Domains
2. Add domain: `kb.nabla.ai`
3. Configure DNS records as shown:

```
Type: CNAME
Name: kb
Value: cname.vercel-dns.com
```

4. Wait for SSL certificate provisioning (automatic)

#### Verify DNS Configuration:

```bash
dig kb.nabla.ai
nslookup kb.nabla.ai
```

### 5. Setup Monitoring

```bash
cd kb-portal
./scripts/setup-monitoring.sh
```

#### Configure Alerts:

1. **Vercel Dashboard**: Enable Web Analytics and Speed Insights
2. **Sentry**: Create project and configure error tracking
3. **Uptime Monitoring**: Setup external monitoring (UptimeRobot, Pingdom, etc.)

### 6. Verify Deployment

#### Automated Verification:

```bash
./scripts/check-health.sh
```

#### Manual Verification:

1. **Health Check**: https://kb.nabla.ai/api/health
   - Should return `{"status": "healthy"}`

2. **Main Page**: https://kb.nabla.ai
   - Should load without errors
   - Check browser console for errors

3. **Authentication**: https://kb.nabla.ai/login
   - Test login flow
   - Verify tier assignment

4. **Search**: https://kb.nabla.ai/search
   - Test search functionality
   - Verify quota enforcement

5. **Document Viewer**: Test document viewing
   - Open a document
   - Test annotations
   - Test export features

## Post-Deployment Tasks

### 1. Monitor Initial Traffic

```bash
# Watch Vercel logs
vercel logs --follow

# Check health endpoint
watch -n 30 'curl -s https://kb.nabla.ai/api/health | jq .'
```

### 2. Performance Optimization

- [ ] Enable Vercel Edge Caching
- [ ] Configure CDN settings
- [ ] Optimize images with Next.js Image Optimization
- [ ] Enable compression

### 3. Security Hardening

- [ ] Verify SSL/TLS configuration (A+ rating on SSL Labs)
- [ ] Enable security headers (already configured in vercel.production.json)
- [ ] Configure rate limiting
- [ ] Setup WAF rules (if using Cloudflare)

### 4. Backup and Recovery

- [ ] Configure Supabase automated backups
- [ ] Document rollback procedure
- [ ] Test disaster recovery plan

## Monitoring and Maintenance

### Health Checks

```bash
# Quick health check
curl https://kb.nabla.ai/api/health

# Detailed health check with timing
curl -w "@curl-format.txt" -o /dev/null -s https://kb.nabla.ai/api/health
```

### Key Metrics to Monitor

1. **Availability**: Target 99.9% uptime
2. **Response Time**: 
   - P95 < 2s
   - P99 < 5s
3. **Error Rate**: < 1%
4. **Database Performance**: Query time < 200ms
5. **Search Performance**: < 500ms per search

### Log Locations

- **Vercel Logs**: https://vercel.com/dashboard/logs
- **Supabase Logs**: Supabase Dashboard > Logs
- **Sentry Errors**: https://sentry.io/organizations/nabla/issues/

## Rollback Procedure

If issues are detected after deployment:

```bash
# Rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback [deployment-url]
```

## Troubleshooting

### Common Issues

#### 1. Health Check Failing

```bash
# Check Supabase connection
curl https://kb.nabla.ai/api/health | jq '.services.supabase'

# Verify environment variables
vercel env ls
```

#### 2. SSL Certificate Issues

- Wait 5-10 minutes for certificate provisioning
- Verify DNS propagation: `dig kb.nabla.ai`
- Check Vercel domain settings

#### 3. High Response Times

- Check Vercel Analytics for bottlenecks
- Review database query performance in Supabase
- Enable caching for static assets

#### 4. Authentication Issues

- Verify Supabase Auth configuration
- Check CORS settings
- Verify redirect URLs in Supabase dashboard

## Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Uptime | 99.9% | 99.5% |
| P95 Response Time | < 2s | > 5s |
| P99 Response Time | < 5s | > 10s |
| Error Rate | < 1% | > 5% |
| Search Latency | < 500ms | > 2s |
| Database Query Time | < 200ms | > 1s |

## Support and Escalation

### On-Call Contacts

- **Primary**: ops@nabla.ai
- **Secondary**: dev@nabla.ai
- **Emergency**: +XX XXX XXX XXXX

### Escalation Path

1. Check monitoring dashboards
2. Review recent deployments
3. Check Sentry for errors
4. Contact on-call engineer
5. Initiate rollback if necessary

## Maintenance Windows

- **Scheduled Maintenance**: Sundays 02:00-04:00 UTC
- **Emergency Maintenance**: As needed with 1-hour notice
- **Database Maintenance**: Coordinated with Supabase

## Documentation Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [KB Portal User Guide](./README.md)
- [API Documentation](./API.md)

## Changelog

### Version 1.0.0 - Initial Production Release

- ✅ Authentication and tier system
- ✅ Search functionality with quota management
- ✅ Document viewer with annotations
- ✅ Export system (PDF, CSV, JSON)
- ✅ Saved searches and alerts
- ✅ Personalized recommendations
- ✅ Usage dashboard
- ✅ Complete E2E test coverage

## Next Steps

After successful deployment:

1. Monitor application for 24 hours
2. Gather user feedback
3. Plan feature enhancements
4. Schedule regular maintenance
5. Update documentation as needed

---

**Deployment Date**: [To be filled]
**Deployed By**: [To be filled]
**Deployment Version**: 1.0.0
**Status**: ✅ Production Ready
