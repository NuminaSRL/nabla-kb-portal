'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink, Sparkles, TrendingUp, Users, Brain } from 'lucide-react';
import { Recommendation } from '@/lib/recommendations/recommendation-service';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onDismiss?: (id: string) => void;
  onClick?: (id: string, documentId: string) => void;
}

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case 'interest_based':
      return <Brain className="h-4 w-4" />;
    case 'behavior_based':
      return <Sparkles className="h-4 w-4" />;
    case 'trending':
      return <TrendingUp className="h-4 w-4" />;
    case 'similar_users':
      return <Users className="h-4 w-4" />;
    default:
      return <Sparkles className="h-4 w-4" />;
  }
};

const getRecommendationLabel = (type: string) => {
  switch (type) {
    case 'interest_based':
      return 'For You';
    case 'behavior_based':
      return 'Similar Content';
    case 'trending':
      return 'Trending';
    case 'similar_users':
      return 'Popular';
    default:
      return 'Recommended';
  }
};

export function RecommendationCard({
  recommendation,
  onDismiss,
  onClick,
}: RecommendationCardProps) {
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissing(true);
    if (onDismiss) {
      await onDismiss(recommendation.id);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(recommendation.id, recommendation.documentId);
    }
  };

  if (isDismissing) {
    return null;
  }

  const document = recommendation.document;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer relative group">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader onClick={handleClick}>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            {getRecommendationIcon(recommendation.recommendationType)}
            <span className="text-xs">{getRecommendationLabel(recommendation.recommendationType)}</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            {Math.round(recommendation.relevanceScore * 100)}% match
          </Badge>
        </div>

        <CardTitle className="text-lg line-clamp-2">
          {document?.title || 'Document'}
        </CardTitle>

        <CardDescription className="line-clamp-2">
          {document?.description || recommendation.reasoning}
        </CardDescription>
      </CardHeader>

      <CardContent onClick={handleClick}>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {document?.domain && (
              <Badge variant="outline" className="text-xs">
                {document.domain}
              </Badge>
            )}
            {document?.document_type && (
              <Badge variant="outline" className="text-xs">
                {document.document_type}
              </Badge>
            )}
          </div>

          <Button variant="ghost" size="sm" className="gap-1">
            View
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2 italic">
          {recommendation.reasoning}
        </p>
      </CardContent>
    </Card>
  );
}
