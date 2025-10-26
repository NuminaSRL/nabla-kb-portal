import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  BookOpen,
  Video,
  MessageCircle,
  Mail,
  FileText,
  Settings,
  CreditCard,
  Shield,
  Zap,
  HelpCircle
} from 'lucide-react';

export default function HelpCenterPage() {
  const categories = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Learn the basics of NABLA KB Portal',
      articles: [
        'Quick Start Guide',
        'Understanding Semantic Search',
        'Your First Search',
        'Navigating the Interface',
      ],
    },
    {
      title: 'Search & Discovery',
      icon: Search,
      description: 'Master search techniques and filters',
      articles: [
        'Advanced Search Techniques',
        'Using Filters Effectively',
        'Understanding Search Results',
        'Search Best Practices',
      ],
    },
    {
      title: 'Features & Tools',
      icon: Zap,
      description: 'Explore all available features',
      articles: [
        'Saved Searches & Alerts',
        'Document Viewer Guide',
        'Annotations & Highlights',
        'Export & Sharing Options',
      ],
    },
    {
      title: 'Account & Billing',
      icon: CreditCard,
      description: 'Manage your account and subscription',
      articles: [
        'Upgrading Your Plan',
        'Managing Billing',
        'Understanding Quotas',
        'Cancellation Policy',
      ],
    },
    {
      title: 'Security & Privacy',
      icon: Shield,
      description: 'Learn about data protection',
      articles: [
        'Data Security Measures',
        'Privacy Policy',
        'GDPR Compliance',
        'Two-Factor Authentication',
      ],
    },
    {
      title: 'API & Integrations',
      icon: Settings,
      description: 'Integrate with your tools',
      articles: [
        'API Documentation',
        'MCP Server Setup',
        'Authentication',
        'Rate Limits',
      ],
    },
  ];

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is NABLA KB Portal?',
          a: 'NABLA KB Portal is an AI-powered knowledge base providing access to 100,000+ Italian and EU regulatory documents across 6 compliance domains (GDPR, AI Act, D.Lgs 231, Tax, AML, and Contract Law). It uses semantic search to help you find relevant information quickly and accurately.',
        },
        {
          q: 'How does semantic search work?',
          a: 'Semantic search uses AI to understand the meaning and context of your query, not just matching keywords. It analyzes the intent behind your search and finds documents that are conceptually relevant, even if they don\'t contain your exact search terms. This is powered by 768-dimensional embeddings that capture the semantic meaning of text.',
        },
        {
          q: 'What compliance domains are covered?',
          a: 'We cover six major compliance domains: GDPR & Privacy, AI Act & Ethics, D.Lgs 231/2001, Tax Compliance, Anti-Money Laundering (AML), and Contract Law. Each domain includes regulations, guidelines, case law, and expert opinions from Italian and EU sources.',
        },
        {
          q: 'How often is the content updated?',
          a: 'Our knowledge base is continuously updated with new regulatory documents, guidelines, and legal opinions. We monitor official sources daily and add new content as it becomes available. You can set up alerts to be notified when new documents match your saved searches.',
        },
      ],
    },
    {
      category: 'Search & Results',
      questions: [
        {
          q: 'How do I write effective search queries?',
          a: 'Use natural language to describe what you\'re looking for, as if asking a colleague. For example, instead of "GDPR breach," try "What are the notification requirements for a GDPR data breach?" The semantic search understands context and will find relevant documents even if they use different terminology.',
        },
        {
          q: 'What do the relevance scores mean?',
          a: 'Relevance scores (0-100) indicate how closely a document matches your search query. Scores above 80 are highly relevant, 60-80 are moderately relevant, and below 60 may be tangentially related. The scoring is based on semantic similarity between your query and document content.',
        },
        {
          q: 'Can I filter search results?',
          a: 'Yes! You can filter by domain (GDPR, AI Act, etc.), document type (regulation, guideline, case law), date range, and source. Filters help you narrow down results to find exactly what you need. Pro and Enterprise plans have access to advanced filters.',
        },
        {
          q: 'How many results can I see per search?',
          a: 'This depends on your plan: Free tier shows 5 results, Pro shows 50 results, and Enterprise shows 100 results per search. You can always refine your search or use filters to get more targeted results.',
        },
      ],
    },
    {
      category: 'Features',
      questions: [
        {
          q: 'How do saved searches work?',
          a: 'Saved searches let you store your search queries for quick access later. You can also set up alerts to be notified when new documents match your saved searches. Pro plans allow up to 50 saved searches, while Enterprise plans have unlimited saved searches.',
        },
        {
          q: 'What export formats are available?',
          a: 'You can export search results and documents in PDF and CSV formats. PDF exports include formatted documents with metadata and citations. CSV exports are great for analysis in Excel or other tools. Pro and Enterprise plans have full export capabilities.',
        },
        {
          q: 'Can I annotate documents?',
          a: 'Yes! Pro and Enterprise users can add annotations, highlights, and bookmarks to documents. Your annotations are private and saved to your account. You can also export documents with your annotations included.',
        },
        {
          q: 'How do I share results with my team?',
          a: 'You can create shareable links to specific documents or search results. You can also export results as PDF or CSV and share those files. Enterprise plans include team collaboration features for sharing annotations and saved searches.',
        },
      ],
    },
    {
      category: 'Plans & Billing',
      questions: [
        {
          q: 'What\'s included in the Free plan?',
          a: 'The Free plan includes 20 searches per day, 5 results per search, basic filters, 7-day search history, and document preview. It\'s perfect for trying out the platform and occasional research needs.',
        },
        {
          q: 'How do I upgrade my plan?',
          a: 'Go to your account settings and click "Upgrade Plan." Choose your desired plan (Pro or Enterprise) and enter your payment information. Upgrades take effect immediately, and you\'ll have access to all features of your new plan.',
        },
        {
          q: 'What happens if I exceed my search limit?',
          a: 'You\'ll receive a notification when you\'re approaching your daily limit. If you reach your limit, you can either wait until the next day when your quota resets, or upgrade your plan for higher limits. We\'ll never charge you without your explicit consent.',
        },
        {
          q: 'Can I cancel my subscription anytime?',
          a: 'Yes, you can cancel your subscription at any time from your account settings. You\'ll continue to have access to your plan features until the end of your billing period. After that, you\'ll be moved to the Free plan.',
        },
      ],
    },
    {
      category: 'Technical',
      questions: [
        {
          q: 'Is there an API available?',
          a: 'Yes! Enterprise plans include full API access. You can integrate NABLA KB Portal into your applications, automate searches, and build custom workflows. We also offer an MCP (Model Context Protocol) server for AI tool integration.',
        },
        {
          q: 'What are the API rate limits?',
          a: 'API rate limits vary by plan. Enterprise plans include generous rate limits suitable for production use. Contact our sales team for specific rate limit information and custom enterprise solutions.',
        },
        {
          q: 'How do I integrate with Claude Desktop or other AI tools?',
          a: 'We provide an MCP server that integrates seamlessly with Claude Desktop, Cline, and other MCP-compatible AI tools. Check our integration guides for step-by-step setup instructions for your specific tool.',
        },
        {
          q: 'What security measures are in place?',
          a: 'We use industry-standard security measures including TLS 1.3 encryption for data in transit, encrypted storage, regular security audits, and SOC 2 compliance. We\'re also GDPR compliant and never share your data with third parties.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <section className="container mx-auto px-4 py-20 text-center">
        <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          How Can We Help You?
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Search our knowledge base or browse categories below
        </p>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search help articles..."
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <Link href="/tutorials">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Video className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-medium">Video Tutorials</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6 text-center">
                <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-medium">Documentation</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/contact">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6 text-center">
                <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-medium">Contact Support</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/community">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-medium">Community Forum</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-12">
          Browse by Category
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article) => (
                      <li key={article}>
                        <Link
                          href={`/help/articles/${article.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {article}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-4xl mx-auto space-y-8">
          {faqs.map((category) => (
            <div key={category.category}>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Badge variant="secondary">{category.category}</Badge>
              </h3>
              <Accordion type="single" collapsible className="space-y-2">
                {category.questions.map((faq, idx) => (
                  <AccordionItem key={idx} value={`${category.category}-${idx}`}>
                    <AccordionTrigger className="text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Still Need Help?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Our support team is here to help you get the most out of NABLA KB Portal
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/contact">
            <Button size="lg">
              <Mail className="mr-2 h-5 w-5" />
              Contact Support
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </Link>
        </div>
        <div className="mt-8 text-sm text-muted-foreground">
          <p>Response times: Free (48h) • Pro (24h) • Enterprise (4h)</p>
        </div>
      </section>
    </div>
  );
}
