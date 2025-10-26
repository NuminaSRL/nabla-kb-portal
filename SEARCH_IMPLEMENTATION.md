# Search Interface Implementation

## Overview

This document describes the semantic search interface implementation for the NABLA KB Portal, featuring EmbeddingGemma integration, pgvector similarity search, and intelligent caching.

## Architecture

### Components

1. **SearchBar Component** (`src/components/search/SearchBar.tsx`)
   - Autocomplete suggestions
   - Keyboard navigation
   - Search history integration
   - Debounced API calls

2. **SearchResults Component** (`src/components/search/SearchResults.tsx`)
   - Result cards with metadata
   - Relevance scoring display
   - Document type and domain tags
   - Source links

3. **Search Service** (`src/lib/search/search-service.ts`)
   - Semantic search using pgvector
   - Filter application
   - Search history management
   - Result ranking

4. **Embedding Service** (`src/lib/search/embedding-service.ts`)
   - Integration with EmbeddingGemma on Railway
   - 768-dimensional embedding generation
   - Batch processing support

5. **Cache Service** (`src/lib/search/cache-service.ts`)
   - Query result caching
   - Cache statistics
   - Popular query tracking
   - Automatic expiration

### API Endpoints

- `GET /api/search` - Perform semantic search
- `GET /api/search/suggestions` - Get autocomplete suggestions
- `GET /api/search/history` - Get user search history
- `POST /api/search/history` - Save search to history

## Database Schema

### Tables

1. **documents**
   - Stores knowledge base documents
   - 768-dimensional vector embeddings
   - Full-text search support
   - Metadata and filtering fields

2. **search_history**
   - User search queries
   - Timestamps and result counts
   - Filter configurations

3. **popular_searches**
   - Aggregated search frequency
   - Popular query tracking

4. **search_cache**
   - Cached search results
   - Hit count tracking
   - Automatic expiration

### Functions

- `search_documents_semantic()` - Semantic search using pgvector cosine similarity
- `increment_search_count()` - Update popular search frequency
- `clean_expired_cache()` - Remove expired cache entries
- `get_cached_search()` - Retrieve cached results
- `save_search_cache()` - Store search results in cache

## Features

### Semantic Search

- **768-dimensional embeddings** from EmbeddingGemma
- **Cosine similarity** search using pgvector
- **Relevance scoring** with configurable threshold
- **Result ranking** based on similarity score

### Autocomplete

- **Real-time suggestions** as user types
- **Search history** integration
- **Popular queries** from aggregated data
- **Keyboard navigation** (arrow keys, Enter, Escape)

### Filtering

- **Domain filter** (GDPR, Tax, AML, etc.)
- **Document type filter** (Regulation, Guideline, etc.)
- **Date range filter**
- **Minimum relevance score** slider

### Caching

- **Query result caching** for popular searches
- **1-hour TTL** by default
- **Hit count tracking** for cache optimization
- **Automatic expiration** cleanup

### Performance

- **< 300ms response time** for cached queries
- **< 1s response time** for new queries
- **Debounced autocomplete** (300ms delay)
- **Batch embedding generation** support

## Usage

### Basic Search

```typescript
import { searchService } from '@/lib/search/search-service';

const results = await searchService.semanticSearch('GDPR compliance', {
  limit: 20,
  minRelevanceScore: 0.5,
});
```

### Search with Filters

```typescript
const results = await searchService.semanticSearch('privacy regulations', {
  limit: 20,
  domainFilter: ['GDPR', 'Privacy'],
  documentTypeFilter: ['Regulation', 'Guideline'],
  dateFrom: '2020-01-01',
  minRelevanceScore: 0.7,
});
```

### Get Suggestions

```typescript
const suggestions = await searchService.getSuggestions('GDPR', 5);
```

### Cache Management

```typescript
import { cacheService } from '@/lib/search/cache-service';

// Get cache statistics
const stats = await cacheService.getStats();

// Clear expired entries
await cacheService.clearExpired();

// Get popular queries
const popular = await cacheService.getPopularQueries(10);
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# EmbeddingGemma Service (Railway)
EMBEDDING_SERVICE_URL=https://your-railway-service.railway.app
```

## Testing

Run Playwright tests:

```bash
npm run test
```

Run specific search tests:

```bash
npx playwright test tests/search.spec.ts
```

Run tests in UI mode:

```bash
npm run test:ui
```

## Performance Optimization

### Indexing

- **IVFFlat index** on embedding column for fast similarity search
- **B-tree indexes** on filter columns (domain, type, date)
- **GIN index** for full-text search

### Caching Strategy

1. **Popular queries** cached for 1 hour
2. **Cache hit tracking** for optimization
3. **Automatic expiration** to prevent stale data
4. **Query hash** for efficient cache lookup

### Embedding Generation

1. **Batch processing** for multiple queries
2. **CPU/GPU fallback** for local generation
3. **Railway deployment** for cloud processing
4. **< 100ms per query** target

## Migration

Apply the search system migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually apply
psql -h your-host -U postgres -d your-db -f database/migrations/003_search_system.sql
```

## Monitoring

### Key Metrics

- Search response time
- Cache hit rate
- Popular queries
- Embedding generation time
- Error rates

### Logging

All search operations are logged with:
- Query text
- Filter configuration
- Result count
- Processing time
- Cache hit/miss

## Future Enhancements

1. **Hybrid search** combining semantic and keyword search
2. **Query expansion** using synonyms and related terms
3. **Personalized ranking** based on user behavior
4. **Multi-language support** for international documents
5. **Advanced filters** (jurisdiction, authority, etc.)
6. **Search analytics dashboard** for administrators
7. **A/B testing** for ranking algorithms
8. **Real-time indexing** for new documents

## Troubleshooting

### Slow Search Performance

1. Check pgvector index: `EXPLAIN ANALYZE SELECT ...`
2. Verify embedding service health
3. Review cache hit rate
4. Check database connection pool

### No Results Returned

1. Verify embedding generation is working
2. Check relevance score threshold
3. Review filter configuration
4. Verify documents have embeddings

### Autocomplete Not Working

1. Check search history table
2. Verify popular searches are populated
3. Review API endpoint logs
4. Check debounce timing

## Support

For issues or questions:
- Check logs in `/api/search` endpoints
- Review Supabase logs for database errors
- Monitor Railway logs for embedding service
- Run Playwright tests to verify functionality
