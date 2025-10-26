// Annotation service for highlights, notes, and sharing
import { createClient } from '@/lib/supabase/client';
import type {
  DocumentHighlight,
  DocumentNote,
  AnnotationShare,
  HighlightColor,
  HighlightPosition,
  NotePosition,
  AnnotationType,
  SharePermission,
  AnnotationExport,
} from './types';

export class AnnotationService {
  private supabase = createClient();

  // ============ Highlights ============

  /**
   * Create a new highlight
   */
  async createHighlight(
    documentId: string,
    selectionText: string,
    color: HighlightColor,
    position: HighlightPosition,
    pageNumber?: number
  ): Promise<{ data: DocumentHighlight | null; error: string | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('document_highlights')
        .insert({
          document_id: documentId,
          user_id: user.id,
          selection_text: selectionText,
          color,
          position,
          page_number: pageNumber,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Get highlights for a document
   */
  async getHighlights(
    documentId: string,
    pageNumber?: number
  ): Promise<{ data: DocumentHighlight[]; error: string | null }> {
    try {
      let query = this.supabase
        .from('document_highlights')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (pageNumber !== undefined) {
        query = query.eq('page_number', pageNumber);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  }

  /**
   * Update highlight color
   */
  async updateHighlightColor(
    highlightId: string,
    color: HighlightColor
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('document_highlights')
        .update({ color })
        .eq('id', highlightId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete a highlight
   */
  async deleteHighlight(highlightId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('document_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ============ Notes ============

  /**
   * Create a new note
   */
  async createNote(
    documentId: string,
    content: string,
    options?: {
      highlightId?: string;
      pageNumber?: number;
      position?: NotePosition;
    }
  ): Promise<{ data: DocumentNote | null; error: string | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('document_notes')
        .insert({
          document_id: documentId,
          user_id: user.id,
          content,
          highlight_id: options?.highlightId,
          page_number: options?.pageNumber,
          position: options?.position,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Get notes for a document
   */
  async getNotes(
    documentId: string,
    pageNumber?: number
  ): Promise<{ data: DocumentNote[]; error: string | null }> {
    try {
      let query = this.supabase
        .from('document_notes')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (pageNumber !== undefined) {
        query = query.eq('page_number', pageNumber);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  }

  /**
   * Update note content
   */
  async updateNote(
    noteId: string,
    content: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('document_notes')
        .update({ content })
        .eq('id', noteId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('document_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ============ Sharing (Enterprise only) ============

  /**
   * Share an annotation with another user
   */
  async shareAnnotation(
    annotationId: string,
    annotationType: AnnotationType,
    shareWith: { userId?: string; email?: string },
    permission: SharePermission = 'view'
  ): Promise<{ data: AnnotationShare | null; error: string | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Check if user is Enterprise tier
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('tier')
        .eq('id', user.id)
        .single();

      if (!profile || profile.tier !== 'enterprise') {
        return { data: null, error: 'Sharing is only available for Enterprise users' };
      }

      const { data, error } = await this.supabase
        .from('annotation_shares')
        .insert({
          annotation_id: annotationId,
          annotation_type: annotationType,
          owner_id: user.id,
          shared_with_user_id: shareWith.userId,
          shared_with_email: shareWith.email,
          permission,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Get shares for an annotation
   */
  async getAnnotationShares(
    annotationId: string
  ): Promise<{ data: AnnotationShare[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('annotation_shares')
        .select('*')
        .eq('annotation_id', annotationId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  }

  /**
   * Remove a share
   */
  async removeShare(shareId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('annotation_shares')
        .delete()
        .eq('id', shareId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ============ Export ============

  /**
   * Export all annotations for a document
   */
  async exportAnnotations(
    documentId: string,
    documentTitle: string
  ): Promise<{ data: AnnotationExport | null; error: string | null }> {
    try {
      // Get all highlights
      const { data: highlights, error: highlightsError } = await this.getHighlights(documentId);
      if (highlightsError) {
        return { data: null, error: highlightsError };
      }

      // Get all notes
      const { data: notes, error: notesError } = await this.getNotes(documentId);
      if (notesError) {
        return { data: null, error: notesError };
      }

      // Build export data
      const exportData: AnnotationExport = {
        document_title: documentTitle,
        document_id: documentId,
        export_date: new Date().toISOString(),
        highlights: highlights.map(h => {
          // Find associated note
          const note = notes.find(n => n.highlight_id === h.id);
          return {
            page: h.page_number || 0,
            text: h.selection_text,
            color: h.color,
            note: note?.content,
          };
        }),
        notes: notes
          .filter(n => !n.highlight_id) // Only standalone notes
          .map(n => ({
            page: n.page_number || 0,
            content: n.content,
          })),
      };

      return { data: exportData, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Export annotations as JSON
   */
  async exportAsJSON(documentId: string, documentTitle: string): Promise<string | null> {
    const { data, error } = await this.exportAnnotations(documentId, documentTitle);
    if (error || !data) return null;
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export annotations as Markdown
   */
  async exportAsMarkdown(documentId: string, documentTitle: string): Promise<string | null> {
    const { data, error } = await this.exportAnnotations(documentId, documentTitle);
    if (error || !data) return null;

    let markdown = `# Annotations for ${data.document_title}\n\n`;
    markdown += `Exported: ${new Date(data.export_date).toLocaleString()}\n\n`;

    if (data.highlights.length > 0) {
      markdown += `## Highlights\n\n`;
      data.highlights.forEach((h, i) => {
        markdown += `### ${i + 1}. Page ${h.page} (${h.color})\n\n`;
        markdown += `> ${h.text}\n\n`;
        if (h.note) {
          markdown += `**Note:** ${h.note}\n\n`;
        }
      });
    }

    if (data.notes.length > 0) {
      markdown += `## Notes\n\n`;
      data.notes.forEach((n, i) => {
        markdown += `### ${i + 1}. Page ${n.page}\n\n`;
        markdown += `${n.content}\n\n`;
      });
    }

    return markdown;
  }

  /**
   * Download export file
   */
  downloadExport(content: string, filename: string, format: 'json' | 'md') {
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const annotationService = new AnnotationService();

