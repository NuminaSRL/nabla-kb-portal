'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  FileText, 
  Filter, 
  Save, 
  Download, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Play
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to NABLA KB Portal',
      description: 'Your gateway to Italian & EU regulatory compliance',
      icon: CheckCircle,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Let's Get You Started!</h3>
            <p className="text-muted-foreground mb-6">
              This quick tour will show you how to make the most of NABLA KB Portal. 
              It'll only take 2 minutes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">100,000+ Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access comprehensive Italian and EU regulatory documents across 6 compliance domains
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI-Powered Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Semantic search understands your intent, not just keywords
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get results in under 200ms with our optimized infrastructure
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Filters, saved searches, exports, annotations, and more
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: 'Semantic Search',
      description: 'Find what you need with natural language',
      icon: Search,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Search className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Search Like You Think</h3>
            <p className="text-muted-foreground">
              Our AI-powered semantic search understands context and intent
            </p>
          </div>
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Try These Example Searches:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-background rounded-lg">
                <p className="font-medium mb-1">"GDPR data breach notification requirements"</p>
                <p className="text-sm text-muted-foreground">
                  Finds relevant articles about breach notification timelines and procedures
                </p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="font-medium mb-1">"AI Act high-risk systems classification"</p>
                <p className="text-sm text-muted-foreground">
                  Discovers documents about AI system risk assessment criteria
                </p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="font-medium mb-1">"D.Lgs 231 organizational model requirements"</p>
                <p className="text-sm text-muted-foreground">
                  Locates compliance framework documentation and guidelines
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
            <Play className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium mb-1">Pro Tip:</p>
              <p className="text-sm text-muted-foreground">
                Use natural language! Instead of keywords, describe what you're looking for 
                as if you were asking a colleague.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Advanced Filters',
      description: 'Narrow down results precisely',
      icon: Filter,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Filter className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Refine Your Results</h3>
            <p className="text-muted-foreground">
              Use powerful filters to find exactly what you need
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Domain Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Filter by compliance domain:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">GDPR</Badge>
                  <Badge variant="secondary">AI Act</Badge>
                  <Badge variant="secondary">D.Lgs 231</Badge>
                  <Badge variant="secondary">Tax</Badge>
                  <Badge variant="secondary">AML</Badge>
                  <Badge variant="secondary">Contracts</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Type</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Filter by document type:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Regulation</Badge>
                  <Badge variant="outline">Guideline</Badge>
                  <Badge variant="outline">Case Law</Badge>
                  <Badge variant="outline">Opinion</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Date Range</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Filter by publication or effective date to find the most recent or 
                  historical documents
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Source</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Filter by official source like EU Official Journal, Italian Gazette, 
                  or regulatory authorities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: 'Saved Searches & Alerts',
      description: 'Never miss important updates',
      icon: Save,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Save className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Stay Updated Automatically</h3>
            <p className="text-muted-foreground">
              Save your searches and get notified of new relevant documents
            </p>
          </div>
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">How It Works:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium mb-1">Save Your Search</p>
                  <p className="text-sm text-muted-foreground">
                    After running a search, click "Save Search" to store it
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium mb-1">Set Up Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Choose how often you want to be notified (daily, weekly, or monthly)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium mb-1">Get Notified</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email alerts when new documents match your saved searches
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
            <Play className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium mb-1">Pro Tip:</p>
              <p className="text-sm text-muted-foreground">
                Save searches for topics you monitor regularly. You can have up to 50 saved 
                searches on the Pro plan.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Export & Share',
      description: 'Take your research with you',
      icon: Download,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Download className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Export Your Findings</h3>
            <p className="text-muted-foreground">
              Share results with your team or save for later
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PDF Export</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Export search results or individual documents as formatted PDFs with 
                  metadata and citations
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CSV Export</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Export search results as CSV for analysis in Excel or other tools
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Citations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate properly formatted citations in multiple styles (APA, MLA, Chicago)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shareable Links</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create shareable links to specific documents or search results
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: 'Usage Dashboard',
      description: 'Track your activity and quotas',
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <TrendingUp className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Monitor Your Usage</h3>
            <p className="text-muted-foreground">
              Keep track of your searches and optimize your workflow
            </p>
          </div>
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Your Dashboard Includes:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Quota Monitoring</p>
                  <p className="text-sm text-muted-foreground">
                    See how many searches you have left for the day
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Search History</p>
                  <p className="text-sm text-muted-foreground">
                    Review your past searches and quickly re-run them
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Top Searches</p>
                  <p className="text-sm text-muted-foreground">
                    See which topics you search for most frequently
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Usage Trends</p>
                  <p className="text-sm text-muted-foreground">
                    Visualize your search patterns over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
            <Play className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium mb-1">Pro Tip:</p>
              <p className="text-sm text-muted-foreground">
                Check your dashboard regularly to understand your usage patterns and 
                determine if you need to upgrade your plan.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "You're All Set!",
      description: 'Start exploring the knowledge base',
      icon: CheckCircle,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Ready to Get Started!</h3>
            <p className="text-muted-foreground">
              You now know the basics. Let's put them into practice!
            </p>
          </div>
          <Card className="bg-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">Quick Start Checklist:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Run your first semantic search</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Try using filters to refine results</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Save a search for future reference</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Export a document or search results</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Check your usage dashboard</span>
              </div>
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Visit our Help Center for detailed guides and tutorials
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/help" target="_blank">Visit Help Center</a>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Watch Tutorials</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Watch video tutorials to learn advanced features
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/tutorials" target="_blank">Watch Videos</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/search');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    router.push('/search');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl">{currentStepData.title}</CardTitle>
            <CardDescription className="text-lg">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {currentStepData.content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full ${
                  idx === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Start Searching' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
