# Saved Searches - Quick Reference

## User Guide

### Creating a Saved Search

1. Navigate to **Dashboard > Saved Searches**
2. Click **"Create Saved Search"**
3. Fill in:
   - **Name**: Descriptive name for your search
   - **Query**: Your search terms
   - **Enable Alerts**: Toggle to receive notifications
   - **Alert Frequency**: Choose daily, weekly, or monthly
4. Click **"Create"**

### Executing a Saved Search

- Click the **▶️ Play** button next to any saved search
- Results open in the search page

### Managing Alerts

- **🔔 Bell Icon**: Toggle alerts on/off
- **⏰ Clock Icon**: Configure alert settings
- View alert history in settings dialog

### Editing/Deleting

- **✏️ Edit Icon**: Modify search details
- **🗑️ Trash Icon**: Delete saved search (requires confirmation)

## Tier Limits

| Tier       | Saved Searches | Alerts |
|------------|----------------|--------|
| Free       | 0              | ❌     |
| Pro        | 20             | ✅     |
| Enterprise | Unlimited      | ✅     |

## Alert Frequencies

- **Daily**: Receive alerts every day at 9 AM
- **Weekly**: Receive alerts every Monday at 9 AM
- **Monthly**: Receive alerts on the 1st of each month at 9 AM

## API Endpoints

### List Saved Searches
```http
GET /api/saved-searches
Authorization: Bearer {token}
```

### Create Saved Search
```http
POST /api/saved-searches
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "GDPR Updates",
  "query": "GDPR compliance",
  "alert_enabled": true,
  "alert_frequency": "weekly"
}
```

### Update Saved Search
```http
PATCH /api/saved-searches/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Updated Name",
  "alert_enabled": false
}
```

### Delete Saved Search
```http
DELETE /api/saved-searches/{id}
Authorization: Bearer {token}
```

### Execute Saved Search
```http
POST /api/saved-searches/{id}/execute
Authorization: Bearer {token}
```

### Get Alert History
```http
GET /api/saved-searches/{id}/alerts?limit=10
Authorization: Bearer {token}
```

## Database Schema

### saved_searches
```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES auth.users
name                TEXT NOT NULL
query               TEXT NOT NULL
filters             JSONB
alert_enabled       BOOLEAN DEFAULT FALSE
alert_frequency     TEXT (daily|weekly|monthly)
last_alert_sent_at  TIMESTAMP
last_result_count   INTEGER
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### search_alerts
```sql
id                    UUID PRIMARY KEY
saved_search_id       UUID REFERENCES saved_searches
user_id               UUID REFERENCES auth.users
new_documents_count   INTEGER
alert_sent_at         TIMESTAMP
email_sent            BOOLEAN
email_error           TEXT
document_ids          UUID[]
metadata              JSONB
```

### alert_queue
```sql
id                UUID PRIMARY KEY
saved_search_id   UUID REFERENCES saved_searches
user_id           UUID REFERENCES auth.users
scheduled_for     TIMESTAMP
status            TEXT (pending|processing|completed|failed)
attempts          INTEGER
last_attempt_at   TIMESTAMP
error_message     TEXT
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

## Common Tasks

### Check Saved Search Limit
```typescript
const canCreate = await savedSearchService.checkSavedSearchLimit(userId);
const limit = await savedSearchService.getSavedSearchLimit(userId);
const count = await savedSearchService.getSavedSearchesCount(userId);
```

### Toggle Alerts
```typescript
await savedSearchService.toggleAlert(userId, searchId, true);
```

### Update Alert Frequency
```typescript
await savedSearchService.updateAlertFrequency(userId, searchId, 'daily');
```

### Get Alert History
```typescript
const alerts = await savedSearchService.getSearchAlerts(userId, searchId, 10);
```

## Email Template Variables

Available in alert emails:

- `{{userName}}`: User's full name
- `{{searchName}}`: Saved search name
- `{{searchQuery}}`: Search query
- `{{documentCount}}`: Number of new documents
- `{{documents}}`: Array of new documents
- `{{viewUrl}}`: URL to view all results
- `{{manageUrl}}`: URL to manage saved searches

## Troubleshooting

### Alerts Not Received

1. Check alert is enabled: Dashboard > Saved Searches
2. Verify email address in profile
3. Check spam folder
4. Contact support if issue persists

### Saved Search Limit Reached

- **Pro**: Upgrade to Enterprise for unlimited
- **Free**: Upgrade to Pro for 20 saved searches

### Search Not Executing

1. Check search query is valid
2. Verify you have search quota remaining
3. Try refreshing the page

## Environment Variables

```env
# Required for saved searches
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Required for alerts
RESEND_API_KEY=
EMAIL_FROM=alerts@kb.nabla.ai
NEXT_PUBLIC_APP_URL=https://kb.nabla.ai
```

## Monitoring Queries

### Active Alerts
```sql
SELECT COUNT(*) FROM saved_searches WHERE alert_enabled = TRUE;
```

### Pending Alert Queue
```sql
SELECT COUNT(*) FROM alert_queue WHERE status = 'pending';
```

### Failed Alerts (Last 24h)
```sql
SELECT * FROM alert_queue 
WHERE status = 'failed' 
AND last_attempt_at > NOW() - INTERVAL '24 hours';
```

### Email Delivery Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE email_sent) * 100.0 / COUNT(*) as success_rate
FROM search_alerts
WHERE alert_sent_at > NOW() - INTERVAL '7 days';
```

## Support

- **Documentation**: `/docs/saved-searches`
- **Email**: support@nabla.ai
- **Status**: status.nabla.ai
