# Usage Dashboard Quick Reference Guide

## Overview
The Usage Dashboard provides comprehensive insights into your KB Portal activity, including search usage, quota status, and analytics.

## Accessing the Dashboard
1. Log in to your KB Portal account
2. Navigate to the main dashboard
3. Click on "Usage Dashboard" in the Quick Actions section
4. Or directly visit: `/dashboard/usage`

## Dashboard Sections

### 1. Overview Tab
The Overview tab provides a high-level summary of your usage and quota status.

#### Quota Progress
- **Daily Searches**: Shows current usage vs. limit
- **Progress Bar**: Color-coded (green/yellow/red) based on usage
- **Remaining Quota**: Displays searches remaining today
- **Reset Time**: Shows when quota resets

#### Usage Statistics
- **Total Searches**: Total searches in selected period
- **Daily Average**: Average searches per day
- **Peak Day**: Maximum searches in a single day
- **Time Period Selector**: Choose 7, 14, or 30 days

#### Tier Comparison (Free/Pro users only)
- **Feature Matrix**: Compare features across all tiers
- **Current Plan**: Highlighted in the table
- **Upgrade Buttons**: Quick access to upgrade options
- **Pricing Info**: Monthly cost for each tier

#### Upgrade Prompts
- Appear when usage reaches 75% or 90% of quota
- Provide tier-specific upgrade recommendations
- Direct link to pricing page

### 2. History Tab
The History tab shows your search activity and patterns.

#### Search History
- **Recent Searches**: Chronological list of your searches
- **Time Stamps**: Relative time (e.g., "2 hours ago")
- **Result Counts**: Number of results for each search
- **Filter Indicators**: Shows if filters were applied
- **Re-run Searches**: Click any search to run it again
- **Display Limit**: Choose 10, 20, 50, or 100 results

#### Top Searches
- **Frequency Ranking**: Most frequent searches ranked
- **Search Counts**: Number of times each query was searched
- **Visual Bars**: Frequency represented visually
- **Last Searched**: Most recent search timestamp
- **Top N Selector**: Choose top 5, 10, or 20

### 3. Analytics Tab
The Analytics tab provides visual insights into your usage trends.

#### Usage Trends Chart
- **Bar Chart**: Daily usage visualized
- **Hover Tooltips**: Exact values on hover
- **Time Period**: Select 7, 14, or 30 days
- **Summary Stats**: Total, average, and peak below chart

#### Chart Features
- **Interactive**: Hover over bars for details
- **Responsive**: Adapts to screen size
- **Color-Coded**: Blue bars for searches
- **Date Labels**: Shows date for each bar

## Features by Tier

### Free Tier
- ✅ View usage dashboard
- ✅ See quota status
- ✅ 7-day search history
- ✅ Basic analytics
- ✅ Top 5 searches
- ❌ Advanced filters
- ❌ Export data

### Pro Tier
- ✅ All Free features
- ✅ 90-day search history
- ✅ Advanced analytics
- ✅ Top 20 searches
- ✅ Export to PDF/CSV (coming soon)
- ✅ Custom date ranges (coming soon)

### Enterprise Tier
- ✅ All Pro features
- ✅ Unlimited search history
- ✅ Advanced analytics
- ✅ Unlimited top searches
- ✅ Team analytics (coming soon)
- ✅ API usage tracking (coming soon)
- ✅ Custom reports (coming soon)

## Understanding Quota Status

### Color Indicators
- **Green**: 0-74% usage - Healthy
- **Yellow**: 75-89% usage - Approaching limit
- **Red**: 90-100% usage - Near or at limit

### Quota Types
1. **Daily Searches**: Number of searches per day
2. **Daily Exports**: Number of exports per day (Pro/Enterprise)
3. **API Calls**: Number of API calls per day (Enterprise)

### Reset Schedule
- Quotas reset daily at midnight UTC
- Reset time displayed in your local timezone
- Usage starts fresh each day

## Tips for Effective Use

### Monitoring Usage
1. Check dashboard regularly to track patterns
2. Set personal reminders at 75% usage
3. Review top searches to optimize queries
4. Use analytics to plan upgrade timing

### Optimizing Searches
1. Review search history for duplicate queries
2. Use saved searches for frequent queries
3. Refine queries based on result counts
4. Apply filters to narrow results

### Upgrade Decisions
1. Monitor days at limit in statistics
2. Review tier comparison for needed features
3. Consider average daily usage trends
4. Evaluate peak usage patterns

## Troubleshooting

### Dashboard Not Loading
- Check internet connection
- Refresh the page
- Clear browser cache
- Try different browser

### Data Not Updating
- Click the Refresh button
- Check if you're logged in
- Verify quota hasn't reset
- Contact support if persists

### Incorrect Usage Counts
- Wait a few minutes for sync
- Refresh the dashboard
- Check timezone settings
- Contact support with details

## Keyboard Shortcuts

- **Tab**: Navigate between tabs
- **R**: Refresh dashboard (when focused)
- **Esc**: Close modals/prompts
- **Arrow Keys**: Navigate lists

## Mobile Usage

### Responsive Design
- Dashboard adapts to mobile screens
- Touch-friendly interactions
- Swipe between tabs
- Tap charts for details

### Mobile Tips
- Use landscape for better chart viewing
- Pinch to zoom on charts
- Pull down to refresh
- Use native back button

## API Integration

### Endpoints
All endpoints require authentication.

#### GET /api/usage/statistics
Returns aggregated usage statistics.
```
Query Params:
- days: number (default: 7)

Response:
{
  success: boolean,
  data: Array<{
    quota_type: string,
    total_usage: number,
    avg_daily_usage: number,
    max_daily_usage: number,
    days_at_limit: number,
    current_tier: string
  }>
}
```

#### GET /api/usage/daily
Returns day-by-day usage breakdown.
```
Query Params:
- days: number (default: 7)

Response:
{
  success: boolean,
  data: Array<{
    date: string,
    searches: number,
    exports: number
  }>
}
```

#### GET /api/usage/history
Returns user's search history.
```
Query Params:
- limit: number (default: 20)

Response:
{
  success: boolean,
  data: Array<{
    id: string,
    query: string,
    searched_at: string,
    result_count: number,
    filters: object
  }>
}
```

#### GET /api/usage/top-searches
Returns most frequent searches.
```
Query Params:
- limit: number (default: 10)

Response:
{
  success: boolean,
  data: Array<{
    query: string,
    count: number,
    last_searched: string
  }>
}
```

## Privacy & Data

### Data Collection
- Usage data stored securely in Supabase
- Only your own data is visible
- No data shared with third parties
- Compliant with GDPR

### Data Retention
- **Free**: 7 days of history
- **Pro**: 90 days of history
- **Enterprise**: Unlimited history

### Data Export
- Export feature coming soon
- PDF and CSV formats
- Includes all visible data
- Respects tier limits

## Support

### Getting Help
- **Documentation**: Check this guide first
- **FAQ**: Visit help center
- **Email**: support@nabla.ai
- **Chat**: Available for Pro/Enterprise

### Reporting Issues
Include the following when reporting:
1. Your tier (Free/Pro/Enterprise)
2. Browser and version
3. Steps to reproduce
4. Screenshots if applicable
5. Error messages

## Updates & Changelog

### Recent Updates
- **v1.0.0** (2025-01-16): Initial release
  - Usage dashboard launched
  - Real-time quota tracking
  - Search history viewer
  - Usage analytics charts
  - Tier comparison tool

### Coming Soon
- Export to PDF/CSV
- Custom date ranges
- Usage predictions
- Email alerts
- Team analytics (Enterprise)
- Advanced filtering

## Best Practices

### Daily Routine
1. Check quota status in morning
2. Review yesterday's usage
3. Plan searches accordingly
4. Monitor throughout day

### Weekly Review
1. Check 7-day trends
2. Review top searches
3. Identify patterns
4. Optimize search strategy

### Monthly Planning
1. Review 30-day analytics
2. Evaluate tier needs
3. Plan upgrades if needed
4. Set usage goals

## Glossary

- **Quota**: Daily limit for searches/exports/API calls
- **Usage**: Number of actions performed
- **Tier**: Subscription level (Free/Pro/Enterprise)
- **Period**: Time frame for quota (daily)
- **Reset**: When quota returns to zero
- **Limit**: Maximum allowed actions
- **Remaining**: Actions left before limit

## Additional Resources

- [Pricing Page](/pricing) - Compare plans and upgrade
- [Search Guide](/docs/search) - Optimize your searches
- [API Documentation](/docs/api) - Integrate with API
- [Support Center](/support) - Get help

---

**Last Updated**: 2025-01-16
**Version**: 1.0.0
**Feedback**: support@nabla.ai
