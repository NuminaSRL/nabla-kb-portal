import { createClient } from '@supabase/supabase-js';
import { recommendationService } from './recommendation-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Recommendation Scheduler
 * Runs periodically to refresh recommendations for all active users
 */
export class RecommendationScheduler {
  private supabase;
  private isRunning = false;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Refresh recommendations for all active users
   */
  async refreshAllRecommendations(): Promise<void> {
    if (this.isRunning) {
      console.log('Recommendation refresh already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting recommendation refresh for all users...');

    try {
      // Get all active users (users who have logged in within the last 30 days)
      const { data: activeUsers, error } = await this.supabase
        .from('user_profiles')
        .select('id')
        .gte('last_sign_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Failed to get active users:', error);
        return;
      }

      if (!activeUsers || activeUsers.length === 0) {
        console.log('No active users found');
        return;
      }

      console.log(`Refreshing recommendations for ${activeUsers.length} users...`);

      // Process users in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < activeUsers.length; i += batchSize) {
        const batch = activeUsers.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (user) => {
            try {
              await recommendationService.generateRecommendations(user.id, 20);
              console.log(`Generated recommendations for user ${user.id}`);
            } catch (error) {
              console.error(`Failed to generate recommendations for user ${user.id}:`, error);
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < activeUsers.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log('Recommendation refresh completed successfully');
    } catch (error) {
      console.error('Recommendation refresh failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Clean up expired recommendations
   */
  async cleanupExpiredRecommendations(): Promise<void> {
    console.log('Cleaning up expired recommendations...');

    try {
      const { error } = await this.supabase
        .from('user_recommendations')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Failed to cleanup expired recommendations:', error);
        return;
      }

      console.log('Expired recommendations cleaned up successfully');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Update user interests based on recent interactions
   */
  async updateUserInterests(): Promise<void> {
    console.log('Updating user interests...');

    try {
      // Get users with recent interactions
      const { data: recentInteractions, error } = await this.supabase
        .from('user_document_interactions')
        .select('user_id, document_id, interaction_type')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .in('interaction_type', ['view', 'bookmark', 'export']);

      if (error) {
        console.error('Failed to get recent interactions:', error);
        return;
      }

      if (!recentInteractions || recentInteractions.length === 0) {
        console.log('No recent interactions found');
        return;
      }

      // Group interactions by user
      const userInteractions = recentInteractions.reduce((acc: any, interaction) => {
        if (!acc[interaction.user_id]) {
          acc[interaction.user_id] = [];
        }
        acc[interaction.user_id].push(interaction);
        return acc;
      }, {});

      // Process each user's interactions
      for (const [userId, interactions] of Object.entries(userInteractions)) {
        try {
          // Get document embeddings for interacted documents
          const documentIds = (interactions as any[]).map((i) => i.document_id);
          const { data: documents, error: docError } = await this.supabase
            .from('documents')
            .select('id, embedding, domain')
            .in('id', documentIds)
            .not('embedding', 'is', null);

          if (docError || !documents || documents.length === 0) {
            continue;
          }

          // Calculate average embedding as interest vector
          const embeddings = documents.map((doc) => doc.embedding);
          const avgEmbedding = this.calculateAverageEmbedding(embeddings);

          // Extract domains
          const domains = [...new Set(documents.map((doc) => doc.domain).filter(Boolean))];

          // Update user interest for each domain
          for (const domain of domains) {
            await recommendationService.updateUserInterest(
              userId,
              avgEmbedding,
              domain as string
            );
          }

          console.log(`Updated interests for user ${userId}`);
        } catch (error) {
          console.error(`Failed to update interests for user ${userId}:`, error);
        }
      }

      console.log('User interests updated successfully');
    } catch (error) {
      console.error('Update user interests failed:', error);
    }
  }

  /**
   * Calculate average embedding from multiple embeddings
   */
  private calculateAverageEmbedding(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      return [];
    }

    const dimensions = embeddings[0].length;
    const avgEmbedding = new Array(dimensions).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        avgEmbedding[i] += embedding[i];
      }
    }

    for (let i = 0; i < dimensions; i++) {
      avgEmbedding[i] /= embeddings.length;
    }

    return avgEmbedding;
  }

  /**
   * Run all scheduled tasks
   */
  async runScheduledTasks(): Promise<void> {
    console.log('Running scheduled recommendation tasks...');

    try {
      // Update user interests first
      await this.updateUserInterests();

      // Then refresh recommendations
      await this.refreshAllRecommendations();

      // Finally cleanup expired recommendations
      await this.cleanupExpiredRecommendations();

      console.log('All scheduled tasks completed successfully');
    } catch (error) {
      console.error('Scheduled tasks failed:', error);
    }
  }
}

// Singleton instance
export const recommendationScheduler = new RecommendationScheduler();

// Export function for Railway cron job
export async function runRecommendationScheduler() {
  await recommendationScheduler.runScheduledTasks();
}
