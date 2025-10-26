# Citation System Quick Reference

Quick reference for using the Citation Generation System in NABLA KB Portal.

## User Guide

### Generating Citations

1. **Open a document** in the document viewer
2. **Click the "Cite" button** in the viewer controls (top right)
3. **Select citation style** from tabs (APA, MLA, Chicago, Bluebook)
4. **Copy or export** the citation

### Citation Styles

| Style | Best For | Example |
|-------|----------|---------|
| **APA** | Psychology, Education, Social Sciences | Smith, J. (2023). _Title_. Publisher. |
| **MLA** | Literature, Arts, Humanities | Smith, John. _Title_. Publisher, 2023. |
| **Chicago** | History, Business, Fine Arts | Smith, John. _Title_. (Publisher, 2023). |
| **Bluebook** | Legal documents, Law reviews | _Case Name_, 123 F.3d 456 (Court 2023) |

### Actions

- **Copy**: Click "Copy" button to copy citation to clipboard
- **Export All**: Download all 4 citation formats as text file
- **Export BibTeX**: Download citation in BibTeX format for LaTeX

## Developer Guide

### Basic Usage

```typescript
import { citationService } from '@/lib/citations/citation-service';

const citation = citationService.generateCitation(document, 'apa');
console.log(citation.text);
```

### Component Integration

```tsx
import { CitationButton } from '@/components/citations/CitationButton';

<CitationButton document={documentMetadata} />
```

### API Endpoint

```bash
GET /api/citations?documentId=doc-123
```

## Database Queries

### Most Cited Documents

```sql
SELECT title, total_citations, unique_users
FROM citation_statistics
ORDER BY total_citations DESC
LIMIT 10;
```

### Citation Style Popularity

```sql
SELECT citation_style, COUNT(*) as count
FROM citation_history
GROUP BY citation_style
ORDER BY count DESC;
```

### Recent Citations

```sql
SELECT d.title, ch.citation_style, ch.created_at
FROM citation_history ch
JOIN documents d ON ch.document_id = d.id
ORDER BY ch.created_at DESC
LIMIT 20;
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Citation button not visible | Check `documentMetadata` prop is provided |
| Copy fails | Ensure HTTPS is enabled |
| Bluebook format wrong | Set correct `documentType` (statute, case, regulation) |
| Empty export file | Check browser download settings |

## Citation Format Examples

### APA Format

```
European Parliament, & Council of the European Union. (2016). 
_General Data Protection Regulation_. Official Journal of the 
European Union. https://eur-lex.europa.eu/eli/reg/2016/679/oj.
```

### MLA Format

```
European Parliament, and Council of the European Union. 
_General Data Protection Regulation_. Official Journal of the 
European Union, 27 Apr. 2016. 
https://eur-lex.europa.eu/eli/reg/2016/679/oj.
```

### Chicago Format

```
European Parliament, and Council of the European Union. 
_General Data Protection Regulation_. (Official Journal of the 
European Union, 2016). https://eur-lex.europa.eu/eli/reg/2016/679/oj.
```

### Bluebook Format (Regulation)

```
General Data Protection Regulation, Regulation (EU) 2016/679 (2016)
```

## Required Metadata

Minimum required:
- `id` - Document ID
- `title` - Document title

Recommended for complete citations:
- `authors` - List of authors
- `publicationDate` - Publication date
- `publisher` - Publisher name
- `url` or `doi` - Document location

For legal documents (Bluebook):
- `documentType` - statute, case, or regulation
- `jurisdiction` - Legal jurisdiction
- `volume` - Volume number
- `pages` - Page numbers

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + C` | Copy selected citation |
| `Esc` | Close citation dialog |
| `Tab` | Navigate between citation styles |

## Best Practices

1. ✅ Always provide complete metadata for accurate citations
2. ✅ Use DOI when available (preferred over URL)
3. ✅ Specify document type for legal documents
4. ✅ Include access dates for online sources
5. ✅ Verify author name formatting (First Last)

## Common Patterns

### Generate All Citations

```typescript
const allCitations = citationService.generateAllCitations(document);
allCitations.forEach(c => console.log(`${c.style}: ${c.text}`));
```

### Copy Citation

```typescript
await citationService.copyCitation(citation, 'text');
```

### Export BibTeX

```typescript
const bibtex = citationService.exportBibTeX(document);
```

### Track Citation Usage

```sql
SELECT track_citation_usage('doc-id', 'apa');
```

## Support Resources

- Full Documentation: `src/lib/citations/README.md`
- Deployment Guide: `CITATION_DEPLOYMENT_GUIDE.md`
- Test Suite: `tests/citations.spec.ts`
- API Reference: `/api/citations`

## Quick Links

- [APA Style Guide](https://apastyle.apa.org/)
- [MLA Style Guide](https://style.mla.org/)
- [Chicago Manual of Style](https://www.chicagomanualofstyle.org/)
- [Bluebook Citation](https://www.legalbluebook.com/)
