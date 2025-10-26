/**
 * Script per creare profili utente completi per gli utenti di test
 * 
 * Uso:
 * 1. Assicurati che le variabili d'ambiente siano configurate (.env.local)
 * 2. Esegui: npx tsx scripts/setup-test-users.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Carica le variabili d'ambiente da .env.local
config({ path: resolve(__dirname, '../.env.local') });

// Configurazione
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Errore: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere configurati');
  process.exit(1);
}

// Crea client con service role per operazioni admin
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Utenti da configurare
const testUsers = [
  {
    email: 'druid@numina.ai',
    password: 'kunte4-poQheg-qogzer',
    fullName: 'Druid Dev User (Superuser)',
    tier: 'enterprise' // Superuser con funzionalità illimitate
  },
  {
    email: 'test@nabla.ai',
    password: 'Nabla_Test_2025',
    fullName: 'Nabla Test User',
    tier: 'pro'
  }
];

async function setupTierLimits() {
  console.log('\n📊 Configurazione tier limits...');
  
  const tierLimits = [
    { tier: 'free', searches_per_day: 10, documents_per_month: 5 },
    { tier: 'pro', searches_per_day: 100, documents_per_month: 50 },
    { tier: 'enterprise', searches_per_day: -1, documents_per_month: -1 }
  ];

  for (const limit of tierLimits) {
    const { error } = await supabase
      .from('tier_limits')
      .upsert(limit, { onConflict: 'tier' });
    
    if (error) {
      console.error(`❌ Errore creazione tier ${limit.tier}:`, error.message);
    } else {
      console.log(`✅ Tier ${limit.tier} configurato`);
    }
  }
}

async function createOrUpdateUser(userData: typeof testUsers[0]) {
  console.log(`\n👤 Configurazione utente: ${userData.email}`);
  
  try {
    // 1. Verifica se l'utente esiste già
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Errore verifica utenti:', listError.message);
      return;
    }
    
    let userId: string | null = null;
    const existingUser = existingUsers.users.find(u => u.email === userData.email);
    
    if (existingUser) {
      console.log(`✅ Utente già esistente: ${existingUser.id}`);
      userId = existingUser.id;
      
      // Aggiorna la password se necessario
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: userData.password }
      );
      
      if (updateError) {
        console.error('⚠️  Errore aggiornamento password:', updateError.message);
      } else {
        console.log('✅ Password aggiornata');
      }
    } else {
      // 2. Crea nuovo utente
      console.log('📝 Creazione nuovo utente...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.fullName
        }
      });
      
      if (createError) {
        console.error('❌ Errore creazione utente:', createError.message);
        return;
      }
      
      userId = newUser.user.id;
      console.log(`✅ Utente creato: ${userId}`);
    }
    
    // 3. Crea/aggiorna profilo utente
    console.log('📝 Configurazione profilo...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        full_name: userData.fullName,
        tier: userData.tier,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (profileError) {
      console.error('❌ Errore creazione profilo:', profileError.message);
    } else {
      console.log('✅ Profilo configurato');
    }
    
    // 4. Inizializza usage tracking
    console.log('📝 Inizializzazione usage tracking...');
    const today = new Date().toISOString().split('T')[0];
    const { error: usageError } = await supabase
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        action_type: 'search',
        action_count: 0,
        action_date: today,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id,action_type,action_date', ignoreDuplicates: true });
    
    if (usageError) {
      console.error('⚠️  Errore inizializzazione usage:', usageError.message);
    } else {
      console.log('✅ Usage tracking inizializzato');
    }
    
    // 5. Verifica configurazione completa
    console.log('🔍 Verifica configurazione...');
    const { data: profile, error: verifyError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        tier_limits:tier_limits(*)
      `)
      .eq('id', userId)
      .single();
    
    if (verifyError) {
      console.error('❌ Errore verifica:', verifyError.message);
    } else {
      console.log('✅ Configurazione completa verificata:');
      console.log(`   - Email: ${userData.email}`);
      console.log(`   - Nome: ${profile.full_name}`);
      console.log(`   - Tier: ${profile.tier}`);
      console.log(`   - Ricerche/giorno: ${profile.tier_limits?.searches_per_day === -1 ? 'Illimitate' : profile.tier_limits?.searches_per_day}`);
      console.log(`   - Documenti/mese: ${profile.tier_limits?.documents_per_month === -1 ? 'Illimitati' : profile.tier_limits?.documents_per_month}`);
    }
    
  } catch (error) {
    console.error('❌ Errore imprevisto:', error);
  }
}

async function verifySetup() {
  console.log('\n\n🔍 VERIFICA FINALE\n');
  console.log('='.repeat(60));
  
  for (const userData of testUsers) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === userData.email);
    
    if (!user) {
      console.log(`\n❌ ${userData.email}: Utente non trovato`);
      continue;
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(`
        *,
        tier_limits:tier_limits(*)
      `)
      .eq('id', user.id)
      .single();
    
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('action_count')
      .eq('user_id', user.id)
      .eq('action_type', 'search')
      .eq('action_date', today)
      .maybeSingle();
    
    console.log(`\n✅ ${userData.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Nome: ${profile?.full_name || '❌ Non configurato'}`);
    console.log(`   Tier: ${profile?.tier || '❌ Non configurato'}`);
    console.log(`   Ricerche oggi: ${usage?.action_count || 0}`);
    console.log(`   Limite ricerche: ${profile?.tier_limits?.searches_per_day === -1 ? 'Illimitate' : profile?.tier_limits?.searches_per_day || '❌ Non configurato'}`);
  }
  
  console.log('\n' + '='.repeat(60));
}

async function main() {
  console.log('🚀 Inizio configurazione utenti di test per KB Portal\n');
  
  try {
    // 1. Setup tier limits
    await setupTierLimits();
    
    // 2. Configura ogni utente
    for (const userData of testUsers) {
      await createOrUpdateUser(userData);
    }
    
    // 3. Verifica finale
    await verifySetup();
    
    console.log('\n\n🎉 Configurazione completata con successo!\n');
    console.log('📝 Credenziali di accesso:');
    console.log('   1. druid@numina.ai / kunte4-poQheg-qogzer');
    console.log('   2. test@nabla.ai / Nabla_Test_2025');
    console.log('\n🔗 URL: https://kb-portal-blond.vercel.app/login\n');
    
  } catch (error) {
    console.error('\n❌ Errore durante la configurazione:', error);
    process.exit(1);
  }
}

main();
