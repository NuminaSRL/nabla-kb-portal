// Export system types

export type ExportJobType = 'single_pdf' | 'batch_pdf' | 'csv' | 'json' | 'markdown';
export type ExportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ExportJob {
  id: string;
  user_id: string;
  job_type: ExportJobType;
  status: ExportJobStatus;
  document_ids: string[];
  include_annotations: boolean;
  include_watermark: boolean;
  watermark_text?: string;
  output_url?: string;
  file_size?: number;
  error_message?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExportOptions {
  includeAnnotations?: boolean;
  includeWatermark?: boolean;
  watermarkText?: string;
  format?: 'pdf' | 'csv' | 'json' | 'markdown';
}

export interface ExportStats {
  id: string;
  user_id: string;
  export_type: string;
  document_count: number;
  file_size?: number;
  processing_time_ms?: number;
  created_at: string;
}

export interface PDFExportData {
  documentId: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  annotations?: {
    highlights: Array<{
      page: number;
      text: string;
      color: string;
      note?: string;
    }>;
    notes: Array<{
      page: number;
      content: string;
    }>;
  };
}

export interface CSVExportRow {
  document_id: string;
  title: string;
  domain: string;
  document_type: string;
  source: string;
  published_date: string;
  relevance_score: number;
  url: string;
  summary: string;
}

export interface BatchExportRequest {
  documentIds: string[];
  format: 'pdf' | 'csv' | 'json';
  options: ExportOptions;
}

export interface ExportProgress {
  jobId: string;
  status: ExportJobStatus;
  progress: number; // 0-100
  currentDocument?: string;
  totalDocuments: number;
  processedDocuments: number;
}
