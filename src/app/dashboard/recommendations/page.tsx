'use client';

import { useEffect, useState } from 'react';
import { RecommendationsList } from '@/components/recommendations/RecommendationsList';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Activity, Target } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function RecommendationsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [behaviorSummary, setBehaviorSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient(supabaseUrl, supabaseKey);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      // Fetch analytics
      const analyticsResponse = await fetch('/api/recommendations/analytics', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }

      // Fetch behavior summary
      const behaviorResponse = await fetch('/api/recommendations/behavior', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (behaviorResponse.ok) {
        const behaviorData = await behaviorResponse.json();
        setBehaviorSummary(behaviorData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Personalized Recommendations</h1>
        <p className="text-muted-foreground">
          Discover documents tailored to your interests and reading patterns
        </p>
      </div>

      {/* Analytics Cards */}
      {!loading && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.impressions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.clicks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Click-Through Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.clickThroughRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Engagement rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dismissals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.dismissals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recommendations">
            <Target className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="interests">
            <Brain className="h-4 w-4 mr-2" />
            Your Interests
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations">
          <RecommendationsList limit={12} showRefresh={true} />
        </TabsContent>

        <TabsContent value="interests">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : behaviorSummary?.interests?.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Your Interest Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {behaviorSummary.interests.map((interest: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        {interest.interest_domain || 'General Interest'}
                        <Badge variant="secondary">
                          {Math.round(interest.confidence_score * 100)}% confidence
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {interest.interest_keywords && interest.interest_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {interest.interest_keywords.map((keyword: string, i: number) => (
                            <Badge key={i} variant="outline">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Building your interest profile</h3>
              <p className="text-muted-foreground">
                Continue exploring documents to help us understand your interests
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Interaction Summary */}
              {behaviorSummary?.interactions?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your interactions in the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {behaviorSummary.interactions.map((interaction: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="capitalize">{interaction.interaction_type}</span>
                          <Badge variant="secondary">{interaction.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Search Patterns */}
              {behaviorSummary?.topSearchPatterns?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Search Patterns</CardTitle>
                    <CardDescription>Your most frequent searches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {behaviorSummary.topSearchPatterns.map((pattern: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{pattern.query}</p>
                            {pattern.domain && (
                              <Badge variant="outline" className="mt-1">
                                {pattern.domain}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {pattern.search_frequency} searches
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {behaviorSummary?.interactions?.length === 0 &&
                behaviorSummary?.topSearchPatterns?.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                    <p className="text-muted-foreground">
                      Start searching and viewing documents to see your activity here
                    </p>
                  </div>
                )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
