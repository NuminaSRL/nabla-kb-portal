# Scripts per KB Portal

## Setup Utenti di Test

### Prerequisiti

1. Assicurati di avere il `SUPABASE_SERVICE_ROLE_KEY` nel file `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ⚠️ IMPORTANTE: Questo è necessario per lo script
```

2. Il Service Role Key si trova in Supabase Dashboard:
   - Vai su Project Settings > API
   - Copia il "service_role" key (non l'anon key!)
   - ⚠️ ATTENZIONE: Questo key ha privilegi admin, non committarlo mai su Git!

### Esecuzione

```bash
# Dalla directory kb-portal
cd kb-portal

# Installa tsx se non è già installato
npm install -D tsx

# Esegui lo script
npx tsx scripts/setup-test-users.ts
```

### Cosa fa lo script

1. ✅ Configura i tier limits (free, pro, enterprise)
2. ✅ Crea o aggiorna gli utenti:
   - druid@numina.ai (tier: pro)
   - test@nabla.ai (tier: pro)
3. ✅ Crea i profili utente nella tabella `user_profiles`
4. ✅ Inizializza il tracking degli utilizzi
5. ✅ Verifica che tutto sia configurato correttamente

### Output atteso

```
🚀 Inizio configurazione utenti di test per KB Portal

📊 Configurazione tier limits...
✅ Tier free configurato
✅ Tier pro configurato
✅ Tier enterprise configurato

👤 Configurazione utente: druid@numina.ai
✅ Utente creato: abc-123-def
✅ Profilo configurato
✅ Usage tracking inizializzato
✅ Configurazione completa verificata:
   - Email: druid@numina.ai
   - Nome: Druid Dev User
   - Tier: pro
   - Ricerche/giorno: 100
   - Documenti/mese: 50

[... stesso per test@nabla.ai ...]

🔍 VERIFICA FINALE
============================================================

✅ druid@numina.ai
   User ID: abc-123-def
   Nome: Druid Dev User
   Tier: pro
   Ricerche oggi: 0
   Limite ricerche: 100

✅ test@nabla.ai
   User ID: xyz-789-ghi
   Nome: Nabla Test User
   Tier: pro
   Ricerche oggi: 0
   Limite ricerche: 100

============================================================

🎉 Configurazione completata con successo!

📝 Credenziali di accesso:
   1. druid@numina.ai / kunte4-poQheg-qogzer
   2. test@nabla.ai / Nabla_Test_2025

🔗 URL: https://kb-portal-blond.vercel.app/login
```

### Troubleshooting

**Errore: "Unauthorized"**
- Verifica che `SUPABASE_SERVICE_ROLE_KEY` sia configurato correttamente
- Assicurati di usare il service_role key, non l'anon key

**Errore: "relation does not exist"**
- Le tabelle del database non sono state create
- Esegui prima le migration SQL per creare le tabelle

**Errore: "permission denied"**
- Verifica le RLS policies sulle tabelle
- Il service_role key dovrebbe bypassare le RLS, ma controlla comunque

### Alternative: SQL Script

Se preferisci usare SQL direttamente, puoi eseguire `setup-test-users.sql` nel SQL Editor di Supabase.
