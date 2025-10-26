import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface DocumentInteraction {
  documentId: string;
  interactionType: 'view' | 'bookmark' | 'export' | 'annotate' | 'cite';
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SearchPattern {
  query: string;
  domain?: string;
  documentType?: string;
  relevanceScore?: number;
}

export interface UserInterest {
  id: string;
  interestVector: number[];
  interestDomain?: string;
  interestKeywords?: string[];
  confidenceScore: number;
  interactionCount: number;
}

export interface Recommendation {
  id: string;
  documentId: string;
  recommendationType: 'interest_based' | 'behavior_based' | 'trending' | 'similar_users';
  relevanceScore: number;
  reasoning: string;
  metadata?: Record<string, any>;
  document?: any;
}

export interface RecommendationMetric {
  recommendationId: string;
  metricType: 'impression' | 'click' | 'dismiss' | 'engagement';
  metricValue?: number;
}

export class RecommendationService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Track a document interaction
   */
  async trackDocumentInteraction(
    userId: string,
    interaction: DocumentInteraction
  ): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('track_document_interaction', {
        p_user_id: userId,
        p_document_id: interaction.documentId,
        p_interaction_type: interaction.interactionType,
        p_duration: interaction.duration || null,
        p_metadata: interaction.metadata || {},
      });

      if (error) {
        console.error('Failed to track document interaction:', error);
        throw new Error('Failed to track document interaction');
      }
    } catch (error) {
      console.error('Track document interaction error:', error);
      throw error;
    }
  }

  /**
   * Update search pattern
   */
  async updateSearchPattern(
    userId: string,
    pattern: SearchPattern
  ): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('update_search_pattern', {
        p_user_id: userId,
        p_query: pattern.query,
        p_domain: pattern.domain || null,
        p_document_type: pattern.documentType || null,
        p_relevance_score: pattern.relevanceScore || null,
      });

      if (error) {
        console.error('Failed to update search pattern:', error);
        throw new Error('Failed to update search pattern');
      }
    } catch (error) {
      console.error('Update search pattern error:', error);
      throw error;
    }
  }

  /**
   * Update user interest
   */
  async updateUserInterest(
    userId: string,
    interestVector: number[],
    domain?: string,
    keywords?: string[]
  ): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('update_user_interest', {
        p_user_id: userId,
        p_interest_vector: `[${interestVector.join(',')}]`,
        p_domain: domain || null,
        p_keywords: keywords || null,
      });

      if (error) {
        console.error('Failed to update user interest:', error);
        throw new Error('Failed to update user interest');
      }
    } catch (error) {
      console.error('Update user interest error:', error);
      throw error;
    }
  }

  /**
   * Get user interests
   */
  async getUserInterests(userId: string): Promise<UserInterest[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', userId)
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to get user interests:', error);
        throw new Error('Failed to get user interests');
      }

      return (data || []).map((interest) => ({
        id: interest.id,
        interestVector: interest.interest_vector,
        interestDomain: interest.interest_domain,
        interestKeywords: interest.interest_keywords,
        confidenceScore: interest.confidence_score,
        interactionCount: interest.interaction_count,
      }));
    } catch (error) {
      console.error('Get user interests error:', error);
      throw error;
    }
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<Recommendation[]> {
    try {
      // Generate interest-based recommendations
      const { data: interestRecs, error: interestError } = await this.supabase.rpc(
        'generate_interest_recommendations',
        {
          p_user_id: userId,
          p_limit: Math.floor(limit * 0.5), // 50% interest-based
        }
      );

      if (interestError) {
        console.error('Failed to generate interest recommendations:', interestError);
      }

      // Generate behavior-based recommendations
      const { data: behaviorRecs, error: behaviorError } = await this.supabase.rpc(
        'generate_behavior_recommendations',
        {
          p_user_id: userId,
          p_limit: Math.floor(limit * 0.3), // 30% behavior-based
        }
      );

      if (behaviorError) {
        console.error('Failed to generate behavior recommendations:', behaviorError);
      }

      // Get trending documents
      const { data: trendingRecs, error: trendingError } = await this.supabase.rpc(
        'get_trending_documents',
        {
          p_limit: Math.floor(limit * 0.2), // 20% trending
        }
      );

      if (trendingError) {
        console.error('Failed to get trending documents:', trendingError);
      }

      // Combine all recommendations
      const allRecommendations = [
        ...(interestRecs || []).map((rec: any) => ({
          ...rec,
          recommendation_type: 'interest_based',
        })),
        ...(behaviorRecs || []).map((rec: any) => ({
          ...rec,
          recommendation_type: 'behavior_based',
        })),
        ...(trendingRecs || []).map((rec: any) => ({
          ...rec,
          recommendation_type: 'trending',
        })),
      ];

      // Save recommendations to database
      if (allRecommendations.length > 0) {
        const recommendationsToSave = allRecommendations.map((rec) => ({
          document_id: rec.document_id,
          recommendation_type: rec.recommendation_type,
          relevance_score: rec.relevance_score,
          reasoning: rec.reasoning,
          metadata: {},
        }));

        await this.supabase.rpc('save_recommendations', {
          p_user_id: userId,
          p_recommendations: recommendationsToSave,
        });
      }

      return allRecommendations;
    } catch (error) {
      console.error('Generate recommendations error:', error);
      throw error;
    }
  }

  /**
   * Get saved recommendations for a user
   */
  async getRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<Recommendation[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_recommendations')
        .select('*, documents(*)')
        .eq('user_id', userId)
        .is('dismissed_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('relevance_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get recommendations:', error);
        throw new Error('Failed to get recommendations');
      }

      return (data || []).map((rec) => ({
        id: rec.id,
        documentId: rec.document_id,
        recommendationType: rec.recommendation_type,
        relevanceScore: rec.relevance_score,
        reasoning: rec.reasoning,
        metadata: rec.metadata,
        document: rec.documents,
      }));
    } catch (error) {
      console.error('Get recommendations error:', error);
      throw error;
    }
  }

  /**
   * Track recommendation metric
   */
  async trackRecommendationMetric(
    userId: string,
    metric: RecommendationMetric
  ): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('track_recommendation_metric', {
        p_user_id: userId,
        p_recommendation_id: metric.recommendationId,
        p_metric_type: metric.metricType,
        p_metric_value: metric.metricValue || null,
      });

      if (error) {
        console.error('Failed to track recommendation metric:', error);
        throw new Error('Failed to track recommendation metric');
      }
    } catch (error) {
      console.error('Track recommendation metric error:', error);
      throw error;
    }
  }

  /**
   * Dismiss a recommendation
   */
  async dismissRecommendation(
    userId: string,
    recommendationId: string
  ): Promise<void> {
    try {
      await this.trackRecommendationMetric(userId, {
        recommendationId,
        metricType: 'dismiss',
      });
    } catch (error) {
      console.error('Dismiss recommendation error:', error);
      throw error;
    }
  }

  /**
   * Get recommendation analytics
   */
  async getRecommendationAnalytics(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('recommendation_metrics')
        .select('metric_type, COUNT(*) as count')
        .eq('user_id', userId)
        .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        // .group('metric_type'); // TODO: Fix grouping query

      if (error) {
        console.error('Failed to get recommendation analytics:', error);
        return {
          impressions: 0,
          clicks: 0,
          dismissals: 0,
          clickThroughRate: 0,
        };
      }

      const metrics = (data || []).reduce((acc: any, item: any) => {
        acc[item.metric_type] = parseInt(item.count);
        return acc;
      }, {});

      const impressions = metrics.impression || 0;
      const clicks = metrics.click || 0;
      const dismissals = metrics.dismiss || 0;

      return {
        impressions,
        clicks,
        dismissals,
        clickThroughRate: impressions > 0 ? (clicks / impressions) * 100 : 0,
      };
    } catch (error) {
      console.error('Get recommendation analytics error:', error);
      return {
        impressions: 0,
        clicks: 0,
        dismissals: 0,
        clickThroughRate: 0,
      };
    }
  }

  /**
   * Get user behavior summary
   */
  async getUserBehaviorSummary(userId: string): Promise<any> {
    try {
      // Get interaction counts by type
      const { data: interactions, error: interactionsError } = await this.supabase
        .from('user_document_interactions')
        .select('interaction_type, COUNT(*) as count')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        // .group('interaction_type'); // TODO: Fix grouping query

      if (interactionsError) {
        console.error('Failed to get interactions:', interactionsError);
      }

      // Get top search patterns
      const { data: patterns, error: patternsError } = await this.supabase
        .from('user_search_patterns')
        .select('query, domain, search_frequency')
        .eq('user_id', userId)
        .order('search_frequency', { ascending: false })
        .limit(5);

      if (patternsError) {
        console.error('Failed to get search patterns:', patternsError);
      }

      // Get interests
      const { data: interests, error: interestsError } = await this.supabase
        .from('user_interests')
        .select('interest_domain, interest_keywords, confidence_score')
        .eq('user_id', userId)
        .order('confidence_score', { ascending: false })
        .limit(5);

      if (interestsError) {
        console.error('Failed to get interests:', interestsError);
      }

      return {
        interactions: interactions || [],
        topSearchPatterns: patterns || [],
        interests: interests || [],
      };
    } catch (error) {
      console.error('Get user behavior summary error:', error);
      return {
        interactions: [],
        topSearchPatterns: [],
        interests: [],
      };
    }
  }
}

// Singleton instance
export const recommendationService = new RecommendationService();
