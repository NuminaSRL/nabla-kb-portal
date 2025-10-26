'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, X } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptData {
  id: string;
  prompt_type: string;
  quota_type: string;
  current_tier: string;
  suggested_tier: string;
  shown_at: string;
  metadata?: Record<string, any>;
}

export function UpgradePrompt() {
  const [prompt, setPrompt] = useState<UpgradePromptData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchUpgradePrompts();
  }, []);

  const fetchUpgradePrompts = async () => {
    try {
      const response = await fetch('/api/quota/prompts');
      const result = await response.json();

      if (result.success && result.data.prompts.length > 0) {
        // Show the most recent prompt
        const latestPrompt = result.data.prompts[0];
        setPrompt(latestPrompt);
        setOpen(true);
      }
    } catch (err) {
      console.error('Error fetching upgrade prompts:', err);
    }
  };

  const dismissPrompt = async () => {
    if (!prompt) return;

    try {
      await fetch('/api/quota/prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: prompt.id,
          action: 'dismiss',
        }),
      });

      setOpen(false);
      setPrompt(null);
    } catch (err) {
      console.error('Error dismissing prompt:', err);
    }
  };

  const handleUpgrade = async () => {
    if (!prompt) return;

    try {
      await fetch('/api/quota/prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: prompt.id,
          action: 'convert',
        }),
      });

      // Redirect to pricing page
      window.location.href = '/pricing';
    } catch (err) {
      console.error('Error marking conversion:', err);
      // Still redirect even if tracking fails
      window.location.href = '/pricing';
    }
  };

  if (!prompt) return null;

  const getTierFeatures = (tier: string) => {
    switch (tier) {
      case 'pro':
        return {
          name: 'Pro',
          price: '$49/month',
          features: [
            '500 searches per day',
            '50 results per search',
            'Advanced filters',
            'Saved searches',
            'Export to PDF/CSV',
            'Email support',
          ],
        };
      case 'enterprise':
        return {
          name: 'Enterprise',
          price: '$299/month',
          features: [
            'Unlimited searches',
            '100 results per search',
            'All advanced filters',
            'API access',
            'Priority support',
            'Custom integrations',
            'SLA guarantee',
          ],
        };
      default:
        return null;
    }
  };

  const suggestedTierInfo = getTierFeatures(prompt.suggested_tier);

  if (!suggestedTierInfo) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Upgrade to {suggestedTierInfo.name}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={dismissPrompt}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            You've reached your {prompt.quota_type} limit for today. Upgrade to continue with higher limits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current vs Suggested Tier */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <Badge variant="outline">{prompt.current_tier.toUpperCase()}</Badge>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div>
              <p className="text-sm text-gray-500">Suggested Plan</p>
              <Badge className="bg-blue-600">{suggestedTierInfo.name.toUpperCase()}</Badge>
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center py-2">
            <p className="text-3xl font-bold">{suggestedTierInfo.price}</p>
            <p className="text-sm text-gray-500">Billed monthly</p>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium">What you'll get:</p>
            <ul className="space-y-2">
              {suggestedTierInfo.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={dismissPrompt} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="w-full sm:w-auto">
            <Zap className="mr-2 h-4 w-4" />
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

