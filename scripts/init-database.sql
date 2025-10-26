-- Script di inizializzazione database per KB Portal
-- Esegui questo script nel SQL Editor di Supabase prima di configurare gli utenti

-- 1. Crea la tabella user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crea la tabella tier_limits
CREATE TABLE IF NOT EXISTS tier_limits (
  tier TEXT PRIMARY KEY,
  searches_per_day INTEGER DEFAULT 10,
  documents_per_month INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crea la tabella usage_tracking
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_count INTEGER DEFAULT 1,
  action_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, action_type, action_date)
);

-- 4. Abilita Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- 5. Crea le policy RLS per user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Crea le policy RLS per tier_limits (leggibili da tutti gli utenti autenticati)
DROP POLICY IF EXISTS "Authenticated users can view tier limits" ON tier_limits;
CREATE POLICY "Authenticated users can view tier limits" ON tier_limits
  FOR SELECT TO authenticated USING (true);

-- 7. Crea le policy RLS per usage_tracking
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage" ON usage_tracking;
CREATE POLICY "Users can insert own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own usage" ON usage_tracking;
CREATE POLICY "Users can update own usage" ON usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. Inserisci i tier limits predefiniti
INSERT INTO tier_limits (tier, searches_per_day, documents_per_month) VALUES
  ('free', 10, 5),
  ('pro', 100, 50),
  ('enterprise', -1, -1)
ON CONFLICT (tier) DO UPDATE SET
  searches_per_day = EXCLUDED.searches_per_day,
  documents_per_month = EXCLUDED.documents_per_month;

-- 9. Crea una funzione per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Crea i trigger per aggiornare updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tier_limits_updated_at ON tier_limits;
CREATE TRIGGER update_tier_limits_updated_at
  BEFORE UPDATE ON tier_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Crea indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, action_date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_action_type ON usage_tracking(action_type);

-- 12. Verifica che tutto sia stato creato correttamente
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM user_profiles
UNION ALL
SELECT 
  'tier_limits' as table_name,
  COUNT(*) as row_count
FROM tier_limits
UNION ALL
SELECT 
  'usage_tracking' as table_name,
  COUNT(*) as row_count
FROM usage_tracking;

-- 13. Mostra i tier limits configurati
SELECT * FROM tier_limits ORDER BY tier;
