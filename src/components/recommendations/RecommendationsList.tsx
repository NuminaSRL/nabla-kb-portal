'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RecommendationCard } from './RecommendationCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Recommendation } from '@/lib/recommendations/recommendation-service';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface RecommendationsListProps {
  limit?: number;
  showRefresh?: boolean;
}

export function RecommendationsList({
  limit = 12,
  showRefresh = true,
}: RecommendationsListProps) {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient(supabaseUrl, supabaseKey);

  const fetchRecommendations = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const response = await fetch(
        `/api/recommendations?limit=${limit}&refresh=${refresh}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleDismiss = async (recommendationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      // Track dismissal
      await fetch('/api/recommendations/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recommendationId,
          metricType: 'dismiss',
        }),
      });

      // Remove from UI
      setRecommendations((prev) =>
        prev.filter((rec) => rec.id !== recommendationId)
      );
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
    }
  };

  const handleClick = async (recommendationId: string, documentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      // Track click
      await fetch('/api/recommendations/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recommendationId,
          metricType: 'click',
        }),
      });

      // Navigate to document
      router.push(`/documents/${documentId}`);
    } catch (error) {
      console.error('Failed to track click:', error);
      // Still navigate even if tracking fails
      router.push(`/documents/${documentId}`);
    }
  };

  const handleRefresh = () => {
    fetchRecommendations(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
        <p className="text-muted-foreground mb-4">
          Start exploring documents to get personalized recommendations
        </p>
        {showRefresh && (
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Generate Recommendations
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {showRefresh && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Recommended for You
          </h2>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onDismiss={handleDismiss}
            onClick={handleClick}
          />
        ))}
      </div>
    </div>
  );
}
