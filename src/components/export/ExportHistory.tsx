'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Loader2, FileText, Trash2, RefreshCw } from 'lucide-react';
import { exportService } from '@/lib/export/export-service';
import type { ExportJob } from '@/lib/export/types';
import { formatDistanceToNow } from 'date-fns';

export function ExportHistory() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingJobId, setDownloadingJobId] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    const { data, error } = await exportService.getUserExportJobs(20);
    if (!error && data) {
      setJobs(data);
    }
    setIsLoading(false);
  };

  const handleDownload = async (jobId: string) => {
    setDownloadingJobId(jobId);
    try {
      await exportService.downloadExport(jobId);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadingJobId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getJobTypeLabel = (jobType: string) => {
    switch (jobType) {
      case 'single_pdf':
        return 'Single PDF';
      case 'batch_pdf':
        return 'Batch PDF';
      case 'csv':
        return 'CSV';
      case 'json':
        return 'JSON';
      case 'markdown':
        return 'Markdown';
      default:
        return jobType;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Export History</CardTitle>
            <CardDescription>View and download your recent exports</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadJobs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No exports yet</p>
            <p className="text-sm">Your export history will appear here</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {getJobTypeLabel(job.job_type)}
                    </TableCell>
                    <TableCell>{job.document_ids.length}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>{formatFileSize(job.file_size)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      {job.status === 'completed' && job.output_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(job.id)}
                          disabled={downloadingJobId === job.id}
                        >
                          {downloadingJobId === job.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {job.status === 'failed' && (
                        <span className="text-sm text-destructive">
                          {job.error_message || 'Failed'}
                        </span>
                      )}
                      {job.status === 'processing' && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
