# KB Portal Authentication System - Deployment Guide

## Prerequisites

- Supabase project created
- Vercel account (for deployment)
- Node.js 18+ installed
- npm or yarn package manager

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 1.2 Apply Database Migration

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `kb-portal/database/migrations/001_auth_tier_system.sql`
4. Execute the SQL script
5. Verify tables are created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- user_profiles
- tier_limits
- usage_tracking
- oauth_providers
- saved_searches
- search_history
- audit_log

### 1.3 Configure Authentication Providers

#### Email Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates (optional)

#### Google OAuth

1. Go to Authentication > Providers
2. Enable Google provider
3. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com):
   - Create new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

#### Microsoft OAuth

1. Go to Authentication > Providers
2. Enable Azure (Microsoft) provider
3. Create app registration in [Azure Portal](https://portal.azure.com):
   - Go to Azure Active Directory > App registrations
   - Create new registration
   - Add redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
   - Create client secret
4. Copy Application (client) ID and Client Secret to Supabase

### 1.4 Configure Site URL

1. Go to Authentication > URL Configuration
2. Set Site URL: `https://kb.nabla.ai` (or your domain)
3. Add Redirect URLs:
   - `https://kb.nabla.ai/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

## Step 2: Environment Configuration

### 2.1 Create Environment File

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 2.2 Configure Environment Variables

Edit `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=NABLA KB Portal

# Stripe Configuration (optional for now)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Feature Flags
NEXT_PUBLIC_ENABLE_SEARCH=true
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_ENABLE_2FA=true
```

## Step 3: Install Dependencies

```bash
cd kb-portal
npm install
```

## Step 4: Local Development

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Test Authentication

1. Open http://localhost:3000
2. Click "Sign Up"
3. Create test account
4. Verify email (check Supabase Auth > Users)
5. Sign in
6. Access dashboard

### 4.3 Run Tests

```bash
# Install Playwright browsers
npx playwright install

# Run tests
npm test

# Run tests with UI
npm run test:ui
```

## Step 5: Vercel Deployment

### 5.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Select `kb-portal` as root directory

### 5.2 Configure Environment Variables

Add all environment variables from `.env.local`:

1. Go to Project Settings > Environment Variables
2. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (use your Vercel domain)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - etc.

### 5.3 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployment URL

### 5.4 Update Supabase Redirect URLs

1. Go to Supabase Dashboard
2. Authentication > URL Configuration
3. Add your Vercel URL to Redirect URLs:
   - `https://your-app.vercel.app/auth/callback`

## Step 6: Stripe Integration (Optional)

### 6.1 Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create account or sign in
3. Switch to Test mode

### 6.2 Create Products and Prices

#### Pro Plan

1. Go to Products > Add Product
2. Name: "Pro Plan"
3. Price: $49/month
4. Copy Price ID to `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

#### Enterprise Plan

1. Go to Products > Add Product
2. Name: "Enterprise Plan"
3. Price: $299/month
4. Copy Price ID to `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID`

### 6.3 Configure Webhooks

1. Go to Developers > Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy Signing Secret to `STRIPE_WEBHOOK_SECRET`

### 6.4 Update Environment Variables

Add Stripe variables to Vercel:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

## Step 7: Verification

### 7.1 Test Authentication Flows

1. **Sign Up**:
   - Create new account
   - Verify email received
   - Check user in Supabase Dashboard

2. **Sign In**:
   - Login with credentials
   - Verify redirect to dashboard
   - Check session in browser

3. **OAuth**:
   - Test Google sign in
   - Test Microsoft sign in
   - Verify profile creation

4. **Protected Routes**:
   - Try accessing `/dashboard` without auth
   - Verify redirect to login
   - Sign in and verify access

5. **Profile Management**:
   - Update profile information
   - Change password
   - Enable 2FA (Pro/Enterprise)

### 7.2 Test Tier System

1. **Free Tier**:
   - Verify 20 searches/day limit
   - Check basic features only
   - Verify trial banner

2. **Pro Tier**:
   - Upgrade to Pro (manual in database for testing)
   - Verify 500 searches/day
   - Check advanced features
   - Test 2FA

3. **Enterprise Tier**:
   - Upgrade to Enterprise
   - Verify unlimited searches
   - Check all features
   - Test API access

### 7.3 Test Usage Tracking

```sql
-- Check usage tracking
SELECT * FROM usage_tracking 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC;

-- Check audit log
SELECT * FROM audit_log 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC;
```

## Step 8: Monitoring

### 8.1 Supabase Monitoring

1. Go to Database > Logs
2. Monitor authentication events
3. Check for errors

### 8.2 Vercel Analytics

1. Enable Vercel Analytics
2. Monitor page views
3. Track authentication flows

### 8.3 Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- PostHog for product analytics

## Step 9: Production Checklist

- [ ] Database migration applied
- [ ] All environment variables configured
- [ ] OAuth providers configured
- [ ] Redirect URLs updated
- [ ] Email templates customized
- [ ] Stripe products created (if using)
- [ ] Webhooks configured (if using Stripe)
- [ ] Tests passing
- [ ] Authentication flows tested
- [ ] Tier system verified
- [ ] Usage tracking working
- [ ] Monitoring enabled
- [ ] Error tracking configured
- [ ] Documentation updated

## Troubleshooting

### Issue: OAuth Not Working

**Solution**:
1. Verify redirect URLs in provider settings
2. Check client ID and secret
3. Ensure provider is enabled in Supabase
4. Check browser console for errors

### Issue: Email Not Sending

**Solution**:
1. Check Supabase email settings
2. Verify SMTP configuration (if custom)
3. Check spam folder
4. Review email templates

### Issue: Session Not Persisting

**Solution**:
1. Check cookie settings
2. Verify domain configuration
3. Check browser privacy settings
4. Review middleware configuration

### Issue: Tier Limits Not Enforcing

**Solution**:
1. Verify tier_limits table populated
2. Check RLS policies
3. Review usage tracking function
4. Check user profile tier value

### Issue: 2FA Not Working

**Solution**:
1. Verify MFA enabled in Supabase
2. Check user tier (Pro/Enterprise only)
3. Review 2FA implementation
4. Test with authenticator app

## Security Best Practices

1. **Environment Variables**:
   - Never commit `.env.local`
   - Use different keys for dev/prod
   - Rotate secrets regularly

2. **Database Security**:
   - Keep RLS policies enabled
   - Review policies regularly
   - Monitor audit logs

3. **Authentication**:
   - Enforce strong passwords
   - Enable 2FA for sensitive accounts
   - Monitor failed login attempts

4. **API Security**:
   - Rate limit API endpoints
   - Validate all inputs
   - Use HTTPS only

5. **Monitoring**:
   - Set up alerts for suspicious activity
   - Review logs regularly
   - Monitor usage patterns

## Support

For issues or questions:
- Check documentation
- Review Supabase docs: https://supabase.com/docs
- Review Next.js docs: https://nextjs.org/docs
- Contact support team

## Maintenance

### Regular Tasks

1. **Weekly**:
   - Review audit logs
   - Check error rates
   - Monitor usage patterns

2. **Monthly**:
   - Review tier distribution
   - Analyze conversion rates
   - Update documentation

3. **Quarterly**:
   - Security audit
   - Performance review
   - Feature usage analysis

### Updates

1. **Dependencies**:
   ```bash
   npm update
   npm audit fix
   ```

2. **Database**:
   - Review and optimize queries
   - Update indexes if needed
   - Clean up old data

3. **Features**:
   - Monitor user feedback
   - Plan improvements
   - Test thoroughly before deployment

## Conclusion

Your KB Portal authentication system is now deployed and ready for production use. Follow the monitoring and maintenance guidelines to ensure smooth operation.
