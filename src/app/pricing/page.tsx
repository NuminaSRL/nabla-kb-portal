'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Check, Crown, Zap, Building } from 'lucide-react';
import { TIER_FEATURES } from '@/lib/auth/tier-service';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const tiers = [
    {
      ...TIER_FEATURES.free,
      icon: Shield,
      color: 'gray',
      popular: false,
    },
    {
      ...TIER_FEATURES.pro,
      icon: Zap,
      color: 'blue',
      popular: true,
    },
    {
      ...TIER_FEATURES.enterprise,
      icon: Building,
      color: 'purple',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">NABLA KB Portal</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/search" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
              Search
            </Link>
            <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Access comprehensive Italian & EU regulatory compliance documentation with flexible pricing
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Annual
            <span className="ml-2 text-green-600 dark:text-green-400">(Save 20%)</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const monthlyPrice = tier.price;
            const annualPrice = Math.round(tier.price * 12 * 0.8);
            const displayPrice = billingCycle === 'monthly' ? monthlyPrice : Math.round(annualPrice / 12);

            return (
              <div
                key={tier.limits.tier}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 ${
                  tier.popular ? 'ring-2 ring-blue-600 scale-105' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <Icon className={`h-12 w-12 mx-auto mb-4 text-${tier.color}-600`} />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${displayPrice}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        /{billingCycle === 'monthly' ? 'month' : 'month'}
                      </span>
                    )}
                  </div>
                  {billingCycle === 'annual' && tier.price > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Billed ${annualPrice} annually
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.limits.tier === 'free' ? '/signup' : '/signup'}
                  className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${
                    tier.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                  }`}
                >
                  {tier.limits.tier === 'free' ? 'Start Free Trial' : 'Get Started'}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Comparison */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Feature Comparison
        </h2>
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Feature
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Free
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Pro
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">Searches per day</td>
                <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white">20</td>
                <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white">500</td>
                <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white">Unlimited</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">Results per search</td>
                <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white">5</td>
                <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white">50</td>
                <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white">100</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">Advanced filters</td>
                <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">Saved searches</td>
                <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">Export to PDF/CSV</td>
                <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">API access</td>
                <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">Priority support</td>
                <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">Custom integrations</td>
                <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Can I change my plan later?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Is there a free trial?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, all new accounts start with a 14-day free trial with access to Free tier features.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We accept all major credit cards (Visa, MasterCard, American Express) and support secure payment processing through Stripe.
            </p>
          </div>
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
