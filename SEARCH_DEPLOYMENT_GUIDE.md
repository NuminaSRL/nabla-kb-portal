# Search Interface Deployment Guide

## Prerequisites

- Supabase project with PostgreSQL 15+
- Railway account for EmbeddingGemma service
- Node.js 18+ and npm
- Supabase CLI (optional)

## Step 1: Deploy EmbeddingGemma Service to Railway

### 1.1 Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

### 1.2 Deploy EmbeddingGemma Service

Create a simple FastAPI service for embeddings:

```python
# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import torch
from transformers import AutoTokenizer, AutoModel

app = FastAPI()

# Load EmbeddingGemma model
model_name = "google/embedding-gemma-768"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

class EmbedRequest(BaseModel):
    text: str

class BatchEmbedRequest(BaseModel):
    texts: List[str]

@app.get("/health")
async def health():
    return {"status": "healthy", "model": model_name}

@app.post("/api/embed")
async def embed(request: EmbedRequest):
    try:
        inputs = tokenizer(request.text, return_tensors="pt", padding=True, truncation=True)
        with torch.no_grad():
            outputs = model(**inputs)
            embedding = outputs.last_hidden_state.mean(dim=1).squeeze().tolist()
        
        return {
            "embedding": embedding,
            "dimension": len(embedding),
            "model": model_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/embed/batch")
async def embed_batch(request: BatchEmbedRequest):
    try:
        embeddings = []
        for text in request.texts:
            inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
            with torch.no_grad():
                outputs = model(**inputs)
                embedding = outputs.last_hidden_state.mean(dim=1).squeeze().tolist()
                embeddings.append(embedding)
        
        return {
            "embeddings": embeddings,
            "count": len(embeddings),
            "dimension": len(embeddings[0]) if embeddings else 0,
            "model": model_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

```python
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
torch==2.1.0
transformers==4.35.0
pydantic==2.5.0
```

```bash
# Deploy to Railway
railway up
```

### 1.3 Get Railway Service URL

```bash
# Get the service URL
railway domain
```

Copy the URL (e.g., `https://your-service.railway.app`)

## Step 2: Configure Environment Variables

### 2.1 Update kb-portal/.env.local

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# EmbeddingGemma Service
EMBEDDING_SERVICE_URL=https://your-service.railway.app

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_SEARCH=true
```

## Step 3: Apply Database Migration

### Option A: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migration
supabase db push
```

### Option B: Manual SQL Execution

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `database/migrations/003_search_system.sql`
3. Paste and execute

### 3.1 Verify Migration

```sql
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('documents', 'search_history', 'popular_searches', 'search_cache');

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'search%';
```

## Step 4: Populate Sample Documents

### 4.1 Create Sample Documents Script

```typescript
// scripts/populate-sample-docs.ts
import { createClient } from '@supabase/supabase-js';
import { embeddingService } from '../src/lib/search/embedding-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sampleDocuments = [
  {
    title: 'GDPR Article 5 - Principles',
    content: 'Personal data shall be processed lawfully, fairly and in a transparent manner...',
    domain: 'GDPR',
    document_type: 'Regulation',
    source: 'EUR-Lex',
    published_date: '2018-05-25',
  },
  // Add more sample documents
];

async function populateDocs() {
  for (const doc of sampleDocuments) {
    // Generate embedding
    const embedding = await embeddingService.generateEmbedding(doc.content);
    
    // Insert document
    const { error } = await supabase.from('documents').insert({
      ...doc,
      embedding,
    });
    
    if (error) {
      console.error('Error inserting document:', error);
    } else {
      console.log('Inserted:', doc.title);
    }
  }
}

populateDocs();
```

### 4.2 Run Population Script

```bash
npx tsx scripts/populate-sample-docs.ts
```

## Step 5: Install Dependencies

```bash
cd kb-portal
npm install
```

## Step 6: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/search` to test the search interface.

## Step 7: Run Tests

```bash
# Run all tests
npm run test

# Run search tests specifically
npx playwright test tests/search.spec.ts

# Run tests in UI mode
npm run test:ui
```

## Step 8: Deploy to Production

### 8.1 Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add EMBEDDING_SERVICE_URL

# Deploy to production
vercel --prod
```

### 8.2 Update Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required variables
3. Redeploy

## Step 9: Verify Deployment

### 9.1 Test Search Functionality

1. Navigate to `/search`
2. Enter a query (e.g., "GDPR compliance")
3. Verify results appear
4. Test autocomplete
5. Test filters
6. Check performance

### 9.2 Monitor Performance

```sql
-- Check search cache statistics
SELECT 
  COUNT(*) as total_cached_queries,
  SUM(hit_count) as total_cache_hits,
  AVG(hit_count) as avg_hits_per_query
FROM search_cache;

-- Check popular searches
SELECT query, frequency, last_searched
FROM popular_searches
ORDER BY frequency DESC
LIMIT 10;

-- Check recent searches
SELECT query, searched_at, result_count
FROM search_history
ORDER BY searched_at DESC
LIMIT 20;
```

## Troubleshooting

### Issue: Embedding Service Not Responding

**Solution:**
```bash
# Check Railway service status
railway status

# View logs
railway logs

# Restart service
railway restart
```

### Issue: No Search Results

**Solution:**
1. Verify documents have embeddings:
```sql
SELECT COUNT(*) FROM documents WHERE embedding IS NOT NULL;
```

2. Check embedding dimension:
```sql
SELECT vector_dims(embedding) FROM documents LIMIT 1;
```

3. Test search function:
```sql
SELECT * FROM search_documents_semantic(
  ARRAY[0.1, 0.2, ...]::vector(768),
  0.5,
  10
);
```

### Issue: Slow Search Performance

**Solution:**
1. Check index exists:
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'documents';
```

2. Rebuild index if needed:
```sql
DROP INDEX IF EXISTS documents_embedding_idx;
CREATE INDEX documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

3. Analyze table:
```sql
ANALYZE documents;
```

### Issue: Cache Not Working

**Solution:**
1. Check cache table:
```sql
SELECT COUNT(*) FROM search_cache WHERE expires_at > NOW();
```

2. Clear expired cache:
```sql
SELECT clean_expired_cache();
```

3. Verify cache service:
```typescript
import { cacheService } from '@/lib/search/cache-service';
const stats = await cacheService.getStats();
console.log(stats);
```

## Performance Optimization

### 1. Optimize pgvector Index

```sql
-- Increase lists for larger datasets
DROP INDEX documents_embedding_idx;
CREATE INDEX documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200); -- Increase for 100k+ documents
```

### 2. Enable Query Caching

Ensure cache service is properly configured with appropriate TTL:

```typescript
// Adjust TTL based on content update frequency
await cacheService.set(query, results, options, { ttl: 7200 }); // 2 hours
```

### 3. Batch Embedding Generation

For bulk document uploads:

```typescript
const embeddings = await embeddingService.generateEmbeddings(texts);
```

## Monitoring

### Key Metrics to Track

1. **Search Performance**
   - Average response time
   - 95th percentile response time
   - Cache hit rate

2. **Usage Metrics**
   - Searches per day
   - Unique users
   - Popular queries

3. **System Health**
   - Embedding service uptime
   - Database connection pool
   - Error rates

### Set Up Monitoring

```typescript
// Add to search API endpoint
console.log({
  query,
  resultCount: results.length,
  processingTime,
  cacheHit: cachedResult !== null,
  timestamp: new Date().toISOString(),
});
```

## Next Steps

1. ✅ Deploy EmbeddingGemma service
2. ✅ Apply database migration
3. ✅ Populate sample documents
4. ✅ Test search functionality
5. ✅ Deploy to production
6. ⏳ Monitor performance
7. ⏳ Optimize based on usage patterns

## Support

For issues or questions:
- Check Railway logs: `railway logs`
- Check Supabase logs: Dashboard → Logs
- Review API endpoint logs in Vercel
- Run Playwright tests: `npm run test`

## Resources

- [Supabase pgvector Documentation](https://supabase.com/docs/guides/ai/vector-columns)
- [Railway Documentation](https://docs.railway.app/)
- [EmbeddingGemma Model](https://huggingface.co/google/embedding-gemma-768)
- [Playwright Testing](https://playwright.dev/)
