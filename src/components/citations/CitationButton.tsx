'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Quote } from 'lucide-react';
import { CitationDialog } from './CitationDialog';
import type { DocumentMetadata } from '@/lib/citations/citation-service';

interface CitationButtonProps {
  document: DocumentMetadata;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CitationButton({ 
  document, 
  variant = 'outline', 
  size = 'default',
  className 
}: CitationButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Quote className="w-4 h-4 mr-2" />
        Cite
      </Button>

      <CitationDialog
        open={open}
        onOpenChange={setOpen}
        document={document}
      />
    </>
  );
}
