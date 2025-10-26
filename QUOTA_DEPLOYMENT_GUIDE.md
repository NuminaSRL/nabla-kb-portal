# Quota Management System - Deployment Guide

## Overview

The quota management system provides tier-based usage enforcement for the KB Portal with:
- Real-time quota tracking
- Automatic daily resets
- Upgrade prompts when limits reached
- Usage statistics and analytics
- PostgreSQL-based storage (no Redis required)

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐ ┌─────▼──────────┐
│  Quota Manager  │ │ Quota Middleware│
│   (Service)     │ │   (API Guard)   │
└────────┬────────┘ └─────┬──────────┘
         │                 │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │   Supabase DB   │
         │  (PostgreSQL)   │
         └─────────────────┘
```

## Prerequisites

1. **Supabase Project** with PostgreSQL 15+
2. **Railway Account** (for deployment)
3. **Node.js 18+** and npm
4. **Environment Variables** configured

## Database Setup

### 1. Apply Migration

Run the quota management migration:

```bash
# Connect to your Supabase project
psql "postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres"

# Apply migration
\i kb-portal/database/migrations/005_quota_management.sql
```

Or use Supabase CLI:

```bash
supabase db push --file kb-portal/database/migrations/005_quota_management.sql
```

### 2. Verify Tables

Check that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('quota_usage', 'quota_events', 'quota_reset_log', 'upgrade_prompts');
```

### 3. Test Functions

Test the quota functions:

```sql
-- Test get_quota_usage
SELECT * FROM get_quota_usage('[USER_ID]', 'search');

-- Test increment_quota_usage
SELECT * FROM increment_quota_usage('[USER_ID]', 'search', 1);

-- Test usage statistics
SELECT * FROM get_usage_statistics('[USER_ID]', 7);
```

## Environment Variables

Add these to your `.env.local` file:

```bash
# Quota Management
ENABLE_QUOTA_SCHEDULER=true
ADMIN_API_KEY=your-secure-admin-key-here

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Local Development

### 1. Install Dependencies

```bash
cd kb-portal
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Test Quota System

```bash
# Run quota tests
npm run test:quota

# Or run all tests
npm run test
```

### 4. Manual Quota Reset (Testing)

```bash
# Using curl
curl -X POST http://localhost:3000/api/quota/reset \
  -H "x-admin-api-key: your-admin-key" \
  -H "Authorization: Bearer your-token"
```

## Railway Deployment

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
cd kb-portal
railway init
```

### 2. Configure Environment Variables

In Railway dashboard, add:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENABLE_QUOTA_SCHEDULER=true
ADMIN_API_KEY=your-secure-admin-key
NODE_ENV=production
```

### 3. Deploy

```bash
# Deploy to Railway
railway up

# Or link to GitHub for automatic deployments
railway link
```

### 4. Verify Deployment

```bash
# Check deployment status
railway status

# View logs
railway logs

# Test health endpoint
curl https://your-app.railway.app/api/health
```

## Quota Scheduler Setup

The quota scheduler automatically resets quotas daily at midnight UTC.

### Auto-Start (Production)

The scheduler starts automatically when `ENABLE_QUOTA_SCHEDULER=true`:

```typescript
// In quota-scheduler.ts
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_QUOTA_SCHEDULER === 'true') {
  quotaScheduler.start();
}
```

### Manual Control

Use the admin API to control the scheduler:

```bash
# Get scheduler status
curl https://your-app.railway.app/api/quota/reset \
  -H "x-admin-api-key: your-admin-key"

# Manually trigger reset
curl -X POST https://your-app.railway.app/api/quota/reset \
  -H "x-admin-api-key: your-admin-key"
```

### Monitor Reset Logs

```sql
-- View recent resets
SELECT * FROM quota_reset_log 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for failed resets
SELECT * FROM quota_reset_log 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

## API Endpoints

### Quota Status

```bash
GET /api/quota/status
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "tier": "free",
    "quotas": {
      "search": {
        "usage_count": 5,
        "limit_value": 20,
        "remaining": 15,
        "period_start": "2025-01-01T00:00:00Z",
        "period_end": "2025-01-02T00:00:00Z",
        "is_unlimited": false
      }
    }
  }
}
```

### Usage Statistics

```bash
GET /api/quota/statistics?days=7
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "period_days": 7,
    "statistics": [
      {
        "quota_type": "search",
        "total_usage": 85,
        "avg_daily_usage": 12.14,
        "max_daily_usage": 20,
        "days_at_limit": 2,
        "current_tier": "free"
      }
    ]
  }
}
```

### Upgrade Prompts

```bash
GET /api/quota/prompts
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "prompts": [
      {
        "id": "uuid",
        "prompt_type": "quota_exceeded",
        "quota_type": "search",
        "current_tier": "free",
        "suggested_tier": "pro",
        "shown_at": "2025-01-01T12:00:00Z"
      }
    ]
  }
}
```

### Dismiss/Convert Prompt

```bash
PATCH /api/quota/prompts
Authorization: Bearer {token}
Content-Type: application/json

{
  "prompt_id": "uuid",
  "action": "dismiss" | "convert"
}
```

## Monitoring

### Database Queries

```sql
-- Active users by tier
SELECT tier, COUNT(*) as user_count
FROM user_profiles
GROUP BY tier;

-- Today's quota usage
SELECT 
  u.tier,
  COUNT(DISTINCT qu.user_id) as active_users,
  AVG(qu.usage_count) as avg_usage,
  SUM(CASE WHEN qu.usage_count >= qu.limit_value THEN 1 ELSE 0 END) as users_at_limit
FROM quota_usage qu
JOIN user_profiles u ON u.id = qu.user_id
WHERE qu.period_start = DATE_TRUNC('day', NOW())
GROUP BY u.tier;

-- Upgrade prompt conversion rate
SELECT 
  current_tier,
  suggested_tier,
  COUNT(*) as total_prompts,
  COUNT(CASE WHEN converted_at IS NOT NULL THEN 1 END) as conversions,
  ROUND(100.0 * COUNT(CASE WHEN converted_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as conversion_rate
FROM upgrade_prompts
GROUP BY current_tier, suggested_tier;
```

### Application Logs

```bash
# Railway logs
railway logs --follow

# Filter for quota events
railway logs | grep "quota"

# Check for errors
railway logs | grep "ERROR"
```

## Troubleshooting

### Quota Not Resetting

1. Check scheduler status:
```bash
curl https://your-app.railway.app/api/quota/reset \
  -H "x-admin-api-key: your-admin-key"
```

2. Check reset logs:
```sql
SELECT * FROM quota_reset_log ORDER BY created_at DESC LIMIT 5;
```

3. Manually trigger reset:
```bash
curl -X POST https://your-app.railway.app/api/quota/reset \
  -H "x-admin-api-key: your-admin-key"
```

### Quota Tracking Inaccurate

1. Check database functions:
```sql
-- Test increment function
SELECT * FROM increment_quota_usage('[USER_ID]', 'search', 1);
```

2. Verify RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'quota_usage';
```

3. Check for orphaned records:
```sql
SELECT * FROM quota_usage 
WHERE period_end < NOW() - INTERVAL '7 days';
```

### Upgrade Prompts Not Showing

1. Check prompt creation:
```sql
SELECT * FROM upgrade_prompts 
WHERE user_id = '[USER_ID]' 
ORDER BY shown_at DESC;
```

2. Verify prompt logic:
```sql
SELECT should_show_upgrade_prompt('[USER_ID]', 'search');
```

3. Check frontend component:
```bash
# Check browser console for errors
# Verify API calls in Network tab
```

## Performance Optimization

### Database Indexes

Indexes are automatically created by the migration:

```sql
-- Verify indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('quota_usage', 'quota_events', 'upgrade_prompts');
```

### Query Optimization

Monitor slow queries:

```sql
-- Enable query logging
ALTER DATABASE postgres SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%quota%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Cleanup Old Data

Schedule periodic cleanup:

```sql
-- Delete old quota events (keep 30 days)
DELETE FROM quota_events 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Delete old upgrade prompts (keep 90 days)
DELETE FROM upgrade_prompts 
WHERE shown_at < NOW() - INTERVAL '90 days' 
AND dismissed_at IS NOT NULL;
```

## Security

### API Key Management

1. Generate secure admin API key:
```bash
openssl rand -hex 32
```

2. Store in environment variables (never commit)

3. Rotate keys regularly

### Rate Limiting

The quota system provides built-in rate limiting:
- Free: 20 searches/day
- Pro: 500 searches/day
- Enterprise: Unlimited

### Audit Trail

All quota events are logged:

```sql
SELECT * FROM quota_events 
WHERE user_id = '[USER_ID]' 
ORDER BY created_at DESC 
LIMIT 100;
```

## Testing

### Unit Tests

```bash
# Run quota manager tests
npm run test:unit -- quota-manager

# Run middleware tests
npm run test:unit -- quota-middleware
```

### Integration Tests

```bash
# Run full quota integration tests
npm run test:integration -- quota

# Run with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run Playwright tests
npm run test:e2e -- quota.spec.ts

# Run in headed mode
npm run test:e2e -- quota.spec.ts --headed
```

## Support

For issues or questions:
1. Check logs: `railway logs`
2. Review database: Check `quota_reset_log` and `quota_events`
3. Test API endpoints manually
4. Contact support with error details

