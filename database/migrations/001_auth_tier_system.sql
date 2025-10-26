-- KB Portal Authentication and Tier Management System
-- Migration: 001_auth_tier_system.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User tiers enum
CREATE TYPE user_tier AS ENUM ('free', 'pro', 'enterprise');

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    tier user_tier NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    subscription_status TEXT,
    trial_ends_at TIMESTAMPTZ,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier limits table
CREATE TABLE IF NOT EXISTS tier_limits (
    tier user_tier PRIMARY KEY,
    searches_per_day INTEGER NOT NULL,
    results_per_search INTEGER NOT NULL,
    advanced_filters BOOLEAN DEFAULT FALSE,
    saved_searches BOOLEAN DEFAULT FALSE,
    export_enabled BOOLEAN DEFAULT FALSE,
    api_access BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    custom_integrations BOOLEAN DEFAULT FALSE
);

-- Insert default tier limits
INSERT INTO tier_limits (tier, searches_per_day, results_per_search, advanced_filters, saved_searches, export_enabled, api_access, priority_support, custom_integrations)
VALUES 
    ('free', 20, 5, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
    ('pro', 500, 50, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE),
    ('enterprise', -1, 100, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (tier) DO UPDATE SET
    searches_per_day = EXCLUDED.searches_per_day,
    results_per_search = EXCLUDED.results_per_search,
    advanced_filters = EXCLUDED.advanced_filters,
    saved_searches = EXCLUDED.saved_searches,
    export_enabled = EXCLUDED.export_enabled,
    api_access = EXCLUDED.api_access,
    priority_support = EXCLUDED.priority_support,
    custom_integrations = EXCLUDED.custom_integrations;

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'search', 'export', 'api_call'
    action_date DATE NOT NULL DEFAULT CURRENT_DATE,
    action_count INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, action_type, action_date)
);

-- OAuth providers table
CREATE TABLE IF NOT EXISTS oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'google', 'microsoft'
    provider_user_id TEXT NOT NULL,
    provider_email TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    search_name TEXT NOT NULL,
    search_query TEXT NOT NULL,
    filters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search history table
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    filters JSONB,
    results_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, action_date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_action_type ON usage_tracking(action_type);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user ON oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_providers_updated_at
    BEFORE UPDATE ON oauth_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name, tier, trial_ends_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        'free',
        NOW() + INTERVAL '14 days' -- 14-day trial
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_user_id UUID,
    p_action_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tier user_tier;
    v_limit INTEGER;
    v_current_usage INTEGER;
BEGIN
    -- Get user tier
    SELECT tier INTO v_tier
    FROM user_profiles
    WHERE id = p_user_id;
    
    -- Get tier limit
    SELECT 
        CASE 
            WHEN p_action_type = 'search' THEN searches_per_day
            ELSE -1
        END INTO v_limit
    FROM tier_limits
    WHERE tier = v_tier;
    
    -- Unlimited for enterprise (-1)
    IF v_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Get current usage
    SELECT COALESCE(SUM(action_count), 0) INTO v_current_usage
    FROM usage_tracking
    WHERE user_id = p_user_id
        AND action_type = p_action_type
        AND action_date = CURRENT_DATE;
    
    RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track usage
CREATE OR REPLACE FUNCTION track_usage(
    p_user_id UUID,
    p_action_type TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_tracking (user_id, action_type, action_date, action_count, metadata)
    VALUES (p_user_id, p_action_type, CURRENT_DATE, 1, p_metadata)
    ON CONFLICT (user_id, action_type, action_date)
    DO UPDATE SET 
        action_count = usage_tracking.action_count + 1,
        metadata = COALESCE(p_metadata, usage_tracking.metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage"
    ON usage_tracking FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage"
    ON usage_tracking FOR INSERT
    WITH CHECK (true);

-- OAuth providers policies
CREATE POLICY "Users can view own oauth providers"
    ON oauth_providers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own oauth providers"
    ON oauth_providers FOR ALL
    USING (auth.uid() = user_id);

-- Saved searches policies
CREATE POLICY "Users can view own saved searches"
    ON saved_searches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved searches"
    ON saved_searches FOR ALL
    USING (auth.uid() = user_id);

-- Search history policies
CREATE POLICY "Users can view own search history"
    ON search_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert search history"
    ON search_history FOR INSERT
    WITH CHECK (true);

-- Audit log policies
CREATE POLICY "Users can view own audit log"
    ON audit_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit log"
    ON audit_log FOR INSERT
    WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
