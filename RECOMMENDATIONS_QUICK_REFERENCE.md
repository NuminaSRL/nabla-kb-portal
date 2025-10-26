# Personalized Recommendations - Quick Reference

## Quick Start

### 1. Apply Database Migration
```bash
psql $DATABASE_URL < kb-portal/database/migrations/011_personalized_recommendations.sql
```

### 2. Set Environment Variables
```bash
SCHEDULER_SECRET=your-secure-random-secret
```

### 3. Deploy to Railway
```bash
railway up
```

### 4. Test Recommendations
Navigate to: `https://your-app.railway.app/dashboard/recommendations`

## API Endpoints

### Get Recommendations
```bash
GET /api/recommendations?limit=20&refresh=false
Authorization: Bearer <user-token>
```

### Track Behavior
```bash
POST /api/recommendations/behavior
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "type": "document_interaction",
  "data": {
    "documentId": "uuid",
    "interactionType": "view",
    "duration": 120
  }
}
```

### Track Metrics
```bash
POST /api/recommendations/track
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "recommendationId": "uuid",
  "metricType": "click"
}
```

### Get Analytics
```bash
GET /api/recommendations/analytics
Authorization: Bearer <user-token>
```

### Run Scheduler
```bash
POST /api/recommendations/scheduler
Authorization: Bearer <scheduler-secret>
```

## Code Examples

### Track Document View
```typescript
import { recommendationService } from '@/lib/recommendations/recommendation-service';

await recommendationService.trackDocumentInteraction(userId, {
  documentId: 'doc-uuid',
  interactionType: 'view',
  duration: 120
});
```

### Generate Recommendations
```typescript
const recommendations = await recommendationService.generateRecommendations(
  userId,
  20
);
```

### Track Click
```typescript
await recommendationService.trackRecommendationMetric(userId, {
  recommendationId: 'rec-uuid',
  metricType: 'click'
});
```

## UI Components

### Display Recommendations
```tsx
import { RecommendationsList } from '@/components/recommendations/RecommendationsList';

<RecommendationsList limit={12} showRefresh={true} />
```

### Single Recommendation Card
```tsx
import { RecommendationCard } from '@/components/recommendations/RecommendationCard';

<RecommendationCard
  recommendation={recommendation}
  onDismiss={handleDismiss}
  onClick={handleClick}
/>
```

## Database Queries

### Check User Interactions
```sql
SELECT interaction_type, COUNT(*) 
FROM user_document_interactions 
WHERE user_id = 'user-id' 
GROUP BY interaction_type;
```

### View User Interests
```sql
SELECT interest_domain, confidence_score, interest_keywords
FROM user_interests
WHERE user_id = 'user-id'
ORDER BY confidence_score DESC;
```

### Get Recommendations
```sql
SELECT r.*, d.title, d.domain
FROM user_recommendations r
JOIN documents d ON r.document_id = d.id
WHERE r.user_id = 'user-id'
  AND r.dismissed_at IS NULL
  AND r.expires_at > NOW()
ORDER BY r.relevance_score DESC
LIMIT 20;
```

### Check Recommendation Metrics
```sql
SELECT metric_type, COUNT(*) as count
FROM recommendation_metrics
WHERE user_id = 'user-id'
  AND recorded_at > NOW() - INTERVAL '30 days'
GROUP BY metric_type;
```

## Recommendation Types

| Type | Description | Weight | Algorithm |
|------|-------------|--------|-----------|
| **interest_based** | Based on user interest profiles | 50% | pgvector similarity with interest vectors |
| **behavior_based** | Similar to recently viewed docs | 30% | Document embedding similarity |
| **trending** | Popular in community | 20% | Interaction frequency / age |
| **similar_users** | Popular among similar users | Future | Collaborative filtering |

## Interaction Types

| Type | Description | When to Track |
|------|-------------|---------------|
| **view** | User views document | On document page load |
| **bookmark** | User bookmarks document | On bookmark action |
| **export** | User exports document | On export completion |
| **annotate** | User adds annotation | On annotation save |
| **cite** | User cites document | On citation creation |

## Metric Types

| Type | Description | When to Track |
|------|-------------|---------------|
| **impression** | Recommendation shown | When recommendation displayed |
| **click** | User clicks recommendation | On recommendation click |
| **dismiss** | User dismisses recommendation | On dismiss button click |
| **engagement** | User engages with document | After viewing for >30s |

## Scheduler Configuration

### Cron Schedule
```
0 */6 * * *  # Every 6 hours
```

### Manual Trigger
```bash
curl -X POST \
  -H "Authorization: Bearer $SCHEDULER_SECRET" \
  https://your-app.railway.app/api/recommendations/scheduler
```

### Check Status
```bash
curl https://your-app.railway.app/api/recommendations/scheduler
```

## Performance Tips

### Optimize Queries
```sql
-- Create indexes
CREATE INDEX idx_user_doc_interactions_user_id 
ON user_document_interactions(user_id);

CREATE INDEX idx_user_interests_vector 
ON user_interests 
USING ivfflat (interest_vector vector_cosine_ops);
```

### Adjust Batch Size
```typescript
// In recommendation-scheduler.ts
const batchSize = 10; // Adjust based on load
```

### Cache Recommendations
```typescript
// Recommendations cached for 7 days by default
// Adjust in migration if needed
```

## Troubleshooting

### No Recommendations
```sql
-- Check if user has interactions
SELECT COUNT(*) FROM user_document_interactions 
WHERE user_id = 'user-id';

-- Check if documents have embeddings
SELECT COUNT(*) FROM documents 
WHERE embedding IS NOT NULL;
```

### Scheduler Not Running
```bash
# Check Railway logs
railway logs | grep scheduler

# Test endpoint
curl -X POST \
  -H "Authorization: Bearer $SCHEDULER_SECRET" \
  https://your-app.railway.app/api/recommendations/scheduler
```

### Low Quality Recommendations
```sql
-- Adjust similarity threshold
-- In generate_interest_recommendations function
WHERE ds.score > 0.7  -- Increase from 0.6
```

## Monitoring

### Key Metrics
- **Impressions**: Number of recommendations shown
- **Clicks**: Number of recommendations clicked
- **CTR**: Click-through rate (clicks / impressions)
- **Dismissals**: Number of recommendations dismissed

### Check Analytics
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://your-app.railway.app/api/recommendations/analytics
```

### View in UI
Navigate to: `/dashboard/recommendations` → Analytics tab

## Common Tasks

### Force Refresh Recommendations
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://your-app.railway.app/api/recommendations?refresh=true"
```

### Clear Old Recommendations
```sql
DELETE FROM user_recommendations
WHERE expires_at < NOW();
```

### Reset User Interests
```sql
DELETE FROM user_interests
WHERE user_id = 'user-id';
```

### Export User Behavior
```sql
COPY (
  SELECT * FROM user_document_interactions
  WHERE user_id = 'user-id'
) TO '/tmp/user_behavior.csv' CSV HEADER;
```

## Files Reference

| File | Purpose |
|------|---------|
| `database/migrations/011_personalized_recommendations.sql` | Database schema |
| `src/lib/recommendations/recommendation-service.ts` | Core service |
| `src/lib/recommendations/recommendation-scheduler.ts` | Scheduler |
| `src/app/api/recommendations/route.ts` | Get recommendations API |
| `src/app/api/recommendations/track/route.ts` | Track metrics API |
| `src/app/api/recommendations/behavior/route.ts` | Track behavior API |
| `src/components/recommendations/RecommendationCard.tsx` | Card component |
| `src/components/recommendations/RecommendationsList.tsx` | List component |
| `src/app/dashboard/recommendations/page.tsx` | Dashboard page |

## Support

- **Documentation**: `src/lib/recommendations/README.md`
- **Deployment Guide**: `RECOMMENDATIONS_DEPLOYMENT_GUIDE.md`
- **Migration**: `database/migrations/011_personalized_recommendations.sql`
- **Railway Logs**: `railway logs`
- **Supabase Logs**: Check Supabase dashboard
