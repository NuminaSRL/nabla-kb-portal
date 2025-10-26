# Quota Management System

A comprehensive tier-based quota enforcement system for the KB Portal.

## Overview

The quota management system provides:
- **Real-time usage tracking** using PostgreSQL
- **Tier-based limits**: Free (20/day), Pro (500/day), Enterprise (unlimited)
- **Automatic daily resets** at midnight UTC
- **Smart upgrade prompts** when limits are reached
- **Usage analytics** and statistics

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Frontend Components                 │
│  (QuotaStatus, UpgradePrompt)                   │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│              API Endpoints                       │
│  /api/quota/status                              │
│  /api/quota/statistics                          │
│  /api/quota/prompts                             │
│  /api/quota/reset                               │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           Quota Middleware                       │
│  (checkQuotaMiddleware, withQuotaCheck)         │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│            Quota Manager                         │
│  (checkQuota, incrementQuota, etc.)             │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Supabase PostgreSQL                      │
│  (quota_usage, quota_events, etc.)              │
└──────────────────────────────────────────────────┘
                 ▲
                 │
┌────────────────┴────────────────────────────────┐
│          Quota Scheduler                         │
│  (Daily reset at midnight UTC)                  │
└──────────────────────────────────────────────────┘
```

## Quick Start

### 1. Import the Quota Manager

```typescript
import { quotaManager } from '@/lib/quota';

// Check quota without incrementing
const status = await quotaManager.checkQuota(userId, 'search');
console.log(`Remaining: ${status.usage.remaining}`);

// Increment quota and check
const result = await quotaManager.incrementQuota(userId, 'search');
if (!result.allowed) {
  console.log('Quota exceeded!');
}
```

### 2. Use Quota Middleware in API Routes

```typescript
import { checkQuotaMiddleware } from '@/lib/quota';

export async function POST(request: NextRequest) {
  // Check quota before processing
  const quotaResult = await checkQuotaMiddleware(request, {
    quotaType: 'search',
    increment: 1,
  });

  if (!quotaResult.allowed) {
    return quotaResult.response; // Returns 429 with upgrade info
  }

  // Continue with your logic
  // ...
}
```

### 3. Use HOF Wrapper

```typescript
import { withQuotaCheck } from '@/lib/quota';

export const POST = withQuotaCheck(
  async (request: NextRequest) => {
    // Your handler logic
    return NextResponse.json({ success: true });
  },
  { quotaType: 'search', increment: 1 }
);
```

### 4. Display Quota Status

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

### 5. Show Upgrade Prompts

```tsx
import { UpgradePrompt } from '@/components/quota/UpgradePrompt';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <UpgradePrompt />
    </>
  );
}
```

## API Reference

### QuotaManager

#### `checkQuota(userId: string, quotaType: QuotaType): Promise<QuotaCheckResult>`

Check current quota status without incrementing.

```typescript
const status = await quotaManager.checkQuota(userId, 'search');
console.log(status.usage.remaining); // Remaining quota
console.log(status.quota_exceeded); // true if exceeded
```

#### `incrementQuota(userId: string, quotaType: QuotaType, increment?: number): Promise<QuotaCheckResult>`

Increment quota usage and check if allowed.

```typescript
const result = await quotaManager.incrementQuota(userId, 'search', 1);
if (result.allowed) {
  // Proceed with action
} else {
  // Show upgrade prompt
  console.log(result.suggested_tier);
}
```

#### `getUsageStatistics(userId: string, days?: number): Promise<UsageStatistics[]>`

Get usage statistics for the specified period.

```typescript
const stats = await quotaManager.getUsageStatistics(userId, 7);
stats.forEach(stat => {
  console.log(`${stat.quota_type}: ${stat.avg_daily_usage} avg/day`);
});
```

#### `getAllQuotaStatus(userId: string): Promise<Record<QuotaType, QuotaUsage>>`

Get current status for all quota types.

```typescript
const allStatus = await quotaManager.getAllQuotaStatus(userId);
console.log(allStatus.search.remaining);
console.log(allStatus.export.remaining);
```

#### `getUpgradePrompts(userId: string, includeDismissed?: boolean): Promise<UpgradePrompt[]>`

Get upgrade prompts for the user.

```typescript
const prompts = await quotaManager.getUpgradePrompts(userId);
if (prompts.length > 0) {
  console.log(`Suggested tier: ${prompts[0].suggested_tier}`);
}
```

#### `dismissUpgradePrompt(promptId: string): Promise<void>`

Dismiss an upgrade prompt.

```typescript
await quotaManager.dismissUpgradePrompt(promptId);
```

#### `markUpgradePromptConverted(promptId: string): Promise<void>`

Mark an upgrade prompt as converted (user upgraded).

```typescript
await quotaManager.markUpgradePromptConverted(promptId);
```

### QuotaMiddleware

#### `checkQuotaMiddleware(request: NextRequest, options: QuotaMiddlewareOptions): Promise<QuotaMiddlewareResult>`

Middleware function to check and enforce quotas.

```typescript
const result = await checkQuotaMiddleware(request, {
  quotaType: 'search',
  increment: 1,
  checkOnly: false, // Set to true to check without incrementing
});

if (!result.allowed) {
  return result.response; // 429 error with upgrade info
}
```

#### `withQuotaCheck(handler, options): Handler`

Higher-order function to wrap API handlers with quota checking.

```typescript
export const POST = withQuotaCheck(
  async (request) => {
    // Your logic here
  },
  { quotaType: 'search', increment: 1 }
);
```

#### `addQuotaHeaders(response: NextResponse, userId: string, quotaType: QuotaType): Promise<NextResponse>`

Add rate limit headers to response.

```typescript
let response = NextResponse.json({ data });
response = await addQuotaHeaders(response, userId, 'search');
// Adds: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
```

### QuotaScheduler

#### `start(): void`

Start the daily quota reset scheduler.

```typescript
import { quotaScheduler } from '@/lib/quota';

quotaScheduler.start();
```

#### `stop(): void`

Stop the scheduler.

```typescript
quotaScheduler.stop();
```

#### `manualReset(): Promise<void>`

Manually trigger a quota reset (for testing).

```typescript
await quotaScheduler.manualReset();
```

#### `getStatus(): { running: boolean; nextReset: Date | null }`

Get scheduler status.

```typescript
const status = quotaScheduler.getStatus();
console.log(`Running: ${status.running}`);
console.log(`Next reset: ${status.nextReset}`);
```

## Types

### QuotaType

```typescript
type QuotaType = 'search' | 'export' | 'api_call';
```

### QuotaUsage

```typescript
interface QuotaUsage {
  usage_count: number;
  limit_value: number;
  remaining: number;
  period_start: string;
  period_end: string;
  is_unlimited: boolean;
}
```

### QuotaCheckResult

```typescript
interface QuotaCheckResult {
  allowed: boolean;
  usage: QuotaUsage;
  quota_exceeded: boolean;
  show_upgrade_prompt: boolean;
  suggested_tier?: UserTier;
}
```

### UsageStatistics

```typescript
interface UsageStatistics {
  quota_type: string;
  total_usage: number;
  avg_daily_usage: number;
  max_daily_usage: number;
  days_at_limit: number;
  current_tier: UserTier;
}
```

### UpgradePrompt

```typescript
interface UpgradePrompt {
  id: string;
  prompt_type: string;
  quota_type: string;
  current_tier: UserTier;
  suggested_tier: UserTier;
  shown_at: string;
  dismissed_at?: string;
  converted_at?: string;
  metadata?: Record<string, any>;
}
```

## Tier Limits

| Tier       | Searches/Day | Results/Search | Export | API Access |
|------------|--------------|----------------|--------|------------|
| Free       | 20           | 5              | ❌     | ❌         |
| Pro        | 500          | 50             | ✅     | ❌         |
| Enterprise | Unlimited    | 100            | ✅     | ✅         |

## Database Schema

### Tables

- **quota_usage**: Current quota usage per user/type/period
- **quota_events**: Detailed event log for analytics
- **quota_reset_log**: Reset execution tracking
- **upgrade_prompts**: User upgrade prompt management

### Functions

- `get_quota_usage(user_id, quota_type)`: Get current usage
- `increment_quota_usage(user_id, quota_type, increment)`: Increment usage
- `reset_daily_quotas()`: Reset all quotas
- `get_usage_statistics(user_id, days)`: Get statistics
- `should_show_upgrade_prompt(user_id, quota_type)`: Check prompt display

## Environment Variables

```bash
# Enable automatic daily resets
ENABLE_QUOTA_SCHEDULER=true

# Admin API key for manual resets
ADMIN_API_KEY=your-secure-key

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
```

## Error Handling

### Quota Exceeded (429)

```json
{
  "error": "Quota exceeded",
  "message": "You have reached your search limit for today",
  "quota": {
    "usage": 20,
    "limit": 20,
    "remaining": 0,
    "period_end": "2025-01-17T00:00:00Z"
  },
  "upgrade": {
    "current_tier": "free",
    "suggested_tier": "pro",
    "message": "Upgrade to pro for higher limits"
  }
}
```

### Unauthorized (401)

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Internal Error (500)

```json
{
  "error": "Internal server error",
  "message": "Failed to check quota"
}
```

## Testing

```typescript
import { test, expect } from '@playwright/test';

test('should enforce free tier limits', async ({ page }) => {
  // Perform 20 searches
  for (let i = 0; i < 20; i++) {
    await page.goto('/search');
    await page.fill('input', `query ${i}`);
    await page.press('input', 'Enter');
  }

  // 21st search should be blocked
  await page.goto('/search');
  await page.fill('input', 'query 21');
  await page.press('input', 'Enter');
  
  await expect(page.locator('text=/quota.*exceeded/i')).toBeVisible();
});
```

## Monitoring

### Database Queries

```sql
-- Active users by tier
SELECT tier, COUNT(*) as users
FROM user_profiles
GROUP BY tier;

-- Today's usage
SELECT 
  u.tier,
  AVG(qu.usage_count) as avg_usage,
  COUNT(*) FILTER (WHERE qu.usage_count >= qu.limit_value) as at_limit
FROM quota_usage qu
JOIN user_profiles u ON u.id = qu.user_id
WHERE qu.period_start = CURRENT_DATE
GROUP BY u.tier;

-- Conversion rate
SELECT 
  current_tier,
  suggested_tier,
  COUNT(*) as prompts,
  COUNT(*) FILTER (WHERE converted_at IS NOT NULL) as conversions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE converted_at IS NOT NULL) / COUNT(*), 2) as rate
FROM upgrade_prompts
GROUP BY current_tier, suggested_tier;
```

### Application Logs

```bash
# Railway logs
railway logs | grep "quota"

# Check for errors
railway logs | grep "ERROR.*quota"

# Monitor resets
railway logs | grep "reset"
```

## Troubleshooting

### Quota not resetting

1. Check scheduler status: `quotaScheduler.getStatus()`
2. Check reset logs: `SELECT * FROM quota_reset_log ORDER BY created_at DESC`
3. Manually trigger: `await quotaScheduler.manualReset()`

### Inaccurate tracking

1. Verify database functions work
2. Check for race conditions
3. Review quota_events table for anomalies

### Upgrade prompts not showing

1. Check `should_show_upgrade_prompt()` function
2. Verify 24-hour cooldown logic
3. Check frontend component integration

## Best Practices

1. **Always use middleware** for API routes that consume quota
2. **Add rate limit headers** to all quota-enforced responses
3. **Monitor conversion rates** to optimize upgrade prompts
4. **Set up alerts** for failed resets
5. **Regularly review** usage statistics for anomalies

## Support

For issues or questions:
1. Check the deployment guide: `QUOTA_DEPLOYMENT_GUIDE.md`
2. Review test suite: `tests/quota.spec.ts`
3. Check database logs: `SELECT * FROM quota_events`
4. Contact support with error details

