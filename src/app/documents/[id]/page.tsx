import { DocumentViewer } from '@/components/documents/DocumentViewer';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface DocumentPageProps {
  params: {
    id: string;
  };
}

export default function DocumentPage({ params }: DocumentPageProps) {
  return <DocumentViewer documentId={params.id} />;
}

export const metadata = {
  title: 'Document Viewer - NABLA KB Portal',
  description: 'View and search regulatory documents'
};
