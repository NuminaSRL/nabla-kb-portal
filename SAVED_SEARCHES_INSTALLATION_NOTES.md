# Saved Searches - Installation Notes

## Prerequisites

Before deploying the saved searches system, ensure the following are installed:

### 1. shadcn/ui Components

The saved searches UI uses the following shadcn/ui components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add select
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add toast
```

Or install all at once:
```bash
npx shadcn-ui@latest add button dialog input label switch select card badge toast
```

### 2. Dependencies

Install required npm packages:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install -D ts-node
```

### 3. Environment Variables

Create or update `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=alerts@kb.nabla.ai

# App URL
NEXT_PUBLIC_APP_URL=https://kb.nabla.ai
```

### 4. Database Migration

Apply the migration to create required tables:

```bash
# Using psql
psql $DATABASE_URL -f kb-portal/database/migrations/010_saved_searches_alerts.sql

# Or using Supabase CLI
supabase db push
```

### 5. Resend API Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key
4. Add the API key to environment variables

## Installation Steps

### Step 1: Install Dependencies

```bash
cd kb-portal
npm install
```

### Step 2: Install shadcn/ui Components

```bash
npx shadcn-ui@latest add button dialog input label switch select card badge toast
```

### Step 3: Apply Database Migration

```bash
psql $DATABASE_URL -f database/migrations/010_saved_searches_alerts.sql
```

### Step 4: Configure Environment Variables

Create `.env.local` with the required variables (see above).

### Step 5: Build and Test

```bash
# Build the project
npm run build

# Run tests
npm run test:saved-searches
```

### Step 6: Deploy Frontend (Vercel)

```bash
vercel deploy --prod
```

### Step 7: Deploy Scheduler (Railway)

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Deploy
railway up
```

## Verification

After installation, verify everything is working:

### 1. Check Database Tables

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('saved_searches', 'search_alerts', 'alert_queue', 'email_notifications');
```

### 2. Test API Endpoints

```bash
# Get saved searches (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://kb.nabla.ai/api/saved-searches
```

### 3. Check Scheduler Logs

```bash
railway logs --service alert-scheduler
```

### 4. Test Email Delivery

Create a saved search with alerts enabled and wait for the scheduler to run.

## Troubleshooting

### Missing UI Components

If you see errors about missing UI components:

```bash
npx shadcn-ui@latest add [component-name]
```

### Database Connection Issues

Verify your Supabase credentials:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Email Not Sending

1. Check Resend API key is valid
2. Verify domain is verified in Resend
3. Check scheduler logs for errors

### Scheduler Not Running

1. Verify Railway service is running
2. Check environment variables are set
3. Review Railway logs for errors

## Post-Installation

After successful installation:

1. ✅ Test creating a saved search
2. ✅ Test executing a saved search
3. ✅ Test enabling alerts
4. ✅ Verify email delivery
5. ✅ Monitor scheduler logs
6. ✅ Check database for alerts

## Support

For installation issues:
- Review deployment guide: `SAVED_SEARCHES_DEPLOYMENT_GUIDE.md`
- Check quick reference: `SAVED_SEARCHES_QUICK_REFERENCE.md`
- Contact: support@nabla.ai
