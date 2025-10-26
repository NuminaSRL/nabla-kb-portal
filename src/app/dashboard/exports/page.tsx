import { ExportHistory } from '@/components/export/ExportHistory';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ExportsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Exports</h1>
        <p className="text-muted-foreground mt-2">
          Manage and download your document exports
        </p>
      </div>

      <ExportHistory />
    </div>
  );
}
