'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, FileSpreadsheet, FileJson, FileCode } from 'lucide-react';
import { exportService } from '@/lib/export/export-service';
import type { ExportJobType, ExportOptions } from '@/lib/export/types';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentIds: string[];
  documentTitles?: string[];
  userTier: 'free' | 'pro' | 'enterprise';
}

export function ExportDialog({
  open,
  onOpenChange,
  documentIds,
  documentTitles = [],
  userTier,
}: ExportDialogProps) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json' | 'markdown'>('pdf');
  const [includeAnnotations, setIncludeAnnotations] = useState(false);
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBatch = documentIds.length > 1;
  const canExport = userTier !== 'free';
  const canWatermark = userTier === 'enterprise';
  const maxBatchSize = userTier === 'pro' ? 10 : Infinity;

  const handleExport = async () => {
    if (!canExport) {
      setError('Export is not available in Free tier. Please upgrade to Pro or Enterprise.');
      return;
    }

    if (isBatch && documentIds.length > maxBatchSize) {
      setError(`Pro tier allows batch export of up to ${maxBatchSize} documents. Upgrade to Enterprise for unlimited.`);
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const jobType: ExportJobType = isBatch
        ? format === 'pdf'
          ? 'batch_pdf'
          : format === 'csv'
          ? 'csv'
          : format === 'json'
          ? 'json'
          : 'markdown'
        : 'single_pdf';

      const options: ExportOptions = {
        includeAnnotations,
        includeWatermark: canWatermark && includeWatermark,
        watermarkText: canWatermark && includeWatermark ? watermarkText : undefined,
        format,
      };

      const { data: job, error: exportError } = await exportService.createExportJob(
        documentIds,
        jobType,
        options
      );

      if (exportError) {
        setError(exportError);
        return;
      }

      // Poll for job completion
      if (job) {
        await pollJobStatus(job.id);
      }

    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60; // 1 minute max
    let attempts = 0;

    const poll = async () => {
      attempts++;

      const { data: job } = await exportService.getExportJob(jobId);

      if (!job) {
        setError('Job not found');
        return;
      }

      if (job.status === 'completed') {
        // Download the file
        await exportService.downloadExport(jobId);
        onOpenChange(false);
        return;
      }

      if (job.status === 'failed') {
        setError(job.error_message || 'Export failed');
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 1000);
      } else {
        setError('Export timeout. Please check your export history.');
      }
    };

    poll();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Documents</DialogTitle>
          <DialogDescription>
            {isBatch
              ? `Export ${documentIds.length} documents`
              : 'Export document'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!canExport && (
            <Alert>
              <AlertDescription>
                Export is not available in Free tier. Please upgrade to Pro or Enterprise to export documents.
              </AlertDescription>
            </Alert>
          )}

          {canExport && isBatch && documentIds.length > maxBatchSize && (
            <Alert variant="destructive">
              <AlertDescription>
                Pro tier allows batch export of up to {maxBatchSize} documents. You have selected {documentIds.length} documents.
                Please upgrade to Enterprise for unlimited batch export.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF
                </Label>
              </div>
              {isBatch && (
                <>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV (Metadata only)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                      <FileJson className="h-4 w-4" />
                      JSON
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="markdown" id="markdown" />
                    <Label htmlFor="markdown" className="flex items-center gap-2 cursor-pointer">
                      <FileCode className="h-4 w-4" />
                      Markdown
                    </Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="annotations"
                checked={includeAnnotations}
                onCheckedChange={(checked: boolean) => setIncludeAnnotations(checked)}
              />
              <Label htmlFor="annotations" className="cursor-pointer">
                Include annotations (highlights and notes)
              </Label>
            </div>

            {canWatermark && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="watermark"
                    checked={includeWatermark}
                    onCheckedChange={(checked: boolean) => setIncludeWatermark(checked)}
                  />
                  <Label htmlFor="watermark" className="cursor-pointer">
                    Add watermark (Enterprise only)
                  </Label>
                </div>

                {includeWatermark && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="watermark-text">Watermark Text</Label>
                    <Input
                      id="watermark-text"
                      placeholder="e.g., CONFIDENTIAL"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Document List Preview */}
          {isBatch && documentTitles.length > 0 && (
            <div className="space-y-2">
              <Label>Documents to Export ({documentIds.length})</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 text-sm">
                {documentTitles.slice(0, 5).map((title, index) => (
                  <div key={index} className="py-1">
                    {index + 1}. {title}
                  </div>
                ))}
                {documentTitles.length > 5 && (
                  <div className="py-1 text-muted-foreground">
                    ... and {documentTitles.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!canExport || isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
