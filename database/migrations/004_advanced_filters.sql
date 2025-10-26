-- Migration: Advanced Filters System
-- Description: Tables for filter presets, analytics, and faceted search support

-- Filter presets table
CREATE TABLE IF NOT EXISTS filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for filter presets
CREATE INDEX IF NOT EXISTS filter_presets_user_idx ON filter_presets(user_id);
CREATE INDEX IF NOT EXISTS filter_presets_default_idx ON filter_presets(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS filter_presets_created_at_idx ON filter_presets(created_at DESC);

-- Filter analytics table
CREATE TABLE IF NOT EXISTS filter_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filters JSONB NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for filter analytics
CREATE INDEX IF NOT EXISTS filter_analytics_user_idx ON filter_analytics(user_id);
CREATE INDEX IF NOT EXISTS filter_analytics_used_at_idx ON filter_analytics(used_at DESC);
CREATE INDEX IF NOT EXISTS filter_analytics_filters_idx ON filter_analytics USING gin(filters);

-- Facet counts materialized view (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS document_facets AS
SELECT
  domain,
  document_type,
  source,
  COUNT(*) as count,
  DATE_TRUNC('month', published_date) as month
FROM documents
GROUP BY domain, document_type, source, DATE_TRUNC('month', published_date);

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS document_facets_domain_idx ON document_facets(domain);
CREATE INDEX IF NOT EXISTS document_facets_type_idx ON document_facets(document_type);
CREATE INDEX IF NOT EXISTS document_facets_source_idx ON document_facets(source);
CREATE INDEX IF NOT EXISTS document_facets_month_idx ON document_facets(month);

-- Function to refresh facet counts
CREATE OR REPLACE FUNCTION refresh_document_facets()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY document_facets;
END;
$$;

-- Function to get facet counts with filters
CREATE OR REPLACE FUNCTION get_facet_counts(
  domain_filter TEXT[] DEFAULT NULL,
  type_filter TEXT[] DEFAULT NULL,
  source_filter TEXT[] DEFAULT NULL,
  date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  facet_type TEXT,
  facet_value TEXT,
  count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Domain facets
  RETURN QUERY
  SELECT 
    'domain'::TEXT as facet_type,
    d.domain as facet_value,
    COUNT(*)::BIGINT as count
  FROM documents d
  WHERE 
    (type_filter IS NULL OR d.document_type = ANY(type_filter))
    AND (source_filter IS NULL OR d.source = ANY(source_filter))
    AND (date_from IS NULL OR d.published_date >= date_from)
    AND (date_to IS NULL OR d.published_date <= date_to)
  GROUP BY d.domain;

  -- Document type facets
  RETURN QUERY
  SELECT 
    'document_type'::TEXT as facet_type,
    d.document_type as facet_value,
    COUNT(*)::BIGINT as count
  FROM documents d
  WHERE 
    (domain_filter IS NULL OR d.domain = ANY(domain_filter))
    AND (source_filter IS NULL OR d.source = ANY(source_filter))
    AND (date_from IS NULL OR d.published_date >= date_from)
    AND (date_to IS NULL OR d.published_date <= date_to)
  GROUP BY d.document_type;

  -- Source facets
  RETURN QUERY
  SELECT 
    'source'::TEXT as facet_type,
    d.source as facet_value,
    COUNT(*)::BIGINT as count
  FROM documents d
  WHERE 
    (domain_filter IS NULL OR d.domain = ANY(domain_filter))
    AND (type_filter IS NULL OR d.document_type = ANY(type_filter))
    AND (date_from IS NULL OR d.published_date >= date_from)
    AND (date_to IS NULL OR d.published_date <= date_to)
  GROUP BY d.source;
END;
$$;

-- Function to apply filters to search
CREATE OR REPLACE FUNCTION search_with_filters(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20,
  domain_filter TEXT[] DEFAULT NULL,
  type_filter TEXT[] DEFAULT NULL,
  source_filter TEXT[] DEFAULT NULL,
  date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
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
    AND (domain_filter IS NULL OR d.domain = ANY(domain_filter))
    AND (type_filter IS NULL OR d.document_type = ANY(type_filter))
    AND (source_filter IS NULL OR d.source = ANY(source_filter))
    AND (date_from IS NULL OR d.published_date >= date_from)
    AND (date_to IS NULL OR d.published_date <= date_to)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get popular filter combinations
CREATE OR REPLACE FUNCTION get_popular_filter_combinations(
  user_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
  filters JSONB,
  usage_count BIGINT,
  avg_result_count NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fa.filters,
    COUNT(*)::BIGINT as usage_count,
    AVG(fa.result_count)::NUMERIC as avg_result_count
  FROM filter_analytics fa
  WHERE user_id_param IS NULL OR fa.user_id = user_id_param
  GROUP BY fa.filters
  ORDER BY COUNT(*) DESC
  LIMIT limit_param;
END;
$$;

-- Function to clean old analytics data
CREATE OR REPLACE FUNCTION clean_old_filter_analytics(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM filter_analytics
  WHERE used_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Row Level Security (RLS) policies

-- Enable RLS on new tables
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_analytics ENABLE ROW LEVEL SECURITY;

-- Filter presets: Users can only manage their own presets
CREATE POLICY "Users can view their own filter presets"
  ON filter_presets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own filter presets"
  ON filter_presets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own filter presets"
  ON filter_presets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own filter presets"
  ON filter_presets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Filter analytics: Users can only view their own analytics
CREATE POLICY "Users can view their own filter analytics"
  ON filter_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own filter analytics"
  ON filter_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_filter_presets_updated_at
  BEFORE UPDATE ON filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create scheduled job to refresh facets (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('refresh-document-facets', '0 */6 * * *', 'SELECT refresh_document_facets()');

-- Create scheduled job to clean old analytics (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('clean-filter-analytics', '0 2 * * *', 'SELECT clean_old_filter_analytics(90)');

-- Sample filter presets for testing (optional)
-- INSERT INTO filter_presets (user_id, name, filters, is_default)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000000', 'GDPR Only', '{"domain": ["GDPR"], "documentType": [], "source": [], "dateFrom": "", "dateTo": "", "minScore": 0.5}', false),
--   ('00000000-0000-0000-0000-000000000000', 'Recent Regulations', '{"domain": [], "documentType": ["Regulation"], "source": [], "dateFrom": "2023-01-01", "dateTo": "", "minScore": 0.5}', false);

COMMENT ON TABLE filter_presets IS 'User-saved filter presets for quick access';
COMMENT ON TABLE filter_analytics IS 'Analytics tracking for filter usage patterns';
COMMENT ON MATERIALIZED VIEW document_facets IS 'Pre-computed facet counts for performance';
COMMENT ON FUNCTION get_facet_counts IS 'Get facet counts with optional filters applied';
COMMENT ON FUNCTION search_with_filters IS 'Semantic search with comprehensive filter support';
COMMENT ON FUNCTION get_popular_filter_combinations IS 'Get most frequently used filter combinations';
