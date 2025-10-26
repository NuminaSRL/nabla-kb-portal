import { createClient } from '@supabase/supabase-js';
import { embeddingService } from './embedding-service';
import { cacheService } from './cache-service';
import { SearchResult } from '@/components/search/SearchResults';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface SearchOptions {
  limit?: number;
  offset?: number;
  domainFilter?: string[];
  documentTypeFilter?: string[];
  sourceFilter?: string[];
  dateFrom?: string;
  dateTo?: string;
  minRelevanceScore?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  processingTime: number;
}

export class SearchService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Perform semantic search using pgvector similarity
   */
  async semanticSearch(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cachedResult = await cacheService.get(query, options);
      if (cachedResult) {
        console.log('Cache hit for query:', query);
        return {
          ...cachedResult,
          processingTime: Date.now() - startTime,
        };
      }

      // Generate embedding for query
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Build the search query
      let searchQuery = this.supabase.rpc('search_documents_semantic', {
        query_embedding: queryEmbedding,
        match_threshold: options.minRelevanceScore || 0.5,
        match_count: options.limit || 20,
      });

      // Apply filters
      if (options.domainFilter && options.domainFilter.length > 0) {
        searchQuery = searchQuery.in('domain', options.domainFilter);
      }

      if (options.documentTypeFilter && options.documentTypeFilter.length > 0) {
        searchQuery = searchQuery.in('document_type', options.documentTypeFilter);
      }

      if (options.sourceFilter && options.sourceFilter.length > 0) {
        searchQuery = searchQuery.in('source', options.sourceFilter);
      }

      if (options.dateFrom) {
        searchQuery = searchQuery.gte('published_date', options.dateFrom);
      }

      if (options.dateTo) {
        searchQuery = searchQuery.lte('published_date', options.dateTo);
      }

      // Execute search
      const { data, error } = await searchQuery;

      if (error) {
        console.error('Search error:', error);
        throw new Error('Failed to execute search');
      }

      const processingTime = Date.now() - startTime;

      const response = {
        results: data || [],
        total: data?.length || 0,
        query,
        processingTime,
      };

      // Cache the result (TTL: 1 hour for popular queries)
      await cacheService.set(query, response, options, { ttl: 3600 });

      return response;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on query
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      // Get suggestions from search history
      const { data: historyData } = await this.supabase
        .from('search_history')
        .select('query')
        .ilike('query', `${query}%`)
        .order('search_count', { ascending: false })
        .limit(limit);

      const historySuggestions = historyData?.map((item) => item.query) || [];

      // Get suggestions from popular searches
      const { data: popularData } = await this.supabase
        .from('popular_searches')
        .select('query')
        .ilike('query', `%${query}%`)
        .order('frequency', { ascending: false })
        .limit(limit);

      const popularSuggestions = popularData?.map((item) => item.query) || [];

      // Combine and deduplicate
      const allSuggestions = [...new Set([...historySuggestions, ...popularSuggestions])];

      return allSuggestions.slice(0, limit);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Save search to history
   */
  async saveSearchHistory(userId: string, query: string): Promise<void> {
    try {
      await this.supabase.from('search_history').insert({
        user_id: userId,
        query,
        searched_at: new Date().toISOString(),
      });

      // Update search count
      await this.supabase.rpc('increment_search_count', {
        search_query: query,
      });
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * Get recent searches for a user
   */
  async getRecentSearches(userId: string, limit: number = 10): Promise<string[]> {
    try {
      const { data } = await this.supabase
        .from('search_history')
        .select('query')
        .eq('user_id', userId)
        .order('searched_at', { ascending: false })
        .limit(limit);

      return data?.map((item) => item.query) || [];
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<SearchResult | null> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Failed to get document:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get document:', error);
      return null;
    }
  }
}

// Singleton instance
export const searchService = new SearchService();
