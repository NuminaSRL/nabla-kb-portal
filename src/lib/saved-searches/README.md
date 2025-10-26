# Saved Searches Library

This directory contains the core services for the saved searches and alerts system.

## Services

### SavedSearchService

Manages CRUD operations for saved searches.

**Usage:**
```typescript
import { savedSearchService } from '@/lib/saved-searches/saved-search-service';

// Create a saved search
const savedSearch = await savedSearchService.createSavedSearch(userId, {
  name: 'GDPR Updates',
  query: 'GDPR compliance requirements',
  alert_enabled: true,
  alert_frequency: 'weekly'
});

// Get all saved searches
const searches = await savedSearchService.getSavedSearches(userId);

// Execute a saved search
const results = await savedSearchService.executeSavedSearch(userId, searchId);

// Update a saved search
await savedSearchService.updateSavedSearch(userId, searchId, {
  name: 'Updated Name',
  alert_enabled: false
});

// Delete a saved search
await savedSearchService.deleteSavedSearch(userId, searchId);

// Check tier limit
const canCreate = await savedSearchService.checkSavedSearchLimit(userId);
const limit = await savedSearchService.getSavedSearchLimit(userId);
```

### AlertScheduler

Processes the alert queue and sends email notifications.

**Usage:**
```typescript
import { alertScheduler } from '@/lib/saved-searches/alert-scheduler';

// Start the scheduler (runs every hour)
alertScheduler.startScheduler();

// Process alerts manually
await alertScheduler.processAlerts();
```

**Deployment:**
The alert scheduler should run as a separate service on Railway:
```bash
npm run scheduler
```

### EmailService

Sends email notifications via Resend API.

**Usage:**
```typescript
import { emailService } from '@/lib/saved-searches/email-service';

// Send an email
const sent = await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'New Documents Alert',
  html: '<h1>New Documents</h1>',
  text: 'New Documents'
});

// Send batch emails
const results = await emailService.sendBatchEmails([
  { to: 'user1@example.com', subject: 'Alert 1', html: '...', text: '...' },
  { to: 'user2@example.com', subject: 'Alert 2', html: '...', text: '...' }
]);

// Validate email
const isValid = emailService.isValidEmail('user@example.com');
```

## Types

### SavedSearch
```typescript
interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: string;
  filters: SearchOptions;
  alert_enabled: boolean;
  alert_frequency: 'daily' | 'weekly' | 'monthly';
  last_alert_sent_at: string | null;
  last_result_count: number;
  created_at: string;
  updated_at: string;
}
```

### SearchAlert
```typescript
interface SearchAlert {
  id: string;
  saved_search_id: string;
  user_id: string;
  new_documents_count: number;
  alert_sent_at: string;
  email_sent: boolean;
  email_error: string | null;
  document_ids: string[];
  metadata: Record<string, any>;
}
```

### SavedSearchCreate
```typescript
interface SavedSearchCreate {
  name: string;
  query: string;
  filters?: SearchOptions;
  alert_enabled?: boolean;
  alert_frequency?: 'daily' | 'weekly' | 'monthly';
}
```

### SavedSearchUpdate
```typescript
interface SavedSearchUpdate {
  name?: string;
  query?: string;
  filters?: SearchOptions;
  alert_enabled?: boolean;
  alert_frequency?: 'daily' | 'weekly' | 'monthly';
}
```

## Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=alerts@kb.nabla.ai

# App
NEXT_PUBLIC_APP_URL=https://kb.nabla.ai
```

## Database Schema

### saved_searches
```sql
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  alert_enabled BOOLEAN DEFAULT FALSE,
  alert_frequency TEXT CHECK (alert_frequency IN ('daily', 'weekly', 'monthly')),
  last_alert_sent_at TIMESTAMP WITH TIME ZONE,
  last_result_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### search_alerts
```sql
CREATE TABLE search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  new_documents_count INTEGER DEFAULT 0,
  alert_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE,
  email_error TEXT,
  document_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);
```

### alert_queue
```sql
CREATE TABLE alert_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Error Handling

All services implement comprehensive error handling:

```typescript
try {
  const savedSearch = await savedSearchService.createSavedSearch(userId, data);
} catch (error) {
  if (error.message === 'Saved search limit reached for your tier') {
    // Handle tier limit error
  } else {
    // Handle other errors
  }
}
```

## Testing

Run tests for saved searches:

```bash
npm run test:saved-searches
```

Or with Playwright:

```bash
npx playwright test tests/saved-searches.spec.ts
```

## Performance

- **Database queries**: < 50ms
- **Alert processing**: ~1-2 seconds per alert
- **Email delivery**: ~500ms per email
- **Scheduler cycle**: < 5 minutes for 1000 alerts

## Security

- Row Level Security (RLS) enforced on all tables
- Users can only access their own saved searches
- Tier limits enforced at database level
- Email addresses validated before sending
- Service role key used securely

## Monitoring

Monitor the system with these queries:

```sql
-- Active alerts
SELECT COUNT(*) FROM saved_searches WHERE alert_enabled = TRUE;

-- Pending alerts
SELECT COUNT(*) FROM alert_queue WHERE status = 'pending';

-- Failed alerts (last 24h)
SELECT * FROM alert_queue 
WHERE status = 'failed' 
AND last_attempt_at > NOW() - INTERVAL '24 hours';

-- Email delivery rate
SELECT 
  COUNT(*) FILTER (WHERE email_sent) * 100.0 / COUNT(*) as success_rate
FROM search_alerts
WHERE alert_sent_at > NOW() - INTERVAL '7 days';
```

## Troubleshooting

### Alerts not sending
1. Check scheduler is running: `railway logs`
2. Check alert queue: `SELECT * FROM alert_queue WHERE status = 'failed'`
3. Verify environment variables

### Email delivery issues
1. Check Resend API key is valid
2. Verify domain is verified in Resend
3. Check email logs: `SELECT * FROM email_notifications WHERE status = 'failed'`

### Performance issues
1. Check database indexes
2. Monitor alert processing time
3. Consider increasing Railway resources

## Support

For issues or questions:
- Review deployment guide: `SAVED_SEARCHES_DEPLOYMENT_GUIDE.md`
- Check quick reference: `SAVED_SEARCHES_QUICK_REFERENCE.md`
- Contact: support@nabla.ai
