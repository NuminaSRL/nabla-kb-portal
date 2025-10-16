import Link from "next/link";
import { Search, BookOpen, Shield, Scale, FileText, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">NABLA KB Portal</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/search" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
              Search
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
              Pricing
            </Link>
            <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Italian & EU Regulatory Compliance
          <br />
          <span className="text-blue-600">Knowledge Base</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Direct access to comprehensive regulatory documents with semantic search powered by AI.
          Search GDPR, AI Act, D.Lgs 231, Tax, AML, and Contract Law instantly.
        </p>
        <div className="flex justify-center space-x-4">
          <Link 
            href="/search" 
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold flex items-center space-x-2"
          >
            <Search className="h-5 w-5" />
            <span>Start Searching</span>
          </Link>
          <Link 
            href="/pricing" 
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 text-lg font-semibold"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Comprehensive Regulatory Coverage
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Shield className="h-12 w-12 text-blue-600" />}
            title="GDPR & Privacy"
            description="Complete GDPR documentation, privacy regulations, and data protection guidelines"
          />
          <FeatureCard
            icon={<Scale className="h-12 w-12 text-blue-600" />}
            title="AI Act & Compliance"
            description="EU AI Act regulations, risk classifications, and compliance requirements"
          />
          <FeatureCard
            icon={<FileText className="h-12 w-12 text-blue-600" />}
            title="D.Lgs 231/2001"
            description="Italian corporate compliance, organizational models, and liability frameworks"
          />
          <FeatureCard
            icon={<TrendingUp className="h-12 w-12 text-blue-600" />}
            title="Tax Compliance"
            description="Italian tax regulations, AdE circulars, and compliance guidelines"
          />
          <FeatureCard
            icon={<BookOpen className="h-12 w-12 text-blue-600" />}
            title="AML Regulations"
            description="Anti-money laundering regulations, transaction monitoring, and compliance"
          />
          <FeatureCard
            icon={<FileText className="h-12 w-12 text-blue-600" />}
            title="Contract Law"
            description="Italian contract law, civil code provisions, and legal frameworks"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Access 100,000+ regulatory documents with semantic search
          </p>
          <Link 
            href="/search" 
            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 text-lg font-semibold inline-block"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 NABLA KB Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
