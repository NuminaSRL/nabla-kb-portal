# Document Viewer Installation Guide

## Quick Start

Follow these steps to install and configure the document viewer in the NABLA KB Portal.

## Prerequisites

- Node.js 18+ installed
- Supabase project configured
- Vercel account (for deployment)
- Access to kb-portal repository

## Installation Steps

### 1. Install Dependencies

```bash
cd kb-portal
npm install
```

This will install the new dependencies:
- `react-pdf@9.1.0`
- `pdfjs-dist@4.4.168`
- `react-markdown@9.0.1`
- `remark-gfm@4.0.0`
- `rehype-highlight@7.0.0`

### 2. Apply Database Migration

Apply the migration to your Supabase database:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Using Supabase Dashboard
# 1. Go to your Supabase project dashboard
# 2. Navigate to SQL Editor
# 3. Copy contents of database/migrations/006_document_viewer.sql
# 4. Execute the SQL
```

Verify the migration:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('document_metadata', 'document_views', 'document_bookmarks');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('document_metadata', 'document_views', 'document_bookmarks');
```

### 3. Configure Supabase Storage

Create the documents storage bucket:

```bash
# Using Supabase CLI
supabase storage create documents --public false

# Or via Dashboard:
# 1. Go to Storage in Supabase Dashboard
# 2. Click "Create bucket"
# 3. Name: "documents"
# 4. Public: No
# 5. Create
```

Set storage policies:

```sql
-- Allow authenticated users to read documents
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Allow service role to manage documents
CREATE POLICY "Service role can manage documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'documents');
```

### 4. Environment Variables

Ensure these environment variables are set in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: For development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Build and Test

Build the application:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

Start development server:

```bash
npm run dev
```

Visit http://localhost:3000 to verify the installation.

## Uploading Test Documents

### Option 1: Using Supabase Dashboard

1. Go to Storage > documents bucket
2. Upload test files (PDF, HTML, or Markdown)
3. Note the file paths

### Option 2: Using Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Upload document
const { data, error } = await supabase.storage
  .from('documents')
  .upload('gdpr/regulation.pdf', file);

// Create metadata
await supabase.from('document_metadata').insert({
  document_id: 'gdpr-regulation-2016',
  title: 'GDPR Regulation (EU) 2016/679',
  content_type: 'pdf',
  file_size: file.size,
  page_count: 88,
  domain: 'gdpr',
  storage_path: 'gdpr/regulation.pdf',
  table_of_contents: [
    { id: '1', title: 'Chapter I - General Provisions', page: 1, level: 1 },
    { id: '2', title: 'Chapter II - Principles', page: 5, level: 1 },
    // ... more TOC items
  ]
});
```

### Option 3: Using Bulk Import Script

Create a script to import multiple documents:

```typescript
// scripts/import-documents.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function importDocuments(directory: string) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer]);
    
    // Upload to storage
    const storagePath = `imported/${file}`;
    await supabase.storage
      .from('documents')
      .upload(storagePath, fileBlob);
    
    // Create metadata
    await supabase.from('document_metadata').insert({
      document_id: file.replace(/\.[^/.]+$/, ''),
      title: file,
      content_type: path.extname(file).slice(1),
      file_size: fileBuffer.length,
      storage_path: storagePath,
      domain: 'general'
    });
  }
}

importDocuments('./documents-to-import');
```

## Verification

### 1. Check Database

```sql
-- Verify tables
SELECT COUNT(*) FROM document_metadata;
SELECT COUNT(*) FROM document_views;
SELECT COUNT(*) FROM document_bookmarks;

-- Check sample document
SELECT * FROM document_metadata LIMIT 1;
```

### 2. Check Storage

```bash
# Using Supabase CLI
supabase storage list documents

# Should show uploaded files
```

### 3. Test Document Viewer

1. Navigate to `/documents/[document-id]`
2. Verify document loads
3. Test all controls:
   - Page navigation
   - Zoom in/out
   - Search
   - Table of contents
   - Metadata panel
   - Bookmarks
   - Download

### 4. Run Automated Tests

```bash
# Run all tests
npm run test

# Run specific test
npx playwright test tests/document-viewer.spec.ts

# Run in headed mode
npm run test:headed
```

## Troubleshooting

### PDF Not Loading

**Problem**: PDF documents don't render

**Solutions**:
1. Check PDF.js worker is loading:
   ```javascript
   console.log(pdfjs.GlobalWorkerOptions.workerSrc);
   ```
2. Verify storage path is correct
3. Check browser console for errors
4. Ensure file is valid PDF

### Search Not Working

**Problem**: Search doesn't find text

**Solutions**:
1. Verify PDF has text layer (not scanned image)
2. Check search query is not empty
3. Ensure document is fully loaded
4. Check browser console for errors

### Storage Access Denied

**Problem**: Can't download documents

**Solutions**:
1. Check storage policies are set correctly
2. Verify user is authenticated
3. Check RLS policies on document_metadata
4. Verify storage bucket exists

### Build Errors

**Problem**: Build fails with dependency errors

**Solutions**:
1. Delete node_modules and package-lock.json
2. Run `npm install` again
3. Check Node.js version (18+ required)
4. Clear Next.js cache: `rm -rf .next`

### Performance Issues

**Problem**: Slow document loading

**Solutions**:
1. Optimize PDF file size
2. Enable CDN for storage bucket
3. Implement pagination for large documents
4. Check network connection
5. Use production build (not dev mode)

## Production Deployment

### Vercel Deployment

```bash
# Build
npm run build

# Deploy
vercel deploy --prod

# Or use Vercel GitHub integration
git push origin main
```

### Environment Variables in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Post-Deployment Checks

1. Verify document viewer loads
2. Test authentication
3. Check storage access
4. Monitor error logs
5. Test on different browsers

## Monitoring

### Set Up Monitoring

1. **Vercel Analytics**: Enable in Vercel Dashboard
2. **Supabase Logs**: Monitor in Supabase Dashboard
3. **Error Tracking**: Consider Sentry integration

### Key Metrics to Monitor

- Document load times
- Search performance
- Error rates
- User engagement (views, searches, bookmarks)
- Storage usage

## Support

For issues or questions:

1. Check documentation: `DOCUMENT_VIEWER_GUIDE.md`
2. Review completion report: `TASK_041_COMPLETION_REPORT.md`
3. Check verification checklist: `TASK_041_VERIFICATION_CHECKLIST.md`
4. Review test results: `npm run test`

## Next Steps

After successful installation:

1. Import regulatory documents
2. Configure table of contents for documents
3. Set up document categorization (domains)
4. Train users on document viewer features
5. Monitor usage and gather feedback
6. Plan enhancements based on user needs

---

**Installation Complete!** 🎉

The document viewer is now ready to use. Navigate to `/documents/[id]` to view any document.
