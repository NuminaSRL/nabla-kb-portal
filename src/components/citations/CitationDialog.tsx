'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, Check } from 'lucide-react';
import { citationService, type DocumentMetadata, type Citation, type CitationStyle } from '@/lib/citations/citation-service';
import { useToast } from '@/components/ui/use-toast';

interface CitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentMetadata;
}

export function CitationDialog({ open, onOpenChange, document: doc }: CitationDialogProps) {
  const { toast } = useToast();
  const [copiedStyle, setCopiedStyle] = useState<CitationStyle | null>(null);
  const [activeTab, setActiveTab] = useState<CitationStyle>('apa');

  // Generate all citations
  const citations = citationService.generateAllCitations(doc);
  const citationMap = citations.reduce((acc, c) => {
    acc[c.style] = c;
    return acc;
  }, {} as Record<CitationStyle, Citation>);

  const handleCopy = async (citation: Citation) => {
    try {
      await citationService.copyCitation(citation, 'text');
      setCopiedStyle(citation.style);
      toast({
        title: 'Citation copied',
        description: `${citation.style.toUpperCase()} citation copied to clipboard`,
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedStyle(null), 2000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy citation to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    try {
      citationService.exportCitations(citations, `citations-${doc.id}.txt`);
      toast({
        title: 'Citations exported',
        description: 'All citation formats have been exported',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export citations',
        variant: 'destructive',
      });
    }
  };

  const handleExportBibTeX = () => {
    try {
      const bibtex = citationService.exportBibTeX(doc);
      const blob = new Blob([bibtex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `citation-${doc.id}.bib`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'BibTeX exported',
        description: 'Citation exported in BibTeX format',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export BibTeX',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cite This Document</DialogTitle>
          <DialogDescription>
            Generate citations in multiple formats for: {document.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CitationStyle)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="apa">APA</TabsTrigger>
              <TabsTrigger value="mla">MLA</TabsTrigger>
              <TabsTrigger value="chicago">Chicago</TabsTrigger>
              <TabsTrigger value="bluebook">Bluebook</TabsTrigger>
            </TabsList>

            <TabsContent value="apa" className="space-y-4">
              <CitationCard
                citation={citationMap.apa}
                onCopy={handleCopy}
                isCopied={copiedStyle === 'apa'}
              />
            </TabsContent>

            <TabsContent value="mla" className="space-y-4">
              <CitationCard
                citation={citationMap.mla}
                onCopy={handleCopy}
                isCopied={copiedStyle === 'mla'}
              />
            </TabsContent>

            <TabsContent value="chicago" className="space-y-4">
              <CitationCard
                citation={citationMap.chicago}
                onCopy={handleCopy}
                isCopied={copiedStyle === 'chicago'}
              />
            </TabsContent>

            <TabsContent value="bluebook" className="space-y-4">
              <CitationCard
                citation={citationMap.bluebook}
                onCopy={handleCopy}
                isCopied={copiedStyle === 'bluebook'}
              />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleExport} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export All Formats
            </Button>
            <Button onClick={handleExportBibTeX} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export BibTeX
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CitationCardProps {
  citation: Citation;
  onCopy: (citation: Citation) => void;
  isCopied: boolean;
}

function CitationCard({ citation, onCopy, isCopied }: CitationCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {citation.style.toUpperCase()} Format
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onCopy(citation)}
          className="h-8"
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <div
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: citation.html }}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        <strong>Plain text:</strong>
        <pre className="mt-1 p-2 bg-muted/50 rounded text-xs overflow-x-auto whitespace-pre-wrap">
          {citation.text}
        </pre>
      </div>
    </div>
  );
}
