-- Migration 011: Personalized Recommendations System
-- This migration creates tables and functions for tracking user behavior and generating personalized recommendations

-- ============================================================================
-- USER BEHAVIOR TRACKING
-- ============================================================================

-- Track user interactions with documents
CREATE TABLE IF NOT EXISTS user_document_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL,
  interaction_type VARCHAR(50) NOT NULL, -- 'view', 'bookmark', 'export', 'annotate', 'cite'
  interaction_duration INTEGER, -- Duration in seconds (for views)
  interaction_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track user search patterns
CREATE TABLE IF NOT EXISTS user_search_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  domain VARCHAR(100),
  document_type VARCHAR(100),
  result_clicked_count INTEGER DEFAULT 0,
  avg_relevance_score DECIMAL(3, 2),
  search_frequency INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track user interests based on embeddings
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_vector vector(768), -- 768-dim embedding for interest
  interest_domain VARCHAR(100),
  interest_keywords TEXT[],
  confidence_score DECIMAL(3, 2) DEFAULT 0.5,
  interaction_count INTEGER DEFAULT 1,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PERSONALIZED RECOMMENDATIONS
-- ============================================================================

-- Store generated recommendations
CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL, -- 'interest_based', 'behavior_based', 'trending', 'similar_users'
  relevance_score DECIMAL(3, 2) NOT NULL,
  reasoning TEXT,
  metadata JSONB DEFAULT '{}',
  shown_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Track recommendation performance
CREATE TABLE IF NOT EXISTS recommendation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES user_recommendations(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- 'impression', 'click', 'dismiss', 'engagement'
  metric_value DECIMAL(5, 2),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User document interactions indexes
CREATE INDEX IF NOT EXISTS idx_user_doc_interactions_user_id ON user_document_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_doc_interactions_document_id ON user_document_interactions(document_id);
CREATE INDEX IF NOT EXISTS idx_user_doc_interactions_type ON user_document_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_doc_interactions_created_at ON user_document_interactions(created_at DESC);

-- User search patterns indexes
CREATE INDEX IF NOT EXISTS idx_user_search_patterns_user_id ON user_search_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_patterns_domain ON user_search_patterns(domain);
CREATE INDEX IF NOT EXISTS idx_user_search_patterns_frequency ON user_search_patterns(search_frequency DESC);
CREATE INDEX IF NOT EXISTS idx_user_search_patterns_last_searched ON user_search_patterns(last_searched_at DESC);

-- User interests indexes
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_domain ON user_interests(interest_domain);
CREATE INDEX IF NOT EXISTS idx_user_interests_confidence ON user_interests(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_interests_vector ON user_interests USING ivfflat (interest_vector vector_cosine_ops);

-- User recommendations indexes
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_document_id ON user_recommendations(document_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_type ON user_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_score ON user_recommendations(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_expires_at ON user_recommendations(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_shown_at ON user_recommendations(shown_at);

-- Recommendation metrics indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_metrics_user_id ON recommendation_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_metrics_recommendation_id ON recommendation_metrics(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_metrics_type ON recommendation_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_recommendation_metrics_recorded_at ON recommendation_metrics(recorded_at DESC);

-- ============================================================================
-- FUNCTIONS FOR BEHAVIOR TRACKING
-- ============================================================================

-- Function to track document interaction
CREATE OR REPLACE FUNCTION track_document_interaction(
  p_user_id UUID,
  p_document_id UUID,
  p_interaction_type VARCHAR,
  p_duration INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_interaction_id UUID;
BEGIN
  -- Insert interaction
  INSERT INTO user_document_interactions (
    user_id,
    document_id,
    interaction_type,
    interaction_duration,
    interaction_metadata
  ) VALUES (
    p_user_id,
    p_document_id,
    p_interaction_type,
    p_duration,
    p_metadata
  ) RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update search patterns
CREATE OR REPLACE FUNCTION update_search_pattern(
  p_user_id UUID,
  p_query TEXT,
  p_domain VARCHAR DEFAULT NULL,
  p_document_type VARCHAR DEFAULT NULL,
  p_relevance_score DECIMAL DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_pattern_id UUID;
  v_existing_pattern RECORD;
BEGIN
  -- Check if pattern exists
  SELECT * INTO v_existing_pattern
  FROM user_search_patterns
  WHERE user_id = p_user_id
    AND query = p_query
    AND (domain = p_domain OR (domain IS NULL AND p_domain IS NULL))
    AND (document_type = p_document_type OR (document_type IS NULL AND p_document_type IS NULL));
  
  IF FOUND THEN
    -- Update existing pattern
    UPDATE user_search_patterns
    SET search_frequency = search_frequency + 1,
        avg_relevance_score = CASE 
          WHEN p_relevance_score IS NOT NULL THEN 
            (COALESCE(avg_relevance_score, 0) * search_frequency + p_relevance_score) / (search_frequency + 1)
          ELSE avg_relevance_score
        END,
        last_searched_at = NOW()
    WHERE id = v_existing_pattern.id
    RETURNING id INTO v_pattern_id;
  ELSE
    -- Insert new pattern
    INSERT INTO user_search_patterns (
      user_id,
      query,
      domain,
      document_type,
      avg_relevance_score,
      search_frequency
    ) VALUES (
      p_user_id,
      p_query,
      p_domain,
      p_document_type,
      p_relevance_score,
      1
    ) RETURNING id INTO v_pattern_id;
  END IF;
  
  RETURN v_pattern_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user interests
CREATE OR REPLACE FUNCTION update_user_interest(
  p_user_id UUID,
  p_interest_vector vector(768),
  p_domain VARCHAR DEFAULT NULL,
  p_keywords TEXT[] DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_interest_id UUID;
  v_existing_interest RECORD;
  v_similarity DECIMAL;
BEGIN
  -- Find similar existing interest
  SELECT *, 1 - (interest_vector <=> p_interest_vector) as similarity
  INTO v_existing_interest
  FROM user_interests
  WHERE user_id = p_user_id
    AND (interest_domain = p_domain OR (interest_domain IS NULL AND p_domain IS NULL))
  ORDER BY interest_vector <=> p_interest_vector
  LIMIT 1;
  
  -- If similar interest exists (similarity > 0.8), update it
  IF FOUND AND v_existing_interest.similarity > 0.8 THEN
    UPDATE user_interests
    SET interest_vector = (
          (interest_vector::text::float[] || p_interest_vector::text::float[])::vector(768)
        ),
        interest_keywords = CASE 
          WHEN p_keywords IS NOT NULL THEN 
            array(SELECT DISTINCT unnest(interest_keywords || p_keywords))
          ELSE interest_keywords
        END,
        interaction_count = interaction_count + 1,
        confidence_score = LEAST(1.0, confidence_score + 0.05),
        last_updated_at = NOW()
    WHERE id = v_existing_interest.id
    RETURNING id INTO v_interest_id;
  ELSE
    -- Insert new interest
    INSERT INTO user_interests (
      user_id,
      interest_vector,
      interest_domain,
      interest_keywords,
      confidence_score
    ) VALUES (
      p_user_id,
      p_interest_vector,
      p_domain,
      p_keywords,
      0.5
    ) RETURNING id INTO v_interest_id;
  END IF;
  
  RETURN v_interest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTIONS FOR RECOMMENDATIONS
-- ============================================================================

-- Function to generate interest-based recommendations
CREATE OR REPLACE FUNCTION generate_interest_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  document_id UUID,
  relevance_score DECIMAL,
  reasoning TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_interest_vectors AS (
    SELECT interest_vector, confidence_score
    FROM user_interests
    WHERE user_id = p_user_id
    ORDER BY confidence_score DESC, last_updated_at DESC
    LIMIT 5
  ),
  document_scores AS (
    SELECT 
      d.id as document_id,
      AVG(1 - (d.embedding <=> ui.interest_vector)) * AVG(ui.confidence_score) as score
    FROM documents d
    CROSS JOIN user_interest_vectors ui
    WHERE d.embedding IS NOT NULL
    GROUP BY d.id
  )
  SELECT 
    ds.document_id,
    ROUND(ds.score::numeric, 2) as relevance_score,
    'Based on your interests and reading patterns' as reasoning
  FROM document_scores ds
  WHERE ds.score > 0.6
  ORDER BY ds.score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate behavior-based recommendations
CREATE OR REPLACE FUNCTION generate_behavior_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  document_id UUID,
  relevance_score DECIMAL,
  reasoning TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_interactions AS (
    SELECT DISTINCT document_id
    FROM user_document_interactions
    WHERE user_id = p_user_id
      AND interaction_type IN ('view', 'bookmark', 'export')
      AND created_at > NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 20
  ),
  similar_documents AS (
    SELECT 
      d2.id as document_id,
      AVG(1 - (d1.embedding <=> d2.embedding)) as similarity
    FROM documents d1
    INNER JOIN recent_interactions ri ON d1.id = ri.document_id
    CROSS JOIN documents d2
    WHERE d1.embedding IS NOT NULL
      AND d2.embedding IS NOT NULL
      AND d2.id != d1.id
      AND d2.id NOT IN (SELECT document_id FROM recent_interactions)
    GROUP BY d2.id
  )
  SELECT 
    sd.document_id,
    ROUND(sd.similarity::numeric, 2) as relevance_score,
    'Similar to documents you''ve recently viewed' as reasoning
  FROM similar_documents sd
  WHERE sd.similarity > 0.7
  ORDER BY sd.similarity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending documents
CREATE OR REPLACE FUNCTION get_trending_documents(
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  document_id UUID,
  relevance_score DECIMAL,
  reasoning TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    document_id,
    ROUND((interaction_count::DECIMAL / GREATEST(days_old, 1))::numeric, 2) as relevance_score,
    'Trending in the community' as reasoning
  FROM (
    SELECT 
      udi.document_id,
      COUNT(*) as interaction_count,
      EXTRACT(DAY FROM NOW() - MIN(udi.created_at)) + 1 as days_old
    FROM user_document_interactions udi
    WHERE udi.created_at > NOW() - INTERVAL '7 days'
      AND udi.interaction_type IN ('view', 'bookmark', 'export')
    GROUP BY udi.document_id
  ) trending
  WHERE interaction_count > 5
  ORDER BY relevance_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save recommendations
CREATE OR REPLACE FUNCTION save_recommendations(
  p_user_id UUID,
  p_recommendations JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_rec JSONB;
BEGIN
  -- Clear old recommendations
  DELETE FROM user_recommendations
  WHERE user_id = p_user_id
    AND expires_at < NOW();
  
  -- Insert new recommendations
  FOR v_rec IN SELECT * FROM jsonb_array_elements(p_recommendations)
  LOOP
    INSERT INTO user_recommendations (
      user_id,
      document_id,
      recommendation_type,
      relevance_score,
      reasoning,
      metadata
    ) VALUES (
      p_user_id,
      (v_rec->>'document_id')::UUID,
      v_rec->>'recommendation_type',
      (v_rec->>'relevance_score')::DECIMAL,
      v_rec->>'reasoning',
      COALESCE(v_rec->'metadata', '{}'::jsonb)
    )
    ON CONFLICT DO NOTHING;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track recommendation metric
CREATE OR REPLACE FUNCTION track_recommendation_metric(
  p_user_id UUID,
  p_recommendation_id UUID,
  p_metric_type VARCHAR,
  p_metric_value DECIMAL DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  -- Insert metric
  INSERT INTO recommendation_metrics (
    user_id,
    recommendation_id,
    metric_type,
    metric_value
  ) VALUES (
    p_user_id,
    p_recommendation_id,
    p_metric_type,
    p_metric_value
  ) RETURNING id INTO v_metric_id;
  
  -- Update recommendation timestamps
  IF p_metric_type = 'impression' THEN
    UPDATE user_recommendations
    SET shown_at = NOW()
    WHERE id = p_recommendation_id AND shown_at IS NULL;
  ELSIF p_metric_type = 'click' THEN
    UPDATE user_recommendations
    SET clicked_at = NOW()
    WHERE id = p_recommendation_id AND clicked_at IS NULL;
  ELSIF p_metric_type = 'dismiss' THEN
    UPDATE user_recommendations
    SET dismissed_at = NOW()
    WHERE id = p_recommendation_id AND dismissed_at IS NULL;
  END IF;
  
  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_document_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for user_document_interactions
CREATE POLICY "Users can view their own interactions"
  ON user_document_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON user_document_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_search_patterns
CREATE POLICY "Users can view their own search patterns"
  ON user_search_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search patterns"
  ON user_search_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search patterns"
  ON user_search_patterns FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for user_interests
CREATE POLICY "Users can view their own interests"
  ON user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests"
  ON user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests"
  ON user_interests FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for user_recommendations
CREATE POLICY "Users can view their own recommendations"
  ON user_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON user_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for recommendation_metrics
CREATE POLICY "Users can view their own metrics"
  ON recommendation_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
  ON recommendation_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT ON user_document_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_search_patterns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_interests TO authenticated;
GRANT SELECT, UPDATE ON user_recommendations TO authenticated;
GRANT SELECT, INSERT ON recommendation_metrics TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION track_document_interaction TO authenticated;
GRANT EXECUTE ON FUNCTION update_search_pattern TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_interest TO authenticated;
GRANT EXECUTE ON FUNCTION generate_interest_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION generate_behavior_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_documents TO authenticated;
GRANT EXECUTE ON FUNCTION save_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION track_recommendation_metric TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_document_interactions IS 'Tracks all user interactions with documents for behavior analysis';
COMMENT ON TABLE user_search_patterns IS 'Stores aggregated search patterns for each user';
COMMENT ON TABLE user_interests IS 'Maintains user interest profiles using embeddings';
COMMENT ON TABLE user_recommendations IS 'Stores personalized recommendations for users';
COMMENT ON TABLE recommendation_metrics IS 'Tracks performance metrics for recommendations';

COMMENT ON FUNCTION track_document_interaction IS 'Records a user interaction with a document';
COMMENT ON FUNCTION update_search_pattern IS 'Updates or creates a search pattern for a user';
COMMENT ON FUNCTION update_user_interest IS 'Updates or creates a user interest profile';
COMMENT ON FUNCTION generate_interest_recommendations IS 'Generates recommendations based on user interests';
COMMENT ON FUNCTION generate_behavior_recommendations IS 'Generates recommendations based on user behavior';
COMMENT ON FUNCTION get_trending_documents IS 'Returns currently trending documents';
COMMENT ON FUNCTION save_recommendations IS 'Saves a batch of recommendations for a user';
COMMENT ON FUNCTION track_recommendation_metric IS 'Records a metric for a recommendation';
