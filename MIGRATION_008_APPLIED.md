# ✅ Migration 008 - Export System Applied

## Migration Status: COMPLETE

**Date**: January 16, 2025  
**Migration**: 008_export_system.sql  
**Project**: nabla-mcp-ultimate (qrczmdhhrzyxwbnpixta)  
**Applied via**: MCP Supabase

---

## Tables Created

### 1. export_jobs ✅
**Purpose**: Track export job status and configuration

**Columns**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `job_type` (VARCHAR) - single_pdf, batch_pdf, csv, json, markdown
- `status` (VARCHAR) - pending, processing, completed, failed
- `document_ids` (TEXT[])
- `include_annotations` (BOOLEAN)
- `include_watermark` (BOOLEAN)
- `watermark_text` (TEXT)
- `output_url` (TEXT)
- `file_size` (BIGINT)
- `error_message` (TEXT)
- `processing_started_at` (TIMESTAMPTZ)
- `processing_completed_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes**:
- `idx_export_jobs_user_id` on user_id
- `idx_export_jobs_status` on status
- `idx_export_jobs_created_at` on created_at DESC

**RLS Policies**:
- `export_jobs_select_own` - Users can only see their own jobs
- `export_jobs_insert_own` - Users can only create their own jobs
- `export_jobs_update_own` - Users can only update their own jobs

### 2. export_stats ✅
**Purpose**: Track export statistics and analytics

**Columns**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `export_type` (VARCHAR)
- `document_count` (INTEGER)
- `file_size` (BIGINT)
- `processing_time_ms` (INTEGER)
- `created_at` (TIMESTAMPTZ)

**Indexes**:
- `idx_export_stats_user_id` on user_id
- `idx_export_stats_created_at` on created_at DESC

**RLS Policies**:
- `export_stats_select_own` - Users can only see their own stats
- `export_stats_insert_own` - Users can only insert their own stats

---

## Functions Created

### 1. update_export_job_status() ✅
**Purpose**: Automatically update job timestamps based on status changes

**Trigger**: `export_job_status_trigger`
- Fires BEFORE UPDATE on export_jobs
- Sets `processing_started_at` when status changes to 'processing'
- Sets `processing_completed_at` when status changes to 'completed' or 'failed'
- Always updates `updated_at` timestamp

### 2. cleanup_old_export_jobs() ✅
**Purpose**: Clean up old export jobs (older than 7 days)

**Usage**:
```sql
SELECT cleanup_old_export_jobs();
```

**Behavior**:
- Deletes jobs older than 7 days
- Only deletes completed or failed jobs
- Keeps pending and processing jobs

---

## Permissions Granted

```sql
GRANT SELECT, INSERT, UPDATE ON export_jobs TO authenticated;
GRANT SELECT, INSERT ON export_stats TO authenticated;
```

---

## Verification

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('export_jobs', 'export_stats');
```

**Result**: ✅ Both tables exist

### Check RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('export_jobs', 'export_stats');
```

**Result**: ✅ RLS enabled on both tables

### Check Indexes
```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('export_jobs', 'export_stats');
```

**Result**: ✅ All 5 indexes created

### Check Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('update_export_job_status', 'cleanup_old_export_jobs');
```

**Result**: ✅ Both functions created

### Check Triggers
```sql
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
  AND event_object_table = 'export_jobs';
```

**Result**: ✅ Trigger `export_job_status_trigger` created

---

## Test Queries

### Insert Test Export Job
```sql
INSERT INTO export_jobs (
  user_id,
  job_type,
  status,
  document_ids,
  include_annotations
) VALUES (
  auth.uid(),
  'single_pdf',
  'pending',
  ARRAY['doc-1', 'doc-2'],
  true
);
```

### Query User's Export Jobs
```sql
SELECT 
  id,
  job_type,
  status,
  array_length(document_ids, 1) as doc_count,
  created_at
FROM export_jobs
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Get Export Statistics
```sql
SELECT 
  export_type,
  COUNT(*) as total_exports,
  AVG(document_count) as avg_documents,
  AVG(file_size) as avg_file_size,
  AVG(processing_time_ms) as avg_processing_time
FROM export_stats
WHERE user_id = auth.uid()
GROUP BY export_type;
```

---

## Next Steps

1. ✅ Migration applied successfully
2. ⏭️ Create Supabase Storage bucket for exports
3. ⏭️ Update tier limits to enable export
4. ⏭️ Test export functionality
5. ⏭️ Deploy frontend with export features

---

## Storage Bucket Setup

Create the `exports` bucket in Supabase Storage:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', true);

-- RLS policies for exports bucket
CREATE POLICY "Users can upload their own exports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own exports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own exports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Tier Limits Update

Enable export for Pro and Enterprise tiers:

```sql
-- Check if tier_limits table exists
SELECT * FROM tier_limits WHERE tier IN ('pro', 'enterprise');

-- If exists, update
UPDATE tier_limits
SET export_enabled = true
WHERE tier IN ('pro', 'enterprise');

-- If not exists, you may need to add the column
ALTER TABLE tier_limits ADD COLUMN IF NOT EXISTS export_enabled BOOLEAN DEFAULT false;
```

---

## Monitoring Queries

### Active Export Jobs
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM export_jobs
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Failed Exports
```sql
SELECT 
  id,
  job_type,
  error_message,
  created_at
FROM export_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;
```

### Export Performance
```sql
SELECT 
  export_type,
  AVG(processing_time_ms) as avg_time_ms,
  MIN(processing_time_ms) as min_time_ms,
  MAX(processing_time_ms) as max_time_ms,
  COUNT(*) as total_exports
FROM export_stats
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY export_type
ORDER BY avg_time_ms DESC;
```

---

## Rollback (If Needed)

To rollback this migration:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS export_job_status_trigger ON export_jobs;

-- Drop functions
DROP FUNCTION IF EXISTS update_export_job_status();
DROP FUNCTION IF EXISTS cleanup_old_export_jobs();

-- Drop tables (will cascade to stats)
DROP TABLE IF EXISTS export_stats CASCADE;
DROP TABLE IF EXISTS export_jobs CASCADE;
```

---

## Summary

✅ **Migration Status**: COMPLETE  
✅ **Tables Created**: 2 (export_jobs, export_stats)  
✅ **Indexes Created**: 5  
✅ **Functions Created**: 2  
✅ **Triggers Created**: 1  
✅ **RLS Policies**: 5  
✅ **Permissions Granted**: authenticated role  

**The export system database schema is ready for production use!**

---

**Applied by**: MCP Supabase  
**Project**: nabla-mcp-ultimate  
**Date**: January 16, 2025  
**Status**: ✅ SUCCESS
