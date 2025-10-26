-- Migration: Search System with pgvector support
-- Description: Tables and functions for semantic search with 768-dim embeddings

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table with vector embeddings
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  domain TEXT NOT NULL,
  document_type TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT,
  published_date TIMESTAMP WITH TIME ZONE NOT NULL,
  embedding vector(768), -- 768-dimensional embeddings from EmbeddingGemma
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS documents_domain_idx ON documents(domain);
CREATE INDEX IF NOT EXISTS documents_type_idx ON documents(document_type);
CREATE INDEX IF NOT EXISTS documents_published_date_idx ON documents(published_date);

-- Full-text search index
CREATE INDEX IF NOT EXISTS documents_content_fts_idx ON documents 
USING gin(to_tsvector('english', content));

-- Search history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  result_count INTEGER DEFAULT 0,
  filters JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS search_history_user_idx ON search_history(user_id);
CREATE INDEX IF NOT EXISTS search_history_query_idx ON search_history(query);
CREATE INDEX IF NOT EXISTS search_history_searched_at_idx ON search_history(searched_at DESC);

-- Popular searches table (aggregated)
CREATE TABLE IF NOT EXISTS popular_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT UNIQUE NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_searched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS popular_searches_frequency_idx ON popular_searches(frequency DESC);
CREATE INDEX IF NOT EXISTS popular_searches_query_idx ON popular_searches(query);

-- Search cache table (Redis alternative for popular queries)
CREATE TABLE IF NOT EXISTS search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  results JSONB NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS search_cache_query_hash_idx ON search_cache(query_hash);
CREATE INDEX IF NOT EXISTS search_cache_expires_at_idx ON search_cache(expires_at);

-- Function: Semantic search using pgvector
CREATE OR REPLACE FUNCTION search_documents_semantic(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  domain TEXT,
  document_type TEXT,
  source TEXT,
  url TEXT,
  published_date TIMESTAMP WITH TIME ZONE,
  relevance_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    d.domain,
    d.document_type,
    d.source,
    d.url,
    d.published_date,
    1 - (d.embedding <=> query_embedding) as relevance_score
  FROM documents d
  WHERE d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: Increment search count for popular searches
CREATE OR REPLACE FUNCTION increment_search_count(search_query TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO popular_searches (query, frequency, last_searched)
  VALUES (search_query, 1, NOW())
  ON CONFLICT (query) 
  DO UPDATE SET
    frequency = popular_searches.frequency + 1,
    last_searched = NOW(),
    updated_at = NOW();
END;
$$;

-- Function: Clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM search_cache
  WHERE expires_at < NOW();
END;
$$;

-- Function: Get or create cached search result
CREATE OR REPLACE FUNCTION get_cached_search(
  query_hash_param TEXT,
  query_param TEXT,
  filters_param JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  cached_result JSONB;
BEGIN
  -- Try to get from cache
  SELECT results INTO cached_result
  FROM search_cache
  WHERE query_hash = query_hash_param
    AND expires_at > NOW();
  
  -- Update hit count if found
  IF cached_result IS NOT NULL THEN
    UPDATE search_cache
    SET hit_count = hit_count + 1
    WHERE query_hash = query_hash_param;
  END IF;
  
  RETURN cached_result;
END;
$$;

-- Function: Save search result to cache
CREATE OR REPLACE FUNCTION save_search_cache(
  query_hash_param TEXT,
  query_param TEXT,
  filters_param JSONB,
  results_param JSONB,
  ttl_seconds INTEGER DEFAULT 3600
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO search_cache (query_hash, query, filters, results, expires_at)
  VALUES (
    query_hash_param,
    query_param,
    filters_param,
    results_param,
    NOW() + (ttl_seconds || ' seconds')::INTERVAL
  )
  ON CONFLICT (query_hash)
  DO UPDATE SET
    results = results_param,
    hit_count = search_cache.hit_count + 1,
    expires_at = NOW() + (ttl_seconds || ' seconds')::INTERVAL;
END;
$$;

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;

-- Documents: Public read access (all authenticated users can read)
CREATE POLICY "Documents are viewable by authenticated users"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

-- Search history: Users can only see their own history
CREATE POLICY "Users can view their own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Popular searches: Public read access
CREATE POLICY "Popular searches are viewable by authenticated users"
  ON popular_searches FOR SELECT
  TO authenticated
  USING (true);

-- Search cache: Public read access for authenticated users
CREATE POLICY "Search cache is viewable by authenticated users"
  ON search_cache FOR SELECT
  TO authenticated
  USING (true);

-- Create a scheduled job to clean expired cache (requires pg_cron extension)
-- Note: This requires pg_cron extension to be enabled
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('clean-search-cache', '0 * * * *', 'SELECT clean_expired_cache()');

-- Sample data for testing (optional)
-- INSERT INTO documents (title, content, domain, document_type, source, published_date)
-- VALUES 
--   ('GDPR Article 5', 'Principles relating to processing of personal data...', 'GDPR', 'Regulation', 'EUR-Lex', '2018-05-25'),
--   ('D.Lgs 231/2001', 'Disciplina della responsabilità amministrativa...', 'D.Lgs 231', 'Regulation', 'Gazzetta Ufficiale', '2001-06-08');

COMMENT ON TABLE documents IS 'Knowledge base documents with 768-dim vector embeddings';
COMMENT ON TABLE search_history IS 'User search history for personalization';
COMMENT ON TABLE popular_searches IS 'Aggregated popular search queries';
COMMENT ON TABLE search_cache IS 'Cache for frequently accessed search results';
COMMENT ON FUNCTION search_documents_semantic IS 'Semantic search using pgvector cosine similarity';
