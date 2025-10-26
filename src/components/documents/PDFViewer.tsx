'use client';

import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { SearchResult } from '@/lib/documents/types';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: string | Blob;
  currentPage: number;
  zoom: number;
  searchQuery?: string;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  onSearchResults?: (results: SearchResult[]) => void;
}

export function PDFViewer({
  file,
  currentPage,
  zoom,
  searchQuery,
  onPageChange,
  onTotalPagesChange,
  onSearchResults
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(800);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('pdf-container');
      if (container) {
        setPageWidth(container.clientWidth - 40);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onTotalPagesChange(numPages);
  }, [onTotalPagesChange]);

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
  };

  // Search functionality
  useEffect(() => {
    if (!searchQuery || !file) return;

    const performSearch = async () => {
      try {
        const loadingTask = pdfjs.getDocument(
          typeof file === 'string' ? file : URL.createObjectURL(file)
        );
        const pdf = await loadingTask.promise;
        const results: SearchResult[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const text = textContent.items
            .map((item: any) => item.str)
            .join(' ');

          const lowerText = text.toLowerCase();
          const lowerQuery = searchQuery.toLowerCase();
          let index = lowerText.indexOf(lowerQuery);

          while (index !== -1) {
            results.push({
              page: i,
              text: text.substring(Math.max(0, index - 50), index + searchQuery.length + 50),
              position: { x: 0, y: 0 }
            });
            index = lowerText.indexOf(lowerQuery, index + 1);
          }
        }

        onSearchResults?.(results);
      } catch (error) {
        console.error('Error searching PDF:', error);
      }
    };

    performSearch();
  }, [searchQuery, file, onSearchResults]);

  return (
    <div id="pdf-container" className="flex flex-col items-center w-full h-full overflow-auto bg-gray-100 dark:bg-gray-900">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-full text-red-600">
            <p>Failed to load PDF document</p>
          </div>
        }
      >
        <Page
          pageNumber={currentPage}
          scale={zoom}
          width={pageWidth}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          loading={
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }
        />
      </Document>
    </div>
  );
}
