// Document service for fetching and managing documents

import { createClient } from '@/lib/supabase/client';
import { DocumentMetadata, DocumentView, DocumentBookmark } from './types';

export class DocumentService {
  private supabase = createClient();

  async getDocument(documentId: string): Promise<DocumentMetadata | null> {
    const { data, error } = await this.supabase
      .from('document_metadata')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }

    return data;
  }

  async getDocumentContent(storagePath: string): Promise<Blob | null> {
    const { data, error } = await this.supabase
      .storage
      .from('documents')
      .download(storagePath);

    if (error) {
      console.error('Error downloading document:', error);
      return null;
    }

    return data;
  }

  async trackView(documentId: string, viewData: Partial<DocumentView>): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) return;

    const { error } = await this.supabase
      .from('document_views')
      .insert({
        document_id: documentId,
        user_id: user.id,
        ...viewData
      });

    if (error) {
      console.error('Error tracking view:', error);
    }
  }

  async getBookmarks(documentId: string): Promise<DocumentBookmark[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('document_bookmarks')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('page_number', { ascending: true });

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }

    return data || [];
  }

  async addBookmark(documentId: string, pageNumber: number, note?: string): Promise<DocumentBookmark | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('document_bookmarks')
      .insert({
        document_id: documentId,
        user_id: user.id,
        page_number: pageNumber,
        note
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding bookmark:', error);
      return null;
    }

    return data;
  }

  async removeBookmark(bookmarkId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('document_bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }

    return true;
  }

  async searchDocuments(query: string, filters?: {
    domain?: string;
    contentType?: string;
  }): Promise<DocumentMetadata[]> {
    let queryBuilder = this.supabase
      .from('document_metadata')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`);

    if (filters?.domain) {
      queryBuilder = queryBuilder.eq('domain', filters.domain);
    }

    if (filters?.contentType) {
      queryBuilder = queryBuilder.eq('content_type', filters.contentType);
    }

    const { data, error } = await queryBuilder.limit(50);

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    return data || [];
  }
}

export const documentService = new DocumentService();
