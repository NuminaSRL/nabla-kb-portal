# Quota Management - Quick Start Guide

Get the quota management system up and running in 5 minutes.

## Prerequisites

- Supabase project with PostgreSQL 15+
- Node.js 18+
- Railway account (for deployment)

## Step 1: Database Setup (2 minutes)

### Apply Migration

```bash
# Connect to Supabase
psql "postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres"

# Apply migration
\i kb-portal/database/migrations/005_quota_management.sql
```

Or use Supabase CLI:

```bash
supabase db push --file kb-portal/database/migrations/005_quota_management.sql
```

### Verify

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('quota_usage', 'quota_events', 'quota_reset_log', 'upgrade_prompts');

-- Should return 4 rows
```

## Step 2: Environment Variables (1 minute)

Add to `.env.local`:

```bash
# Quota Management
ENABLE_QUOTA_SCHEDULER=true
ADMIN_API_KEY=your-secure-random-key-here

# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Generate secure admin key:

```bash
openssl rand -hex 32
```

## Step 3: Install & Run (1 minute)

```bash
cd kb-portal
npm install
npm run dev
```

Visit: http://localhost:3000

## Step 4: Test Quota System (1 minute)

### Test API Endpoint

```bash
# Get quota status (requires auth token)
curl http://localhost:3000/api/quota/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test in Browser

1. Login to the application
2. Go to Dashboard
3. Look for "Quota Status" card
4. Perform a search
5. Watch quota count increment

## Step 5: Deploy to Railway (Optional)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

## Usage Examples

### Check Quota in Your Code

```typescript
import { quotaManager } from '@/lib/quota';

// Check quota
const status = await quotaManager.checkQuota(userId, 'search');
console.log(`Remaining: ${status.usage.remaining}`);

// Increment quota
const result = await quotaManager.incrementQuota(userId, 'search');
if (!result.allowed) {
  console.log('Quota exceeded!');
}
```

### Protect API Route

```typescript
import { checkQuotaMiddleware } from '@/lib/quota';

export async function POST(request: NextRequest) {
  // Check quota
  const quotaResult = await checkQuotaMiddleware(request, {
    quotaType: 'search',
    increment: 1,
  });

  if (!quotaResult.allowed) {
    return quotaResult.response; // 429 error
  }

  // Your logic here
  return NextResponse.json({ success: true });
}
```

### Display Quota Status

```tsx
import { QuotaStatus } from '@/components/quota/QuotaStatus';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <QuotaStatus />
    </div>
  );
}
```

## Tier Limits

| Tier       | Searches/Day | Results/Search |
|------------|--------------|----------------|
| Free       | 20           | 5              |
| Pro        | 500          | 50             |
| Enterprise | Unlimited    | 100            |

## Common Issues

### Quota not tracking

**Problem**: Usage count not incrementing

**Solution**:
```sql
-- Test database function
SELECT * FROM increment_quota_usage('[USER_ID]', 'search', 1);
```

### Scheduler not running

**Problem**: Quotas not resetting daily

**Solution**:
```bash
# Check environment variable
echo $ENABLE_QUOTA_SCHEDULER  # Should be 'true'

# Manually trigger reset
curl -X POST http://localhost:3000/api/quota/reset \
  -H "x-admin-api-key: YOUR_ADMIN_KEY"
```

### Upgrade prompts not showing

**Problem**: No prompts when quota exceeded

**Solution**:
```sql
-- Check if prompts are being created
SELECT * FROM upgrade_prompts 
WHERE user_id = '[USER_ID]' 
ORDER BY shown_at DESC;
```

## Next Steps

1. **Read Full Documentation**: `QUOTA_DEPLOYMENT_GUIDE.md`
2. **Run Tests**: `npm run test -- quota.spec.ts`
3. **Monitor Usage**: Check `quota_events` table
4. **Customize Tiers**: Modify `tier_limits` table
5. **Set Up Alerts**: Configure monitoring

## Support

- **Documentation**: See `kb-portal/src/lib/quota/README.md`
- **Deployment Guide**: See `QUOTA_DEPLOYMENT_GUIDE.md`
- **Verification**: See `QUOTA_VERIFICATION_CHECKLIST.md`
- **Tests**: See `kb-portal/tests/quota.spec.ts`

## Quick Reference

### Database Functions

```sql
-- Get quota usage
SELECT * FROM get_quota_usage('[USER_ID]', 'search');

-- Increment quota
SELECT * FROM increment_quota_usage('[USER_ID]', 'search', 1);

-- Get statistics
SELECT * FROM get_usage_statistics('[USER_ID]', 7);

-- Reset quotas
SELECT * FROM reset_daily_quotas();
```

### API Endpoints

```bash
GET  /api/quota/status       # Current quota status
GET  /api/quota/statistics   # Usage statistics
GET  /api/quota/prompts      # Upgrade prompts
PATCH /api/quota/prompts     # Dismiss/convert prompt
GET  /api/quota/reset        # Scheduler status (admin)
POST /api/quota/reset        # Manual reset (admin)
```

### Environment Variables

```bash
ENABLE_QUOTA_SCHEDULER=true              # Enable daily resets
ADMIN_API_KEY=your-key                   # Admin API access
NEXT_PUBLIC_SUPABASE_URL=your-url        # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=your-key       # Service role key
```

---

**You're all set!** The quota management system is now running. 🎉

