# Citation System

The Citation System provides comprehensive citation generation in multiple academic and legal formats for regulatory documents in the NABLA KB Portal.

## Features

- **Multiple Citation Formats**:
  - APA 7th Edition
  - MLA 9th Edition
  - Chicago 17th Edition (Notes and Bibliography)
  - Bluebook 21st Edition (Legal)

- **Export Options**:
  - Copy to clipboard (text or HTML)
  - Export all formats to text file
  - Export BibTeX format

- **Document Type Support**:
  - Regulations
  - Guidelines
  - Articles
  - Books
  - Legal cases
  - Statutes

## Usage

### Basic Citation Generation

```typescript
import { citationService, DocumentMetadata } from '@/lib/citations/citation-service';

const document: DocumentMetadata = {
  id: 'doc-123',
  title: 'GDPR Regulation',
  authors: ['European Parliament', 'Council of the European Union'],
  publicationDate: '2016-04-27',
  publisher: 'Official Journal of the European Union',
  url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
  documentType: 'regulation',
  jurisdiction: 'EU'
};

// Generate single citation
const apaCitation = citationService.generateCitation(document, 'apa');
console.log(apaCitation.text);
// Output: European Parliament, & Council of the European Union. (2016). _GDPR Regulation_. Official Journal of the European Union. https://eur-lex.europa.eu/eli/reg/2016/679/oj.

// Generate all citations
const allCitations = citationService.generateAllCitations(document);
```

### Using Citation Components

```tsx
import { CitationButton } from '@/components/citations/CitationButton';
import { CitationDialog } from '@/components/citations/CitationDialog';

// Simple button with dialog
<CitationButton document={documentMetadata} />

// Custom dialog usage
const [open, setOpen] = useState(false);

<CitationDialog
  open={open}
  onOpenChange={setOpen}
  document={documentMetadata}
/>
```

### Copy to Clipboard

```typescript
const citation = citationService.generateCitation(document, 'apa');

// Copy as plain text
await citationService.copyCitation(citation, 'text');

// Copy as HTML
await citationService.copyCitation(citation, 'html');
```

### Export Citations

```typescript
const citations = citationService.generateAllCitations(document);

// Export all formats to text file
citationService.exportCitations(citations, 'my-citations.txt');

// Export BibTeX
const bibtex = citationService.exportBibTeX(document);
```

## Citation Formats

### APA (American Psychological Association)

**Format**: Author(s). (Year). _Title_. Publisher. URL/DOI

**Example**:
```
Smith, J., & Jones, M. (2023). _Understanding GDPR Compliance_. EU Publications. https://doi.org/10.1234/example
```

**Features**:
- Last name, First initial format
- Ampersand (&) before last author
- Year in parentheses
- Italicized title
- DOI preferred over URL

### MLA (Modern Language Association)

**Format**: Author(s). _Title_. Publisher, Date. URL. Accessed Date.

**Example**:
```
Smith, John, and Mary Jones. _Understanding GDPR Compliance_. EU Publications, 15 Mar. 2023. https://example.com. Accessed 10 Oct. 2024.
```

**Features**:
- Last name, First name format
- "and" before last author
- "et al." for 3+ authors
- Day Month Year format
- Access date for online sources

### Chicago (Chicago Manual of Style)

**Format**: Author(s). _Title_. (Publisher, Year). URL/DOI.

**Example**:
```
Smith, John, and Mary Jones. _Understanding GDPR Compliance_. (EU Publications, 2023). https://doi.org/10.1234/example.
```

**Features**:
- Last name, First name format
- "and" before last author
- "et al." for 4+ authors
- Publication info in parentheses
- Flexible URL/DOI placement

### Bluebook (Legal Citation)

**Format**: Varies by document type (statute, case, regulation, etc.)

**Statute Example**:
```
GDPR, Regulation (EU) 2016/679 (2016)
```

**Case Example**:
```
_Google LLC v. Commission_, Case T-612/17 (CJEU 2021)
```

**Features**:
- Specialized formats for legal documents
- Small caps for certain elements
- Jurisdiction-specific formatting
- Citation to official reporters

## Document Metadata

The citation system requires the following metadata:

```typescript
interface DocumentMetadata {
  id: string;                    // Required: Document ID
  title: string;                 // Required: Document title
  authors?: string[];            // Optional: List of authors
  publicationDate?: string;      // Optional: Publication date (ISO format)
  publisher?: string;            // Optional: Publisher name
  url?: string;                  // Optional: Document URL
  doi?: string;                  // Optional: Digital Object Identifier
  documentType?: string;         // Optional: Type (regulation, case, etc.)
  jurisdiction?: string;         // Optional: Legal jurisdiction
  volume?: string;               // Optional: Volume number
  issue?: string;                // Optional: Issue number
  pages?: string;                // Optional: Page numbers
  edition?: string;              // Optional: Edition
  accessDate?: string;           // Optional: Access date (ISO format)
}
```

## API Endpoints

### GET /api/citations

Retrieve citation metadata for a document.

**Query Parameters**:
- `documentId` (required): Document ID

**Response**:
```json
{
  "success": true,
  "metadata": {
    "id": "doc-123",
    "title": "GDPR Regulation",
    "authors": ["European Parliament"],
    "publicationDate": "2016-04-27",
    ...
  }
}
```

### POST /api/citations

Generate citations for a document.

**Request Body**:
```json
{
  "documentId": "doc-123",
  "styles": ["apa", "mla", "chicago", "bluebook"]
}
```

## Database Schema

### citation_history Table

Tracks citation generation for analytics:

```sql
CREATE TABLE citation_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  document_id UUID REFERENCES documents(id),
  citation_style TEXT CHECK (citation_style IN ('apa', 'mla', 'chicago', 'bluebook')),
  created_at TIMESTAMP WITH TIME ZONE
);
```

### citation_statistics View

Aggregated citation statistics:

```sql
CREATE VIEW citation_statistics AS
SELECT
  document_id,
  title,
  COUNT(*) AS total_citations,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(CASE WHEN citation_style = 'apa' THEN 1 END) AS apa_count,
  ...
FROM documents d
LEFT JOIN citation_history ch ON d.id = ch.document_id
GROUP BY document_id, title;
```

## Testing

Run citation tests:

```bash
npm run test:citations
```

Test coverage includes:
- Citation generation for all formats
- Copy to clipboard functionality
- Export functionality
- Multiple authors handling
- Legal document formatting
- API endpoints
- UI components

## Best Practices

1. **Always provide complete metadata**: More metadata = better citations
2. **Use DOI when available**: Preferred over URLs for academic citations
3. **Specify document type**: Enables proper Bluebook formatting
4. **Include access dates**: Required for online sources in some formats
5. **Validate author names**: Ensure proper formatting (First Last)

## Troubleshooting

### Citations not generating

Check that document metadata includes at minimum:
- `id`
- `title`

### Bluebook format incorrect

Ensure `documentType` is set correctly:
- `statute` for laws
- `case` for court cases
- `regulation` for regulations

### Copy to clipboard fails

Ensure HTTPS is enabled (required for clipboard API) or use the fallback method.

## Future Enhancements

- [ ] Additional citation styles (Harvard, Vancouver)
- [ ] Batch citation generation
- [ ] Citation style customization
- [ ] Integration with reference managers (Zotero, Mendeley)
- [ ] Citation validation and error checking
- [ ] Multi-language support for citations
