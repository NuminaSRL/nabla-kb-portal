# NABLA KB Portal - Video Tutorials & Guides

## Quick Start Tutorials (5-10 minutes each)

### 1. Getting Started with NABLA KB Portal
**Duration:** 5 minutes  
**Topics Covered:**
- Creating your account
- Understanding the interface
- Running your first search
- Navigating search results

**Key Takeaways:**
- How to sign up and choose the right plan
- Overview of the main dashboard
- Basic search functionality
- Understanding relevance scores

---

### 2. Mastering Semantic Search
**Duration:** 8 minutes  
**Topics Covered:**
- What is semantic search?
- Writing effective queries
- Understanding search results
- Best practices for finding documents

**Key Takeaways:**
- Use natural language instead of keywords
- How semantic search understands context
- Interpreting relevance scores
- Tips for refining your searches

**Example Queries:**
```
❌ Bad: "GDPR breach"
✅ Good: "What are the notification requirements for a GDPR data breach?"

❌ Bad: "AI Act risk"
✅ Good: "How does the AI Act classify high-risk AI systems?"

❌ Bad: "231 model"
✅ Good: "What are the requirements for an organizational model under D.Lgs 231?"
```

---

### 3. Using Advanced Filters
**Duration:** 7 minutes  
**Topics Covered:**
- Domain filtering (GDPR, AI Act, etc.)
- Document type filtering
- Date range filtering
- Source filtering
- Combining multiple filters

**Key Takeaways:**
- How to narrow down results effectively
- When to use each filter type
- Combining filters for precise results
- Saving filter combinations

**Pro Tips:**
- Start broad, then narrow with filters
- Use date filters to find recent updates
- Filter by source for official documents
- Save frequently used filter combinations

---

### 4. Saved Searches & Alerts
**Duration:** 6 minutes  
**Topics Covered:**
- Creating saved searches
- Setting up email alerts
- Managing saved searches
- Alert frequency options

**Key Takeaways:**
- How to save a search for later
- Configuring alert notifications
- Organizing your saved searches
- Best practices for monitoring topics

**Use Cases:**
- Monitor regulatory changes in your domain
- Track specific compliance topics
- Stay updated on new guidelines
- Get notified of relevant case law

---

### 5. Document Viewer Deep Dive
**Duration:** 10 minutes  
**Topics Covered:**
- Opening and navigating documents
- Using the table of contents
- Zoom and view controls
- Bookmarking important sections
- Searching within documents

**Key Takeaways:**
- Efficient document navigation
- Finding specific sections quickly
- Marking important passages
- Keyboard shortcuts for productivity

**Keyboard Shortcuts:**
- `Ctrl/Cmd + F`: Search in document
- `Ctrl/Cmd + +/-`: Zoom in/out
- `Ctrl/Cmd + B`: Add bookmark
- `Ctrl/Cmd + H`: Toggle highlights
- `Esc`: Close document viewer

---

### 6. Annotations & Highlights
**Duration:** 8 minutes  
**Topics Covered:**
- Adding annotations to documents
- Creating highlights
- Organizing annotations
- Exporting annotated documents
- Sharing annotations (Enterprise)

**Key Takeaways:**
- How to annotate effectively
- Color-coding highlights
- Managing your annotations
- Exporting with annotations included

**Best Practices:**
- Use consistent color coding
- Add context to annotations
- Review annotations regularly
- Export important annotated docs

---

### 7. Export & Sharing Options
**Duration:** 7 minutes  
**Topics Covered:**
- Exporting to PDF
- Exporting to CSV
- Generating citations
- Creating shareable links
- Bulk export (Enterprise)

**Key Takeaways:**
- Choosing the right export format
- Formatting citations correctly
- Sharing results with colleagues
- Batch exporting multiple documents

**Export Formats:**
- **PDF**: Best for reports and presentations
- **CSV**: Best for data analysis
- **Citations**: For academic/legal references
- **Links**: For quick sharing

---

### 8. Usage Dashboard & Analytics
**Duration:** 6 minutes  
**Topics Covered:**
- Understanding your usage dashboard
- Monitoring search quotas
- Viewing search history
- Analyzing search patterns
- Identifying top searches

**Key Takeaways:**
- How to track your usage
- Understanding quota limits
- Reviewing past searches
- Optimizing your workflow

**Dashboard Metrics:**
- Daily/monthly search count
- Quota remaining
- Most searched topics
- Search frequency trends
- Average results per search

---

## Advanced Tutorials (15-20 minutes each)

### 9. API Integration Guide
**Duration:** 20 minutes  
**Topics Covered:**
- Getting your API key
- Authentication methods
- Making your first API call
- Handling responses
- Error handling and rate limits

**Key Takeaways:**
- Setting up API access
- Understanding endpoints
- Best practices for API usage
- Troubleshooting common issues

**Sample Code:**
```python
import requests

API_KEY = "your_api_key_here"
BASE_URL = "https://api.nabla-kb.com/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Search documents
response = requests.post(
    f"{BASE_URL}/search",
    headers=headers,
    json={
        "query": "GDPR data breach notification",
        "limit": 10,
        "filters": {
            "domain": ["gdpr"]
        }
    }
)

results = response.json()
print(f"Found {len(results['documents'])} documents")
```

---

### 10. MCP Server Setup
**Duration:** 15 minutes  
**Topics Covered:**
- What is MCP (Model Context Protocol)?
- Installing the MCP server
- Configuring Claude Desktop
- Configuring Cline
- Testing the integration

**Key Takeaways:**
- Understanding MCP benefits
- Step-by-step setup process
- Troubleshooting connection issues
- Using KB Portal in AI workflows

**Configuration Example:**
```json
{
  "mcpServers": {
    "nabla-kb": {
      "command": "npx",
      "args": ["-y", "@nabla/kb-mcp-server"],
      "env": {
        "NABLA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

---

### 11. Team Collaboration (Enterprise)
**Duration:** 18 minutes  
**Topics Covered:**
- Setting up team workspaces
- Sharing saved searches
- Collaborative annotations
- Team usage analytics
- Access control and permissions

**Key Takeaways:**
- Managing team members
- Sharing resources effectively
- Tracking team usage
- Setting up role-based access

---

### 12. Custom Workflows & Automation
**Duration:** 20 minutes  
**Topics Covered:**
- Automating searches with API
- Setting up webhooks
- Creating custom integrations
- Building compliance dashboards
- Scheduled reports

**Key Takeaways:**
- Automating repetitive tasks
- Integrating with existing tools
- Building custom solutions
- Monitoring compliance automatically

---

## Domain-Specific Tutorials

### 13. GDPR Compliance Research
**Duration:** 12 minutes  
**Topics Covered:**
- Finding GDPR articles and guidelines
- Researching data breach requirements
- DPIA templates and guidance
- Cross-border data transfer rules

**Example Searches:**
- "GDPR Article 33 data breach notification timeline"
- "When is a DPIA required under GDPR?"
- "Standard contractual clauses for data transfers"
- "GDPR fines and enforcement actions"

---

### 14. AI Act Compliance
**Duration:** 12 minutes  
**Topics Covered:**
- Understanding AI Act risk categories
- Finding relevant AI Act provisions
- Compliance requirements by risk level
- Documentation and transparency obligations

**Example Searches:**
- "AI Act high-risk system classification criteria"
- "AI Act transparency requirements for general purpose AI"
- "AI Act conformity assessment procedures"
- "AI Act prohibited AI practices"

---

### 15. D.Lgs 231/2001 Research
**Duration:** 12 minutes  
**Topics Covered:**
- Corporate liability framework
- Organizational model requirements
- Supervisory body guidelines
- Predicate offenses

**Example Searches:**
- "D.Lgs 231 organizational model components"
- "Supervisory body composition and duties"
- "D.Lgs 231 predicate offenses list"
- "MOG 231 best practices"

---

## Tips & Tricks

### Power User Tips

1. **Use Search Operators**
   - Quotes for exact phrases: `"data breach notification"`
   - Exclude terms with minus: `GDPR -cookies`
   - OR operator: `privacy OR data protection`

2. **Keyboard Shortcuts**
   - `/` - Focus search bar
   - `Ctrl/Cmd + K` - Quick search
   - `Ctrl/Cmd + S` - Save current search
   - `Ctrl/Cmd + E` - Export results

3. **Optimize Your Workflow**
   - Save frequently used searches
   - Set up alerts for monitoring
   - Use filters to narrow results
   - Export results for offline access

4. **Search Best Practices**
   - Start with natural language
   - Be specific about what you need
   - Use domain filters early
   - Review top 10 results first

5. **Quota Management**
   - Check dashboard daily
   - Save important searches
   - Use filters to reduce searches
   - Upgrade when consistently hitting limits

---

## Troubleshooting Common Issues

### Search Not Returning Results
- Check spelling and try synonyms
- Remove filters and search again
- Try broader search terms
- Use natural language instead of keywords

### Slow Performance
- Clear browser cache
- Check internet connection
- Try during off-peak hours
- Contact support if persistent

### Export Issues
- Check file size limits
- Verify export format support
- Ensure sufficient quota remaining
- Try exporting fewer results

### API Connection Problems
- Verify API key is correct
- Check rate limit status
- Ensure proper authentication
- Review API documentation

---

## Additional Resources

### Documentation
- [API Reference](https://docs.nabla-kb.com/api)
- [MCP Server Guide](https://docs.nabla-kb.com/mcp)
- [Integration Examples](https://docs.nabla-kb.com/examples)

### Community
- [Community Forum](https://community.nabla-kb.com)
- [GitHub Discussions](https://github.com/nabla-kb/discussions)
- [Stack Overflow Tag](https://stackoverflow.com/questions/tagged/nabla-kb)

### Support
- Email: support@nabla-kb.com
- Response times: Free (48h), Pro (24h), Enterprise (4h)
- [Submit a ticket](https://support.nabla-kb.com)

---

## Video Tutorial Links

All video tutorials are available at: [https://nabla-kb.com/tutorials](https://nabla-kb.com/tutorials)

Subscribe to our YouTube channel for updates: [NABLA KB Portal](https://youtube.com/@nabla-kb)

---

*Last Updated: January 2025*
