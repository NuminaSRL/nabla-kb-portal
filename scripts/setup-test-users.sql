-- Script per creare profili utente completi per gli utenti di test
-- Esegui questo script nel SQL Editor di Supabase

-- IMPORTANTE: Prima di eseguire questo script, assicurati che gli utenti siano già stati creati
-- tramite Supabase Authentication Dashboard o signup

-- 1. Trova gli UUID degli utenti (sostituisci con gli UUID reali dopo la creazione)
-- SELECT id, email FROM auth.users WHERE email IN ('druid@numina.ai', 'test@nabla.ai');

-- 2. Crea i profili utente (sostituisci gli UUID con quelli reali)
-- Per druid@numina.ai (SUPERUSER con funzionalità illimitate)
INSERT INTO user_profiles (id, full_name, tier, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'druid@numina.ai'),
  'Druid Dev User (Superuser)',
  'enterprise',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  tier = EXCLUDED.tier;

-- Per test@nabla.ai
INSERT INTO user_profiles (id, full_name, tier, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@nabla.ai'),
  'Nabla Test User',
  'pro',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  tier = EXCLUDED.tier;

-- 3. Verifica che i profili siano stati creati
SELECT 
  u.email,
  up.full_name,
  up.tier,
  up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email IN ('druid@numina.ai', 'test@nabla.ai');

-- 4. Verifica che i tier limits esistano
SELECT * FROM tier_limits WHERE tier IN ('free', 'pro', 'enterprise');

-- Se i tier limits non esistono, creali:
INSERT INTO tier_limits (tier, searches_per_day, documents_per_month, created_at)
VALUES
  ('free', 10, 5, NOW()),
  ('pro', 100, 50, NOW()),
  ('enterprise', -1, -1, NOW())
ON CONFLICT (tier) DO NOTHING;

-- 5. Inizializza usage tracking per oggi (opzionale)
INSERT INTO usage_tracking (user_id, action_type, action_count, action_date, created_at)
SELECT 
  id,
  'search',
  0,
  CURRENT_DATE,
  NOW()
FROM auth.users
WHERE email IN ('druid@numina.ai', 'test@nabla.ai')
ON CONFLICT DO NOTHING;

-- 6. Verifica finale completa
SELECT 
  u.email,
  u.created_at as user_created,
  up.full_name,
  up.tier,
  tl.searches_per_day,
  tl.documents_per_month,
  COALESCE(ut.action_count, 0) as searches_today
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN tier_limits tl ON up.tier = tl.tier
LEFT JOIN usage_tracking ut ON u.id = ut.user_id 
  AND ut.action_type = 'search' 
  AND ut.action_date = CURRENT_DATE
WHERE u.email IN ('druid@numina.ai', 'test@nabla.ai');
