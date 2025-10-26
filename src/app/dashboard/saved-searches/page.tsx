import { SavedSearchesList } from '@/components/saved-searches/SavedSearchesList';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SavedSearchesPage() {
  return (
    <div className="container mx-auto py-8">
      <SavedSearchesList />
    </div>
  );
}
