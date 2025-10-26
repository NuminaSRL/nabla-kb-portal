import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 3600 = 1 hour)
}

export class CacheService {
  private supabase;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Generate cache key hash from query and filters
   */
  private generateCacheKey(query: string, filters: any = {}): string {
    const cacheData = JSON.stringify({ query, filters });
    return crypto.createHash('sha256').update(cacheData).digest('hex');
  }

  /**
   * Get cached search results
   */
  async get(query: string, filters: any = {}): Promise<any | null> {
    try {
      const cacheKey = this.generateCacheKey(query, filters);

      const { data, error } = await this.supabase.rpc('get_cached_search', {
        query_hash_param: cacheKey,
        query_param: query,
        filters_param: filters,
      });

      if (error) {
        console.error('Cache get error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get from cache:', error);
      return null;
    }
  }

  /**
   * Save search results to cache
   */
  async set(
    query: string,
    results: any,
    filters: any = {},
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(query, filters);
      const ttl = options.ttl || this.defaultTTL;

      await this.supabase.rpc('save_search_cache', {
        query_hash_param: cacheKey,
        query_param: query,
        filters_param: filters,
        results_param: results,
        ttl_seconds: ttl,
      });
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }

  /**
   * Invalidate cache for a specific query
   */
  async invalidate(query: string, filters: any = {}): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(query, filters);

      await this.supabase
        .from('search_cache')
        .delete()
        .eq('query_hash', cacheKey);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Clear all expired cache entries
   */
  async clearExpired(): Promise<void> {
    try {
      await this.supabase.rpc('clean_expired_cache');
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    avgHitCount: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('search_cache')
        .select('hit_count');

      if (error) {
        console.error('Failed to get cache stats:', error);
        return { totalEntries: 0, totalHits: 0, avgHitCount: 0 };
      }

      const totalEntries = data.length;
      const totalHits = data.reduce((sum, entry) => sum + entry.hit_count, 0);
      const avgHitCount = totalEntries > 0 ? totalHits / totalEntries : 0;

      return { totalEntries, totalHits, avgHitCount };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { totalEntries: 0, totalHits: 0, avgHitCount: 0 };
    }
  }

  /**
   * Get most popular cached queries
   */
  async getPopularQueries(limit: number = 10): Promise<Array<{ query: string; hitCount: number }>> {
    try {
      const { data, error } = await this.supabase
        .from('search_cache')
        .select('query, hit_count')
        .order('hit_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get popular queries:', error);
        return [];
      }

      return data.map((item) => ({
        query: item.query,
        hitCount: item.hit_count,
      }));
    } catch (error) {
      console.error('Failed to get popular queries:', error);
      return [];
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();
