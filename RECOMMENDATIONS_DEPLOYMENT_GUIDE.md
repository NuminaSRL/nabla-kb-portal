# Personalized Recommendations - Deployment Guide

## Overview

This guide covers the deployment of the Personalized Recommendations system for the KB Portal. The system provides intelligent document recommendations based on user behavior, interests, and trending content.

## Prerequisites

- Supabase project with PostgreSQL 15+ and pgvector extension
- Railway account for cron job scheduling
- Node.js 18+ and npm/yarn
- Access to kb-portal repository

## Deployment Steps

### 1. Database Migration

Apply the recommendations migration to create tables and functions:

```bash
# Connect to your Supabase database
psql $DATABASE_URL

# Apply migration
\i kb-portal/database/migrations/011_personalized_recommendations.sql

# Verify tables created
\dt user_*
```

Expected tables:
- `user_document_interactions`
- `user_search_patterns`
- `user_interests`
- `user_recommendations`
- `recommendation_metrics`

### 2. Environment Variables

Add the following environment variables to your deployment:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Scheduler Secret (generate a secure random string)
SCHEDULER_SECRET=your-secure-random-secret
```

Generate a secure scheduler secret:
```bash
openssl rand -base64 32
```

### 3. Deploy to Railway

#### Option A: Deploy with Railway CLI

```bash
# Navigate to kb-portal directory
cd kb-portal

# Login to Railway
railway login

# Link to your project
railway link

# Set environment variables
railway variables set SCHEDULER_SECRET=your-secure-random-secret

# Deploy
railway up
```

#### Option B: Deploy via Railway Dashboard

1. Go to Railway dashboard
2. Select your kb-portal project
3. Add environment variables in Settings > Variables
4. Deploy from GitHub repository

### 4. Configure Cron Job

The system uses Railway cron to refresh recommendations every 6 hours.

#### Using railway.recommendations.json

The cron configuration is defined in `railway.recommendations.json`:

```json
{
  "cron": [
    {
      "name": "refresh-recommendations",
      "schedule": "0 */6 * * *",
      "command": "curl -X POST -H \"Authorization: Bearer $SCHEDULER_SECRET\" $RAILWAY_PUBLIC_DOMAIN/api/recommendations/scheduler"
    }
  ]
}
```

#### Manual Cron Setup (Alternative)

If Railway doesn't support the JSON config, set up a separate cron service:

1. Create a new service in Railway
2. Add a cron job with schedule: `0 */6 * * *`
3. Command: 
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $SCHEDULER_SECRET" \
     https://your-kb-portal.railway.app/api/recommendations/scheduler
   ```

### 5. Verify Deployment

#### Test API Endpoints

```bash
# Get your auth token from Supabase
TOKEN="your-user-auth-token"

# Test recommendations endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://your-kb-portal.railway.app/api/recommendations

# Test behavior tracking
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "document_interaction",
    "data": {
      "documentId": "test-doc-id",
      "interactionType": "view",
      "duration": 60
    }
  }' \
  https://your-kb-portal.railway.app/api/recommendations/behavior

# Test scheduler (use SCHEDULER_SECRET)
curl -X POST \
  -H "Authorization: Bearer $SCHEDULER_SECRET" \
  https://your-kb-portal.railway.app/api/recommendations/scheduler
```

#### Check Database

```sql
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'user_%';

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%recommendation%';

-- Test recommendation generation
SELECT * FROM generate_interest_recommendations('user-id', 10);
```

#### Test UI

1. Navigate to `https://your-kb-portal.railway.app/dashboard/recommendations`
2. Verify recommendations page loads
3. Check that recommendations are displayed
4. Test clicking on a recommendation
5. Test dismissing a recommendation
6. Check analytics tab for metrics

### 6. Monitor Deployment

#### Railway Logs

Monitor the scheduler execution:

```bash
railway logs --service kb-portal
```

Look for:
- "Running scheduled recommendation tasks..."
- "Recommendation refresh completed successfully"
- Any error messages

#### Supabase Logs

Check Supabase logs for:
- Database query performance
- RLS policy violations
- Function execution errors

#### Application Metrics

Monitor in the UI:
- Impressions count
- Click-through rate
- Dismissal rate
- User interest profiles

### 7. Performance Optimization

#### Database Indexes

Verify indexes are created:

```sql
-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename LIKE 'user_%';
```

#### pgvector Configuration

Optimize pgvector for your data size:

```sql
-- For small datasets (<100k vectors)
CREATE INDEX idx_user_interests_vector 
ON user_interests 
USING ivfflat (interest_vector vector_cosine_ops)
WITH (lists = 100);

-- For large datasets (>100k vectors)
CREATE INDEX idx_user_interests_vector 
ON user_interests 
USING ivfflat (interest_vector vector_cosine_ops)
WITH (lists = 1000);
```

#### Caching

The system caches recommendations for 7 days. Adjust expiration if needed:

```sql
-- Change default expiration to 14 days
ALTER TABLE user_recommendations 
ALTER COLUMN expires_at 
SET DEFAULT NOW() + INTERVAL '14 days';
```

## Troubleshooting

### Issue: No recommendations generated

**Symptoms:**
- Empty recommendations list
- "No recommendations yet" message

**Solutions:**
1. Check if user has interaction history:
   ```sql
   SELECT COUNT(*) FROM user_document_interactions WHERE user_id = 'user-id';
   ```

2. Verify documents have embeddings:
   ```sql
   SELECT COUNT(*) FROM documents WHERE embedding IS NOT NULL;
   ```

3. Manually trigger recommendation generation:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $SCHEDULER_SECRET" \
     https://your-kb-portal.railway.app/api/recommendations/scheduler
   ```

### Issue: Scheduler not running

**Symptoms:**
- Recommendations not refreshing
- No scheduler logs in Railway

**Solutions:**
1. Verify cron configuration in Railway dashboard
2. Check SCHEDULER_SECRET is set correctly
3. Test scheduler endpoint manually:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $SCHEDULER_SECRET" \
     https://your-kb-portal.railway.app/api/recommendations/scheduler
   ```

4. Check Railway logs for errors:
   ```bash
   railway logs --service kb-portal | grep scheduler
   ```

### Issue: Low recommendation quality

**Symptoms:**
- Irrelevant recommendations
- Low click-through rate

**Solutions:**
1. Increase interaction data collection
2. Adjust recommendation type distribution in `recommendation-service.ts`:
   ```typescript
   // Increase interest-based recommendations
   p_limit: Math.floor(limit * 0.6), // 60% instead of 50%
   ```

3. Improve interest profile accuracy by collecting more behavioral data

4. Review and adjust similarity thresholds:
   ```sql
   -- In generate_interest_recommendations function
   WHERE ds.score > 0.7  -- Increase from 0.6 for higher quality
   ```

### Issue: Performance degradation

**Symptoms:**
- Slow recommendation loading
- High database CPU usage

**Solutions:**
1. Check index usage:
   ```sql
   SELECT * FROM pg_stat_user_indexes 
   WHERE schemaname = 'public' 
   AND relname LIKE 'user_%';
   ```

2. Optimize batch size in scheduler:
   ```typescript
   // In recommendation-scheduler.ts
   const batchSize = 5; // Reduce from 10
   ```

3. Add query timeout:
   ```sql
   SET statement_timeout = '30s';
   ```

4. Consider partitioning large tables:
   ```sql
   -- Partition user_document_interactions by month
   CREATE TABLE user_document_interactions_2024_01 
   PARTITION OF user_document_interactions
   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
   ```

## Rollback Procedure

If you need to rollback the deployment:

### 1. Disable Scheduler

```bash
# In Railway dashboard, disable the cron job
# Or remove the cron configuration
```

### 2. Remove API Routes (Optional)

```bash
# Rename API routes to disable them
mv src/app/api/recommendations src/app/api/recommendations.disabled
```

### 3. Drop Database Tables (If Needed)

```sql
-- WARNING: This will delete all recommendation data
DROP TABLE IF EXISTS recommendation_metrics CASCADE;
DROP TABLE IF EXISTS user_recommendations CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS user_search_patterns CASCADE;
DROP TABLE IF EXISTS user_document_interactions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS track_document_interaction CASCADE;
DROP FUNCTION IF EXISTS update_search_pattern CASCADE;
DROP FUNCTION IF EXISTS update_user_interest CASCADE;
DROP FUNCTION IF EXISTS generate_interest_recommendations CASCADE;
DROP FUNCTION IF EXISTS generate_behavior_recommendations CASCADE;
DROP FUNCTION IF EXISTS get_trending_documents CASCADE;
DROP FUNCTION IF EXISTS save_recommendations CASCADE;
DROP FUNCTION IF EXISTS track_recommendation_metric CASCADE;
```

## Post-Deployment Checklist

- [ ] Database migration applied successfully
- [ ] All environment variables configured
- [ ] Railway deployment successful
- [ ] Cron job configured and running
- [ ] API endpoints responding correctly
- [ ] UI components displaying recommendations
- [ ] Analytics dashboard showing metrics
- [ ] Scheduler logs showing successful execution
- [ ] Database indexes created and optimized
- [ ] Performance monitoring in place
- [ ] Documentation updated

## Support

For issues or questions:
- Check Railway logs: `railway logs`
- Review Supabase logs in dashboard
- Consult README: `src/lib/recommendations/README.md`
- Check migration file: `database/migrations/011_personalized_recommendations.sql`

## Next Steps

After successful deployment:

1. **Monitor Performance**: Track recommendation quality and user engagement
2. **Collect Feedback**: Gather user feedback on recommendation relevance
3. **Optimize Algorithms**: Adjust recommendation weights based on metrics
4. **Expand Features**: Consider implementing similar users and collaborative filtering
5. **A/B Testing**: Test different recommendation strategies

## Maintenance

### Weekly Tasks
- Review recommendation analytics
- Check scheduler execution logs
- Monitor database performance

### Monthly Tasks
- Analyze recommendation quality metrics
- Optimize database queries
- Review and adjust recommendation algorithms
- Clean up old interaction data (optional)

### Quarterly Tasks
- Review overall system performance
- Plan feature enhancements
- Update documentation
- Conduct security audit
