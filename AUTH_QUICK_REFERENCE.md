# Authentication System - Quick Reference

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Run tests
npm test
```

## Common Tasks

### Check User Authentication

```typescript
import { authService } from '@/lib/auth/auth-service';

// Get current user
const { user } = await authService.getUser();

// Get user profile with tier
const { profile } = await authService.getUserProfile(user.id);
```

### Check Feature Access

```typescript
import { tierService } from '@/lib/auth/tier-service';

// Check if user has feature access
const hasAccess = await tierService.hasFeatureAccess(userId, 'advanced_filters');

// Get tier features
const features = tierService.getTierFeatures('pro');
```

### Track Usage

```typescript
import { authService } from '@/lib/auth/auth-service';

// Check if user can perform action
const { allowed } = await authService.checkUsageLimit(userId, 'search');

if (allowed) {
  // Perform action
  // ...
  
  // Track usage
  await authService.trackUsage(userId, 'search', { query: 'GDPR' });
}
```

### Get Usage Statistics

```typescript
import { authService } from '@/lib/auth/auth-service';

const { stats } = await authService.getUsageStats(userId);

console.log(`Searches today: ${stats.searches_today}/${stats.searches_limit}`);
console.log(`Can search: ${stats.can_search}`);
```

## API Endpoints

### Authentication

```typescript
// Sign up
POST /api/auth/signup
Body: { email, password, full_name }

// Sign in
POST /api/auth/signin
Body: { email, password }

// Sign out
POST /api/auth/signout

// OAuth
GET /api/auth/oauth?provider=google|azure
```

### User Management

```typescript
// Get profile
GET /api/user/profile

// Update profile
PUT /api/user/profile
Body: { full_name }

// Get usage stats
GET /api/user/usage

// Enable 2FA
POST /api/user/2fa/enable

// Verify 2FA
POST /api/user/2fa/verify
Body: { code }
```

## Database Queries

### Check User Tier

```sql
SELECT tier FROM user_profiles WHERE id = 'user-id';
```

### Get Usage Today

```sql
SELECT action_count 
FROM usage_tracking 
WHERE user_id = 'user-id' 
  AND action_type = 'search' 
  AND action_date = CURRENT_DATE;
```

### Get Tier Limits

```sql
SELECT * FROM tier_limits WHERE tier = 'pro';
```

### Check Trial Status

```sql
SELECT 
  tier,
  trial_ends_at,
  CASE 
    WHEN trial_ends_at > NOW() THEN true 
    ELSE false 
  END as is_trial
FROM user_profiles 
WHERE id = 'user-id';
```

## Component Usage

### Protect a Page

```typescript
// app/protected-page/page.tsx
import { redirect } from 'next/navigation';
import { authService } from '@/lib/auth/auth-service';

export default async function ProtectedPage() {
  const { user } = await authService.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return <div>Protected content</div>;
}
```

### Check Feature in Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { tierService } from '@/lib/auth/tier-service';

export default function FeatureComponent() {
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    async function checkAccess() {
      const access = await tierService.hasFeatureAccess(userId, 'export_enabled');
      setHasAccess(access);
    }
    checkAccess();
  }, []);
  
  if (!hasAccess) {
    return <div>Upgrade to access this feature</div>;
  }
  
  return <div>Feature content</div>;
}
```

### Display Usage Stats

```typescript
'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/auth/auth-service';

export default function UsageWidget() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    async function loadStats() {
      const { stats } = await authService.getUsageStats(userId);
      setStats(stats);
    }
    loadStats();
  }, []);
  
  if (!stats) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Searches: {stats.searches_today}/{stats.searches_limit}</p>
      <div className="progress-bar" style={{ width: `${stats.percentage_used}%` }} />
    </div>
  );
}
```

## Tier Configuration

### Free Tier

```typescript
{
  searches_per_day: 20,
  results_per_search: 5,
  advanced_filters: false,
  saved_searches: false,
  export_enabled: false,
  api_access: false,
  priority_support: false,
  custom_integrations: false
}
```

### Pro Tier ($49/month)

```typescript
{
  searches_per_day: 500,
  results_per_search: 50,
  advanced_filters: true,
  saved_searches: true,
  export_enabled: true,
  api_access: false,
  priority_support: false,
  custom_integrations: false
}
```

### Enterprise Tier ($299/month)

```typescript
{
  searches_per_day: -1, // Unlimited
  results_per_search: 100,
  advanced_filters: true,
  saved_searches: true,
  export_enabled: true,
  api_access: true,
  priority_support: true,
  custom_integrations: true
}
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test

```bash
npx playwright test tests/auth.spec.ts
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Tests in Headed Mode

```bash
npm run test:headed
```

## Troubleshooting

### User Can't Sign In

1. Check Supabase Auth logs
2. Verify email is confirmed
3. Check password is correct
4. Review browser console for errors

### OAuth Not Working

1. Verify redirect URLs in provider settings
2. Check client ID and secret
3. Ensure provider is enabled in Supabase
4. Review OAuth configuration

### Usage Limits Not Working

1. Check tier_limits table
2. Verify usage_tracking function
3. Review RLS policies
4. Check user tier value

### 2FA Issues

1. Verify MFA enabled in Supabase
2. Check user tier (Pro/Enterprise only)
3. Test with authenticator app
4. Review 2FA implementation

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Optional (for Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Useful SQL Queries

### List All Users

```sql
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.tier,
  up.created_at
FROM user_profiles up
ORDER BY up.created_at DESC;
```

### Get User with Usage

```sql
SELECT 
  up.email,
  up.tier,
  COALESCE(SUM(ut.action_count), 0) as searches_today
FROM user_profiles up
LEFT JOIN usage_tracking ut ON ut.user_id = up.id 
  AND ut.action_type = 'search' 
  AND ut.action_date = CURRENT_DATE
WHERE up.id = 'user-id'
GROUP BY up.id, up.email, up.tier;
```

### Tier Distribution

```sql
SELECT 
  tier,
  COUNT(*) as user_count
FROM user_profiles
GROUP BY tier
ORDER BY user_count DESC;
```

### Active Trials

```sql
SELECT 
  email,
  tier,
  trial_ends_at,
  DATE_PART('day', trial_ends_at - NOW()) as days_remaining
FROM user_profiles
WHERE trial_ends_at > NOW()
  AND tier = 'free'
ORDER BY trial_ends_at ASC;
```

## Support

- Documentation: See `TASK_036_IMPLEMENTATION.md`
- Deployment: See `DEPLOYMENT_AUTH.md`
- Issues: Check GitHub issues
- Questions: Contact development team
