# Saved Searches with Alerts - Deployment Guide

## Overview

The Saved Searches system allows Pro and Enterprise users to save their searches and receive email alerts when new documents match their queries.

## Features

- **Saved Searches**: Save frequently used searches for quick access
- **Email Alerts**: Receive notifications when new documents match saved searches
- **Alert Frequency**: Configure alerts to run daily, weekly, or monthly
- **Tier Limits**: 
  - Free: 0 saved searches
  - Pro: 20 saved searches
  - Enterprise: Unlimited saved searches
- **Alert History**: View history of sent alerts
- **Search Execution**: Execute saved searches with one click

## Architecture

### Components

1. **Database (Supabase)**
   - `saved_searches`: Stores saved search configurations
   - `search_alerts`: History of sent alerts
   - `alert_queue`: Queue for processing scheduled alerts
   - `email_notifications`: Email notification queue and history

2. **Backend Services**
   - `SavedSearchService`: Manages saved searches CRUD operations
   - `AlertScheduler`: Processes alert queue and sends notifications
   - `EmailService`: Sends emails via Resend API

3. **Frontend Components**
   - `SavedSearchesList`: Main list view
   - `SavedSearchDialog`: Create/edit dialog
   - `AlertSettingsDialog`: Configure alert settings

4. **API Routes**
   - `GET /api/saved-searches`: List all saved searches
   - `POST /api/saved-searches`: Create new saved search
   - `GET /api/saved-searches/[id]`: Get specific saved search
   - `PATCH /api/saved-searches/[id]`: Update saved search
   - `DELETE /api/saved-searches/[id]`: Delete saved search
   - `POST /api/saved-searches/[id]/execute`: Execute saved search
   - `GET /api/saved-searches/[id]/alerts`: Get alert history

## Deployment Steps

### 1. Database Migration

Apply the migration to create required tables:

```bash
cd kb-portal
psql $DATABASE_URL -f database/migrations/010_saved_searches_alerts.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

### 2. Environment Variables

Add the following environment variables:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=alerts@kb.nabla.ai

# App URL
NEXT_PUBLIC_APP_URL=https://kb.nabla.ai
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy Frontend (Vercel)

The frontend is automatically deployed via Vercel when you push to the main branch.

### 5. Deploy Alert Scheduler (Railway)

The alert scheduler needs to run as a separate service on Railway:

#### Option A: Using Railway CLI

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Deploy the scheduler
railway up
```

#### Option B: Using Railway Dashboard

1. Go to Railway dashboard
2. Create a new service
3. Connect to your GitHub repository
4. Set the start command: `npm run scheduler`
5. Add environment variables
6. Deploy

### 6. Configure Railway Service

Create a `railway.json` file:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run scheduler",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Add to `package.json`:

```json
{
  "scripts": {
    "scheduler": "ts-node scripts/run-alert-scheduler.ts"
  }
}
```

### 7. Setup Email Service (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key
4. Add the API key to environment variables

### 8. Test the System

Run the test suite:

```bash
npm run test:saved-searches
```

Or run Playwright tests:

```bash
npx playwright test tests/saved-searches.spec.ts
```

## Usage

### For Users

1. **Create a Saved Search**
   - Go to Dashboard > Saved Searches
   - Click "Create Saved Search"
   - Enter name and query
   - Optionally enable alerts and set frequency
   - Click "Create"

2. **Execute a Saved Search**
   - Click the play button next to any saved search
   - View results in the search page

3. **Configure Alerts**
   - Click the clock icon next to a saved search
   - Toggle alerts on/off
   - Set frequency (daily, weekly, monthly)
   - View alert history

4. **Edit/Delete Saved Searches**
   - Click the edit icon to modify
   - Click the trash icon to delete

### For Administrators

1. **Monitor Alert Queue**
   ```sql
   SELECT * FROM alert_queue WHERE status = 'pending';
   ```

2. **Check Email Notifications**
   ```sql
   SELECT * FROM email_notifications WHERE status = 'failed';
   ```

3. **View Alert Statistics**
   ```sql
   SELECT 
     COUNT(*) as total_alerts,
     SUM(CASE WHEN email_sent THEN 1 ELSE 0 END) as successful,
     SUM(CASE WHEN NOT email_sent THEN 1 ELSE 0 END) as failed
   FROM search_alerts
   WHERE alert_sent_at > NOW() - INTERVAL '7 days';
   ```

## Monitoring

### Alert Scheduler Logs

Check Railway logs for the scheduler service:

```bash
railway logs
```

### Database Queries

Monitor alert processing:

```sql
-- Pending alerts
SELECT COUNT(*) FROM alert_queue WHERE status = 'pending';

-- Failed alerts
SELECT * FROM alert_queue WHERE status = 'failed';

-- Recent alerts
SELECT * FROM search_alerts ORDER BY alert_sent_at DESC LIMIT 10;
```

### Email Delivery

Check email notification status:

```sql
SELECT 
  status,
  COUNT(*) as count
FROM email_notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

## Troubleshooting

### Alerts Not Sending

1. Check alert scheduler is running:
   ```bash
   railway logs --service alert-scheduler
   ```

2. Check alert queue:
   ```sql
   SELECT * FROM alert_queue WHERE status = 'failed';
   ```

3. Verify environment variables are set correctly

### Email Delivery Issues

1. Check Resend API key is valid
2. Verify domain is verified in Resend
3. Check email notification logs:
   ```sql
   SELECT * FROM email_notifications WHERE status = 'failed';
   ```

### Performance Issues

1. Check database indexes:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename IN ('saved_searches', 'alert_queue', 'search_alerts');
   ```

2. Monitor alert processing time
3. Consider increasing Railway service resources

## Maintenance

### Clean Up Old Alerts

Run periodically to clean up old alert history:

```sql
DELETE FROM search_alerts 
WHERE alert_sent_at < NOW() - INTERVAL '90 days';

DELETE FROM email_notifications 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Reset Failed Alerts

To retry failed alerts:

```sql
UPDATE alert_queue 
SET status = 'pending', attempts = 0, scheduled_for = NOW()
WHERE status = 'failed' AND last_attempt_at > NOW() - INTERVAL '24 hours';
```

## Security Considerations

1. **Email Privacy**: Emails are sent only to verified user email addresses
2. **Rate Limiting**: Alert frequency is controlled per saved search
3. **Access Control**: Users can only access their own saved searches
4. **Data Encryption**: Email content is not stored in plain text
5. **Service Role Key**: Keep SUPABASE_SERVICE_ROLE_KEY secure

## Performance Optimization

1. **Batch Processing**: Alerts are processed in batches
2. **Caching**: Search results are cached for popular queries
3. **Indexes**: Database indexes on key columns
4. **Queue Management**: Failed alerts are retried with exponential backoff

## Future Enhancements

- [ ] Slack/Teams integration for alerts
- [ ] Custom alert templates
- [ ] Alert digest (multiple searches in one email)
- [ ] Advanced filtering in saved searches
- [ ] Shared saved searches (team feature)
- [ ] Alert analytics dashboard

## Support

For issues or questions:
- Check logs in Railway dashboard
- Review Supabase logs
- Contact support at support@nabla.ai
