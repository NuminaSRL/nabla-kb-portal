# Personalized Recommendations System

## Overview

The Personalized Recommendations System provides intelligent document recommendations based on user behavior, interests, and trending content. It uses embeddings for semantic analysis and tracks user interactions to continuously improve recommendation quality.

## Features

### 1. Behavior Tracking
- **Document Interactions**: Tracks views, bookmarks, exports, annotations, and citations
- **Search Patterns**: Analyzes search queries, domains, and document types
- **Interest Profiling**: Builds user interest profiles using 768-dim embeddings

### 2. Recommendation Types
- **Interest-Based**: Recommendations based on user interest profiles (50%)
- **Behavior-Based**: Similar documents to recently viewed content (30%)
- **Trending**: Popular documents in the community (20%)
- **Similar Users**: Content popular among users with similar interests (future)

### 3. Analytics & Metrics
- **Impression Tracking**: Records when recommendations are shown
- **Click Tracking**: Monitors which recommendations users click
- **Dismissal Tracking**: Learns from dismissed recommendations
- **Engagement Metrics**: Calculates click-through rates and engagement scores

### 4. Automated Refresh
- **Scheduled Updates**: Recommendations refresh every 6 hours via Railway cron
- **Interest Updates**: User interests updated based on recent interactions
- **Cleanup**: Expired recommendations automatically removed

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interactions                         │
│  (Views, Bookmarks, Searches, Exports, Annotations)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Behavior Tracking Service                       │
│  • Track document interactions                               │
│  • Update search patterns                                    │
│  • Build interest profiles with embeddings                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Recommendation Generation Engine                   │
│  • Interest-based recommendations (pgvector similarity)      │
│  • Behavior-based recommendations (document similarity)      │
│  • Trending documents (interaction frequency)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Recommendation Storage                          │
│  • Save recommendations with relevance scores                │
│  • Set expiration (7 days)                                   │
│  • Track metrics (impressions, clicks, dismissals)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 User Interface                               │
│  • Display personalized recommendations                      │
│  • Show interest profile                                     │
│  • Display activity summary                                  │
│  • Analytics dashboard                                       │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### user_document_interactions
Tracks all user interactions with documents.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- document_id: UUID
- interaction_type: VARCHAR (view, bookmark, export, annotate, cite)
- interaction_duration: INTEGER (seconds)
- interaction_metadata: JSONB
- created_at: TIMESTAMP
```

### user_search_patterns
Stores aggregated search patterns for each user.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- query: TEXT
- domain: VARCHAR
- document_type: VARCHAR
- result_clicked_count: INTEGER
- avg_relevance_score: DECIMAL
- search_frequency: INTEGER
- last_searched_at: TIMESTAMP
- created_at: TIMESTAMP
```

### user_interests
Maintains user interest profiles using embeddings.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- interest_vector: vector(768)
- interest_domain: VARCHAR
- interest_keywords: TEXT[]
- confidence_score: DECIMAL
- interaction_count: INTEGER
- last_updated_at: TIMESTAMP
- created_at: TIMESTAMP
```

### user_recommendations
Stores personalized recommendations for users.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- document_id: UUID
- recommendation_type: VARCHAR (interest_based, behavior_based, trending, similar_users)
- relevance_score: DECIMAL
- reasoning: TEXT
- metadata: JSONB
- shown_at: TIMESTAMP
- clicked_at: TIMESTAMP
- dismissed_at: TIMESTAMP
- created_at: TIMESTAMP
- expires_at: TIMESTAMP (default: 7 days)
```

### recommendation_metrics
Tracks performance metrics for recommendations.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- recommendation_id: UUID (foreign key to user_recommendations)
- metric_type: VARCHAR (impression, click, dismiss, engagement)
- metric_value: DECIMAL
- recorded_at: TIMESTAMP
```

## API Endpoints

### GET /api/recommendations
Get personalized recommendations for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of recommendations to return (default: 20)
- `refresh` (optional): Force regeneration of recommendations (default: false)

**Response:**
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "documentId": "uuid",
      "recommendationType": "interest_based",
      "relevanceScore": 0.85,
      "reasoning": "Based on your interests and reading patterns",
      "document": { ... }
    }
  ],
  "count": 20
}
```

### POST /api/recommendations/track
Track recommendation metrics (impressions, clicks, dismissals).

**Request Body:**
```json
{
  "recommendationId": "uuid",
  "metricType": "click",
  "metricValue": 1.0
}
```

### POST /api/recommendations/behavior
Track user behavior (document interactions, search patterns).

**Request Body:**
```json
{
  "type": "document_interaction",
  "data": {
    "documentId": "uuid",
    "interactionType": "view",
    "duration": 120,
    "metadata": {}
  }
}
```

### GET /api/recommendations/behavior
Get user behavior summary.

**Response:**
```json
{
  "interactions": [
    { "interaction_type": "view", "count": 45 },
    { "interaction_type": "bookmark", "count": 12 }
  ],
  "topSearchPatterns": [
    { "query": "GDPR compliance", "domain": "gdpr", "search_frequency": 8 }
  ],
  "interests": [
    {
      "interest_domain": "gdpr",
      "interest_keywords": ["privacy", "data protection"],
      "confidence_score": 0.85
    }
  ]
}
```

### GET /api/recommendations/analytics
Get recommendation analytics for the authenticated user.

**Response:**
```json
{
  "impressions": 150,
  "clicks": 45,
  "dismissals": 10,
  "clickThroughRate": 30.0
}
```

### POST /api/recommendations/scheduler
Run the recommendation scheduler (for Railway cron job).

**Headers:**
- `Authorization: Bearer <SCHEDULER_SECRET>`

## Usage

### Track Document View
```typescript
import { recommendationService } from '@/lib/recommendations/recommendation-service';

await recommendationService.trackDocumentInteraction(userId, {
  documentId: 'doc-uuid',
  interactionType: 'view',
  duration: 120, // seconds
  metadata: { source: 'search' }
});
```

### Track Search Pattern
```typescript
await recommendationService.updateSearchPattern(userId, {
  query: 'GDPR compliance',
  domain: 'gdpr',
  documentType: 'regulation',
  relevanceScore: 0.85
});
```

### Generate Recommendations
```typescript
const recommendations = await recommendationService.generateRecommendations(
  userId,
  20 // limit
);
```

### Get Saved Recommendations
```typescript
const recommendations = await recommendationService.getRecommendations(
  userId,
  20 // limit
);
```

### Track Recommendation Click
```typescript
await recommendationService.trackRecommendationMetric(userId, {
  recommendationId: 'rec-uuid',
  metricType: 'click'
});
```

### Dismiss Recommendation
```typescript
await recommendationService.dismissRecommendation(userId, 'rec-uuid');
```

## Components

### RecommendationCard
Displays a single recommendation with document information, relevance score, and dismiss button.

```tsx
<RecommendationCard
  recommendation={recommendation}
  onDismiss={handleDismiss}
  onClick={handleClick}
/>
```

### RecommendationsList
Displays a grid of recommendations with refresh functionality.

```tsx
<RecommendationsList
  limit={12}
  showRefresh={true}
/>
```

## Deployment

### Railway Configuration

1. **Environment Variables:**
   ```
   SCHEDULER_SECRET=your-secret-key
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Cron Job:**
   The system uses Railway cron to refresh recommendations every 6 hours:
   ```
   0 */6 * * * (every 6 hours)
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

### Database Migration

Apply the migration to create the necessary tables and functions:

```bash
psql $DATABASE_URL < database/migrations/011_personalized_recommendations.sql
```

## Performance Considerations

1. **Embedding Similarity**: Uses pgvector with IVFFlat index for fast similarity search
2. **Batch Processing**: Processes users in batches of 10 to avoid overwhelming the system
3. **Caching**: Recommendations cached for 7 days to reduce computation
4. **Expiration**: Old recommendations automatically cleaned up
5. **Rate Limiting**: Scheduler includes delays between batches

## Privacy & Security

1. **Row Level Security**: All tables have RLS policies to ensure users can only access their own data
2. **Local Processing**: Interest profiles built using local embeddings
3. **No Data Leakage**: User behavior data never shared with external services
4. **Encryption**: Sensitive data encrypted at rest in Supabase

## Future Enhancements

1. **Similar Users**: Recommendations based on users with similar interests
2. **Collaborative Filtering**: Use interaction patterns across users
3. **A/B Testing**: Test different recommendation algorithms
4. **Real-time Updates**: WebSocket-based real-time recommendation updates
5. **Personalized Ranking**: ML-based ranking of recommendations
6. **Diversity**: Ensure recommendations cover diverse topics
7. **Explainability**: Provide detailed explanations for recommendations

## Monitoring

Monitor recommendation performance through:

1. **Analytics Dashboard**: View impressions, clicks, and CTR
2. **Behavior Summary**: Track user interactions and search patterns
3. **Interest Profile**: Monitor user interest evolution
4. **Scheduler Logs**: Check Railway logs for scheduler execution

## Troubleshooting

### No Recommendations Generated
- Check if user has sufficient interaction history
- Verify embeddings are generated for documents
- Check scheduler logs for errors

### Low Click-Through Rate
- Review recommendation relevance scores
- Adjust recommendation type distribution
- Improve reasoning text clarity

### Scheduler Not Running
- Verify Railway cron configuration
- Check SCHEDULER_SECRET environment variable
- Review Railway logs for errors

## Support

For issues or questions, please refer to:
- Database migration: `database/migrations/011_personalized_recommendations.sql`
- Service implementation: `src/lib/recommendations/recommendation-service.ts`
- Scheduler: `src/lib/recommendations/recommendation-scheduler.ts`
