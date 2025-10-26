import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Shield, 
  Zap, 
  FileText, 
  TrendingUp, 
  Users,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4" variant="secondary">
          🚀 Now Live: Italian & EU Regulatory Knowledge Base
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Your Gateway to Italian & EU
          <span className="text-primary"> Compliance Intelligence</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Access 100,000+ regulatory documents with AI-powered semantic search. 
          Stay compliant with GDPR, AI Act, D.Lgs 231, Tax, AML, and Contract Law.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Free tier available • No credit card required • 20 searches/day
        </p>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="text-center">
            <div className="text-3xl font-bold">100K+</div>
            <div className="text-sm text-muted-foreground">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">6</div>
            <div className="text-sm text-muted-foreground">Compliance Domains</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">768-dim</div>
            <div className="text-sm text-muted-foreground">Semantic Search</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">&lt;200ms</div>
            <div className="text-sm text-muted-foreground">Query Response</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need for Compliance
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Search className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Semantic Search</CardTitle>
              <CardDescription>
                AI-powered search understands context and intent, not just keywords
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Natural language queries</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>768-dimensional embeddings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Relevance scoring</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>6 Compliance Domains</CardTitle>
              <CardDescription>
                Comprehensive coverage of Italian and EU regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>GDPR & Privacy</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>AI Act & Ethics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>D.Lgs 231, Tax, AML, Contracts</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Optimized infrastructure for instant results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>&lt;200ms query response</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Real-time updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Scalable architecture</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Advanced Filters</CardTitle>
              <CardDescription>
                Narrow down results with powerful filtering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Filter by domain & type</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Date range filtering</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Source filtering</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Track your searches and optimize your workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Search history</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Usage dashboards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Quota monitoring</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Collaboration</CardTitle>
              <CardDescription>
                Share insights with your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Saved searches</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Export to PDF/CSV</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Citation generation</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">
          Built for Compliance Professionals
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Legal Teams</h3>
            <p className="text-muted-foreground">
              Quickly research regulatory requirements, find relevant case law, 
              and ensure compliance across multiple jurisdictions.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Compliance Officers</h3>
            <p className="text-muted-foreground">
              Monitor regulatory changes, assess impact on your organization, 
              and maintain up-to-date compliance documentation.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Consultants</h3>
            <p className="text-muted-foreground">
              Access comprehensive regulatory knowledge to advise clients, 
              prepare reports, and deliver expert guidance.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Developers</h3>
            <p className="text-muted-foreground">
              Integrate compliance data into your applications via our MCP server, 
              ensuring your products meet regulatory standards.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Trusted by Compliance Professionals
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <CardDescription>
                "The semantic search is a game-changer. I can find exactly what I need 
                in seconds, not hours."
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Maria Rossi</p>
              <p className="text-sm text-muted-foreground">Compliance Officer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <CardDescription>
                "Having all Italian and EU regulations in one place saves us countless 
                hours every week."
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Luca Bianchi</p>
              <p className="text-sm text-muted-foreground">Legal Consultant</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <CardDescription>
                "The MCP integration lets us build compliance directly into our 
                AI workflows. Brilliant!"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Giovanni Ferrari</p>
              <p className="text-sm text-muted-foreground">Tech Lead</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">
          Ready to Transform Your Compliance Workflow?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join hundreds of compliance professionals who trust NABLA KB Portal 
          for their regulatory research needs.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/docs">Documentation</Link></li>
                <li><Link href="/api">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/tutorials">Tutorials</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/changelog">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/careers">Careers</Link></li>
                <li><Link href="/partners">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/security">Security</Link></li>
                <li><Link href="/compliance">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 NABLA KB Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
