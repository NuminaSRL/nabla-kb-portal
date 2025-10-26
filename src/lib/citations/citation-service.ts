/**
 * Citation Service
 * Generates citations in multiple formats (APA, MLA, Chicago, Bluebook)
 */

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'bluebook';

export interface DocumentMetadata {
  id: string;
  title: string;
  authors?: string[];
  publicationDate?: string;
  publisher?: string;
  url?: string;
  doi?: string;
  documentType?: 'regulation' | 'guideline' | 'article' | 'book' | 'case' | 'statute';
  jurisdiction?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  edition?: string;
  accessDate?: string;
}

export interface Citation {
  style: CitationStyle;
  text: string;
  html: string;
  metadata: DocumentMetadata;
}

export class CitationService {
  /**
   * Generate citation in specified style
   */
  generateCitation(metadata: DocumentMetadata, style: CitationStyle): Citation {
    let text: string;
    let html: string;

    switch (style) {
      case 'apa':
        text = this.generateAPA(metadata);
        html = this.generateAPAHTML(metadata);
        break;
      case 'mla':
        text = this.generateMLA(metadata);
        html = this.generateMLAHTML(metadata);
        break;
      case 'chicago':
        text = this.generateChicago(metadata);
        html = this.generateChicagoHTML(metadata);
        break;
      case 'bluebook':
        text = this.generateBluebook(metadata);
        html = this.generateBluebookHTML(metadata);
        break;
      default:
        throw new Error(`Unsupported citation style: ${style}`);
    }

    return {
      style,
      text,
      html,
      metadata
    };
  }

  /**
   * Generate citations in all styles
   */
  generateAllCitations(metadata: DocumentMetadata): Citation[] {
    const styles: CitationStyle[] = ['apa', 'mla', 'chicago', 'bluebook'];
    return styles.map(style => this.generateCitation(metadata, style));
  }

  /**
   * APA 7th Edition Citation
   */
  private generateAPA(metadata: DocumentMetadata): string {
    const parts: string[] = [];

    // Authors
    if (metadata.authors && metadata.authors.length > 0) {
      const authorList = this.formatAPAAuthors(metadata.authors);
      parts.push(authorList);
    }

    // Publication date
    const year = this.extractYear(metadata.publicationDate);
    parts.push(`(${year || 'n.d.'})`);

    // Title (italicized in plain text with underscores)
    parts.push(`_${metadata.title}_`);

    // Publisher
    if (metadata.publisher) {
      parts.push(metadata.publisher);
    }

    // URL or DOI
    if (metadata.doi) {
      parts.push(`https://doi.org/${metadata.doi}`);
    } else if (metadata.url) {
      parts.push(metadata.url);
    }

    return parts.join('. ') + '.';
  }

  private generateAPAHTML(metadata: DocumentMetadata): string {
    const parts: string[] = [];

    // Authors
    if (metadata.authors && metadata.authors.length > 0) {
      const authorList = this.formatAPAAuthors(metadata.authors);
      parts.push(authorList);
    }

    // Publication date
    const year = this.extractYear(metadata.publicationDate);
    parts.push(`(${year || 'n.d.'})`);

    // Title (italicized)
    parts.push(`<em>${this.escapeHTML(metadata.title)}</em>`);

    // Publisher
    if (metadata.publisher) {
      parts.push(this.escapeHTML(metadata.publisher));
    }

    // URL or DOI
    if (metadata.doi) {
      parts.push(`<a href="https://doi.org/${metadata.doi}" target="_blank">https://doi.org/${metadata.doi}</a>`);
    } else if (metadata.url) {
      parts.push(`<a href="${metadata.url}" target="_blank">${this.escapeHTML(metadata.url)}</a>`);
    }

    return parts.join('. ') + '.';
  }

  private formatAPAAuthors(authors: string[]): string {
    if (authors.length === 1) {
      return this.formatAuthorLastFirst(authors[0]);
    } else if (authors.length === 2) {
      return `${this.formatAuthorLastFirst(authors[0])}, & ${this.formatAuthorLastFirst(authors[1])}`;
    } else if (authors.length <= 20) {
      const formatted = authors.slice(0, -1).map(a => this.formatAuthorLastFirst(a));
      return `${formatted.join(', ')}, & ${this.formatAuthorLastFirst(authors[authors.length - 1])}`;
    } else {
      // More than 20 authors: list first 19, then "...", then last author
      const formatted = authors.slice(0, 19).map(a => this.formatAuthorLastFirst(a));
      return `${formatted.join(', ')}, ... ${this.formatAuthorLastFirst(authors[authors.length - 1])}`;
    }
  }

  /**
   * MLA 9th Edition Citation
   */
  private generateMLA(metadata: DocumentMetadata): string {
    const parts: string[] = [];

    // Authors
    if (metadata.authors && metadata.authors.length > 0) {
      const authorList = this.formatMLAAuthors(metadata.authors);
      parts.push(authorList);
    }

    // Title (italicized)
    parts.push(`_${metadata.title}_`);

    // Publisher
    if (metadata.publisher) {
      parts.push(metadata.publisher);
    }

    // Publication date
    if (metadata.publicationDate) {
      parts.push(this.formatMLADate(metadata.publicationDate));
    }

    // URL (if available)
    if (metadata.url) {
      parts.push(metadata.url);
    }

    // Access date (if URL present)
    if (metadata.url && metadata.accessDate) {
      parts.push(`Accessed ${this.formatMLADate(metadata.accessDate)}`);
    }

    return parts.join(', ') + '.';
  }

  private generateMLAHTML(metadata: DocumentMetadata): string {
    const parts: string[] = [];

    // Authors
    if (metadata.authors && metadata.authors.length > 0) {
      const authorList = this.formatMLAAuthors(metadata.authors);
      parts.push(this.escapeHTML(authorList));
    }

    // Title (italicized)
    parts.push(`<em>${this.escapeHTML(metadata.title)}</em>`);

    // Publisher
    if (metadata.publisher) {
      parts.push(this.escapeHTML(metadata.publisher));
    }

    // Publication date
    if (metadata.publicationDate) {
      parts.push(this.escapeHTML(this.formatMLADate(metadata.publicationDate)));
    }

    // URL (if available)
    if (metadata.url) {
      parts.push(`<a href="${metadata.url}" target="_blank">${this.escapeHTML(metadata.url)}</a>`);
    }

    // Access date (if URL present)
    if (metadata.url && metadata.accessDate) {
      parts.push(`Accessed ${this.escapeHTML(this.formatMLADate(metadata.accessDate))}`);
    }

    return parts.join(', ') + '.';
  }

  private formatMLAAuthors(authors: string[]): string {
    if (authors.length === 1) {
      return this.formatAuthorLastFirst(authors[0]);
    } else if (authors.length === 2) {
      return `${this.formatAuthorLastFirst(authors[0])}, and ${this.formatAuthorFirstLast(authors[1])}`;
    } else {
      return `${this.formatAuthorLastFirst(authors[0])}, et al`;
    }
  }

  /**
   * Chicago 17th Edition Citation (Notes and Bibliography)
   */
  private generateChicago(metadata: DocumentMetadata): string {
    const parts: string[] = [];

    // Authors
    if (metadata.authors && metadata.authors.length > 0) {
      const authorList = this.formatChicagoAuthors(metadata.authors);
      parts.push(authorList);
    }

    // Title (italicized)
    parts.push(`_${metadata.title}_`);

    // Publication info
    const pubInfo: string[] = [];
    if (metadata.publisher) {
      pubInfo.push(metadata.publisher);
    }
    if (metadata.publicationDate) {
      pubInfo.push(this.extractYear(metadata.publicationDate) || '');
    }
    if (pubInfo.length > 0) {
      parts.push(`(${pubInfo.join(', ')})`);
    }

    // URL or DOI
    if (metadata.doi) {
      parts.push(`https://doi.org/${metadata.doi}`);
    } else if (metadata.url) {
      parts.push(metadata.url);
    }

    return parts.join('. ') + '.';
  }

  private generateChicagoHTML(metadata: DocumentMetadata): string {
    const parts: string[] = [];

    // Authors
    if (metadata.authors && metadata.authors.length > 0) {
      const authorList = this.formatChicagoAuthors(metadata.authors);
      parts.push(this.escapeHTML(authorList));
    }

    // Title (italicized)
    parts.push(`<em>${this.escapeHTML(metadata.title)}</em>`);

    // Publication info
    const pubInfo: string[] = [];
    if (metadata.publisher) {
      pubInfo.push(this.escapeHTML(metadata.publisher));
    }
    if (metadata.publicationDate) {
      pubInfo.push(this.extractYear(metadata.publicationDate) || '');
    }
    if (pubInfo.length > 0) {
      parts.push(`(${pubInfo.join(', ')})`);
    }

    // URL or DOI
    if (metadata.doi) {
      parts.push(`<a href="https://doi.org/${metadata.doi}" target="_blank">https://doi.org/${metadata.doi}</a>`);
    } else if (metadata.url) {
      parts.push(`<a href="${metadata.url}" target="_blank">${this.escapeHTML(metadata.url)}</a>`);
    }

    return parts.join('. ') + '.';
  }

  private formatChicagoAuthors(authors: string[]): string {
    if (authors.length === 1) {
      return this.formatAuthorLastFirst(authors[0]);
    } else if (authors.length === 2) {
      return `${this.formatAuthorLastFirst(authors[0])} and ${this.formatAuthorFirstLast(authors[1])}`;
    } else if (authors.length === 3) {
      return `${this.formatAuthorLastFirst(authors[0])}, ${this.formatAuthorFirstLast(authors[1])}, and ${this.formatAuthorFirstLast(authors[2])}`;
    } else {
      return `${this.formatAuthorLastFirst(authors[0])} et al`;
    }
  }

  /**
   * Bluebook 21st Edition Citation (for legal documents)
   */
  private generateBluebook(metadata: DocumentMetadata): string {
    // Bluebook format varies significantly by document type
    if (metadata.documentType === 'statute') {
      return this.generateBluebookStatute(metadata);
    } else if (metadata.documentType === 'case') {
      return this.generateBluebookCase(metadata);
    } else if (metadata.documentType === 'regulation') {
      return this.generateBluebookRegulation(metadata);
    } else {
      // Default format for other documents
      return this.generateBluebookGeneral(metadata);
    }
  }

  private generateBluebookHTML(metadata: DocumentMetadata): string {
    const text = this.generateBluebook(metadata);
    // Bluebook uses small caps for certain elements, but we'll keep it simple
    return this.escapeHTML(text);
  }

  private generateBluebookStatute(metadata: DocumentMetadata): string {
    // Format: Title Number U.S.C. § Section Number (Year)
    const parts: string[] = [];
    
    parts.push(metadata.title);
    
    if (metadata.volume) {
      parts.push(`${metadata.volume}`);
    }
    
    if (metadata.jurisdiction) {
      parts.push(metadata.jurisdiction);
    }
    
    const year = this.extractYear(metadata.publicationDate);
    if (year) {
      parts.push(`(${year})`);
    }
    
    return parts.join(' ');
  }

  private generateBluebookCase(metadata: DocumentMetadata): string {
    // Format: Case Name, Volume Reporter Page (Court Year)
    const parts: string[] = [];
    
    // Case name (italicized)
    parts.push(`_${metadata.title}_`);
    
    // Volume, reporter, page
    if (metadata.volume && metadata.pages) {
      parts.push(`${metadata.volume} ${metadata.pages}`);
    }
    
    // Court and year
    const courtYear: string[] = [];
    if (metadata.jurisdiction) {
      courtYear.push(metadata.jurisdiction);
    }
    const year = this.extractYear(metadata.publicationDate);
    if (year) {
      courtYear.push(year);
    }
    if (courtYear.length > 0) {
      parts.push(`(${courtYear.join(' ')})`);
    }
    
    return parts.join(', ');
  }

  private generateBluebookRegulation(metadata: DocumentMetadata): string {
    // Format: Title, Volume C.F.R. § Section (Year)
    const parts: string[] = [];
    
    parts.push(metadata.title);
    
    if (metadata.volume) {
      parts.push(`${metadata.volume}`);
    }
    
    if (metadata.pages) {
      parts.push(`§ ${metadata.pages}`);
    }
    
    const year = this.extractYear(metadata.publicationDate);
    if (year) {
      parts.push(`(${year})`);
    }
    
    return parts.join(' ');
  }

  private generateBluebookGeneral(metadata: DocumentMetadata): string {
    // General format for other legal documents
    const parts: string[] = [];
    
    // Authors (if any)
    if (metadata.authors && metadata.authors.length > 0) {
      parts.push(metadata.authors.join(' & '));
    }
    
    // Title
    parts.push(metadata.title);
    
    // Publication info
    if (metadata.publisher) {
      parts.push(metadata.publisher);
    }
    
    const year = this.extractYear(metadata.publicationDate);
    if (year) {
      parts.push(`(${year})`);
    }
    
    // URL
    if (metadata.url) {
      parts.push(metadata.url);
    }
    
    return parts.join(', ');
  }

  /**
   * Helper methods
   */
  private formatAuthorLastFirst(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    
    const lastName = parts[parts.length - 1];
    const firstNames = parts.slice(0, -1).join(' ');
    return `${lastName}, ${firstNames}`;
  }

  private formatAuthorFirstLast(name: string): string {
    return name.trim();
  }

  private extractYear(date?: string): string | null {
    if (!date) return null;
    
    // Try to extract year from various date formats
    const yearMatch = date.match(/\d{4}/);
    return yearMatch ? yearMatch[0] : null;
  }

  private formatMLADate(date: string): string {
    // MLA format: Day Month Year (e.g., 15 Mar. 2024)
    try {
      const d = new Date(date);
      const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return date;
    }
  }

  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Copy citation to clipboard
   */
  async copyCitation(citation: Citation, format: 'text' | 'html' = 'text'): Promise<void> {
    const content = format === 'html' ? citation.html : citation.text;
    
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(content);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * Export citations to file
   */
  exportCitations(citations: Citation[], filename: string = 'citations.txt'): void {
    const content = citations.map(c => {
      return `${c.style.toUpperCase()}:\n${c.text}\n\n`;
    }).join('---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export citations as BibTeX
   */
  exportBibTeX(metadata: DocumentMetadata): string {
    const id = metadata.id.replace(/[^a-zA-Z0-9]/g, '_');
    const year = this.extractYear(metadata.publicationDate) || 'n.d.';
    
    const fields: string[] = [];
    fields.push(`  title={${metadata.title}}`);
    
    if (metadata.authors && metadata.authors.length > 0) {
      fields.push(`  author={${metadata.authors.join(' and ')}}`);
    }
    
    if (year !== 'n.d.') {
      fields.push(`  year={${year}}`);
    }
    
    if (metadata.publisher) {
      fields.push(`  publisher={${metadata.publisher}}`);
    }
    
    if (metadata.url) {
      fields.push(`  url={${metadata.url}}`);
    }
    
    if (metadata.doi) {
      fields.push(`  doi={${metadata.doi}}`);
    }
    
    return `@article{${id},\n${fields.join(',\n')}\n}`;
  }
}

// Singleton instance
export const citationService = new CitationService();
