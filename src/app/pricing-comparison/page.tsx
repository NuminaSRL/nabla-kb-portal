import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, ArrowRight, Zap, Crown, Building2 } from 'lucide-react';

export default function PricingComparisonPage() {
  const tiers = [
    {
      name: 'Free',
      icon: Zap,
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out the platform',
      badge: null,
      features: [
        { name: '20 searches per day', included: true },
        { name: '5 results per search', included: true },
        { name: 'Basic filters', included: true },
        { name: 'Search history (7 days)', included: true },
        { name: 'Document preview', included: true },
        { name: 'Advanced filters', included: false },
        { name: 'Saved searches', included: false },
        { name: 'Export functionality', included: false },
        { name: 'Annotations', included: false },
        { name: 'API access', included: false },
      ],
      cta: 'Start Free',
      ctaLink: '/signup',
      popular: false,
    },
    {
      name: 'Pro',
      icon: Crown,
      price: '$49',
      period: 'per month',
      description: 'For professionals who need more',
      badge: 'Most Popular',
      features: [
        { name: '500 searches per day', included: true },
        { name: '50 results per search', included: true },
        { name: 'Advanced filters', included: true },
        { name: 'Search history (unlimited)', included: true },
        { name: 'Document preview', included: true },
        { name: 'Saved searches (50)', included: true },
        { name: 'Export to PDF/CSV', included: true },
        { name: 'Annotations & highlights', included: true },
        { name: 'Citation generation', included: true },
        { name: 'API access', included: false },
      ],
      cta: 'Start Pro Trial',
      ctaLink: '/signup?tier=pro',
      popular: true,
    },
    {
      name: 'Enterprise',
      icon: Building2,
      price: 'Custom',
      period: 'contact us',
      description: 'For teams and organizations',
      badge: 'Best Value',
      features: [
        { name: 'Unlimited searches', included: true },
        { name: '100 results per search', included: true },
        { name: 'All filters & features', included: true },
        { name: 'Search history (unlimited)', included: true },
        { name: 'Full document access', included: true },
        { name: 'Unlimited saved searches', included: true },
        { name: 'Bulk export', included: true },
        { name: 'Advanced annotations', included: true },
        { name: 'Team collaboration', included: true },
        { name: 'Full API access', included: true },
        { name: 'Priority support', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'SLA guarantee', included: true },
      ],
      cta: 'Contact Sales',
      ctaLink: '/contact',
      popular: false,
    },
  ];

  const comparisonFeatures = [
    {
      category: 'Search & Discovery',
      features: [
        { name: 'Daily search limit', free: '20', pro: '500', enterprise: 'Unlimited' },
        { name: 'Results per search', free: '5', pro: '50', enterprise: '100' },
        { name: 'Semantic search', free: '✓', pro: '✓', enterprise: '✓' },
        { name: 'Advanced filters', free: '—', pro: '✓', enterprise: '✓' },
        { name: 'Search history', free: '7 days', pro: 'Unlimited', enterprise: 'Unlimited' },
        { name: 'Saved searches', free: '—', pro: '50', enterprise: 'Unlimited' },
        { name: 'Search alerts', free: '—', pro: '✓', enterprise: '✓' },
      ],
    },
    {
      category: 'Documents & Content',
      features: [
        { name: 'Document preview', free: '✓', pro: '✓', enterprise: '✓' },
        { name: 'Full document access', free: '—', pro: '✓', enterprise: '✓' },
        { name: 'Document viewer', free: '—', pro: '✓', enterprise: '✓' },
        { name: 'Annotations', free: '—', pro: '✓', enterprise: '✓' },
        { name: 'Highlights', free: '—', pro: '✓', enterprise: '✓' },
        { name: 'Bookmarks', free: '—', pro: '✓', enterprise: '✓' },
      ],
    },
    {
      category: 'Export & Sharing',
      features: [
        { name: 'Export to PDF', free: '—', pro: '✓', enterprise: '✓' },
        { name: 'Export to CSV', free: '—', pro: '✓', enterprise: '✓' },
        { name: 'Bulk export', free: '—', pro: '—', enterprise: '✓' },
        { name: 'Citation generation', free: '—', pro: '✓', enterprise: '✓' },
        { name: 'Shareable links', free: '—', pro: '✓', enterprise: '✓' },
      ],
    },
    {
      category: 'Analytics & Insights',
      features: [
        { name: 'Usage dashboard', free: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
        { name: 'Search analytics', free: '—', pro: '✓', enterprise: '✓' },
        { name: 'Recommendations', free: '—', pro: '✓', enterprise: '✓' },
        { name: 'Custom reports', free: '—', pro: '—', enterprise: '✓' },
      ],
    },
    {
      category: 'Integration & API',
      features: [
        { name: 'API access', free: '—', pro: '—', enterprise: '✓' },
        { name: 'MCP server access', free: '—', pro: '—', enterprise: '✓' },
        { name: 'Webhooks', free: '—', pro: '—', enterprise: '✓' },
        { name: 'Custom integrations', free: '—', pro: '—', enterprise: '✓' },
      ],
    },
    {
      category: 'Support & SLA',
      features: [
        { name: 'Email support', free: 'Community', pro: 'Standard', enterprise: 'Priority' },
        { name: 'Response time', free: '48h', pro: '24h', enterprise: '4h' },
        { name: 'Dedicated account manager', free: '—', pro: '—', enterprise: '✓' },
        { name: 'SLA guarantee', free: '—', pro: '—', enterprise: '99.9%' },
        { name: 'Custom training', free: '—', pro: '—', enterprise: '✓' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4" variant="secondary">
          Transparent Pricing
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Choose the Right Plan for Your Needs
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Start free, upgrade when you need more. All plans include access to 100,000+ 
          regulatory documents with AI-powered semantic search.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card 
                key={tier.name} 
                className={tier.popular ? 'border-primary shadow-lg scale-105' : ''}
              >
                <CardHeader>
                  {tier.badge && (
                    <Badge className="w-fit mb-2">{tier.badge}</Badge>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.period && (
                      <span className="text-muted-foreground ml-2">/ {tier.period}</span>
                    )}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={tier.ctaLink}>
                    <Button 
                      className="w-full mb-6" 
                      variant={tier.popular ? 'default' : 'outline'}
                    >
                      {tier.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">
          Detailed Feature Comparison
        </h2>
        <div className="max-w-6xl mx-auto overflow-x-auto">
          {comparisonFeatures.map((category) => (
            <div key={category.category} className="mb-12">
              <h3 className="text-xl font-semibold mb-6 px-4">{category.category}</h3>
              <div className="bg-background rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Feature</th>
                      <th className="text-center p-4 font-medium">Free</th>
                      <th className="text-center p-4 font-medium">Pro</th>
                      <th className="text-center p-4 font-medium">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.features.map((feature, idx) => (
                      <tr key={feature.name} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                        <td className="p-4">{feature.name}</td>
                        <td className="p-4 text-center">{feature.free}</td>
                        <td className="p-4 text-center">{feature.pro}</td>
                        <td className="p-4 text-center">{feature.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I change plans later?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect 
                immediately, and we'll prorate any charges.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) and 
                bank transfers for Enterprise plans.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is there a free trial for paid plans?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! Pro plans include a 14-day free trial. No credit card required to start. 
                Enterprise plans include a 30-day trial with full features.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What happens if I exceed my search limit?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You'll receive a notification when you're approaching your limit. You can 
                upgrade your plan or wait until the next day when your quota resets.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Do you offer discounts for annual billing?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! Save 20% with annual billing on Pro plans. Enterprise plans include 
                custom pricing with volume discounts available.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Absolutely. You can cancel your subscription at any time. You'll continue 
                to have access until the end of your billing period.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">
          Still Have Questions?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Our team is here to help you choose the right plan for your needs.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/contact">
            <Button size="lg">Contact Sales</Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline">Schedule Demo</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
