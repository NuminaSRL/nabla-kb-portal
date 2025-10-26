import { createClient } from '@supabase/supabase-js';
import { searchService, SearchOptions } from '../search/search-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: string;
  filters: SearchOptions;
  alert_enabled: boolean;
  alert_frequency: 'daily' | 'weekly' | 'monthly';
  last_alert_sent_at: string | null;
  last_result_count: number;
  created_at: string;
  updated_at: string;
}

export interface SearchAlert {
  id: string;
  saved_search_id: string;
  user_id: string;
  new_documents_count: number;
  alert_sent_at: string;
  email_sent: boolean;
  email_error: string | null;
  document_ids: string[];
  metadata: Record<string, any>;
}

export interface SavedSearchCreate {
  name: string;
  query: string;
  filters?: SearchOptions;
  alert_enabled?: boolean;
  alert_frequency?: 'daily' | 'weekly' | 'monthly';
}

export interface SavedSearchUpdate {
  name?: string;
  query?: string;
  filters?: SearchOptions;
  alert_enabled?: boolean;
  alert_frequency?: 'daily' | 'weekly' | 'monthly';
}

export class SavedSearchService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new saved search
   */
  async createSavedSearch(
    userId: string,
    data: SavedSearchCreate
  ): Promise<SavedSearch> {
    try {
      // Check if user can create more saved searches
      const canCreate = await this.checkSavedSearchLimit(userId);
      if (!canCreate) {
        throw new Error('Saved search limit reached for your tier');
      }

      const { data: savedSearch, error } = await this.supabase
        .from('saved_searches')
        .insert({
          user_id: userId,
          name: data.name,
          query: data.query,
          filters: data.filters || {},
          alert_enabled: data.alert_enabled || false,
          alert_frequency: data.alert_frequency || 'weekly',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create saved search:', error);
        throw new Error('Failed to create saved search');
      }

      return savedSearch;
    } catch (error) {
      console.error('Create saved search error:', error);
      throw error;
    }
  }

  /**
   * Get all saved searches for a user
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const { data, error } = await this.supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get saved searches:', error);
        throw new Error('Failed to get saved searches');
      }

      return data || [];
    } catch (error) {
      console.error('Get saved searches error:', error);
      throw error;
    }
  }

  /**
   * Get a single saved search by ID
   */
  async getSavedSearch(userId: string, searchId: string): Promise<SavedSearch | null> {
    try {
      const { data, error } = await this.supabase
        .from('saved_searches')
        .select('*')
        .eq('id', searchId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Failed to get saved search:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get saved search error:', error);
      return null;
    }
  }

  /**
   * Update a saved search
   */
  async updateSavedSearch(
    userId: string,
    searchId: string,
    updates: SavedSearchUpdate
  ): Promise<SavedSearch> {
    try {
      const { data, error } = await this.supabase
        .from('saved_searches')
        .update(updates)
        .eq('id', searchId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update saved search:', error);
        throw new Error('Failed to update saved search');
      }

      return data;
    } catch (error) {
      console.error('Update saved search error:', error);
      throw error;
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(userId: string, searchId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to delete saved search:', error);
        throw new Error('Failed to delete saved search');
      }
    } catch (error) {
      console.error('Delete saved search error:', error);
      throw error;
    }
  }

  /**
   * Execute a saved search
   */
  async executeSavedSearch(
    userId: string,
    searchId: string
  ): Promise<any> {
    try {
      const savedSearch = await this.getSavedSearch(userId, searchId);
      if (!savedSearch) {
        throw new Error('Saved search not found');
      }

      // Execute the search using the search service
      const results = await searchService.semanticSearch(
        savedSearch.query,
        savedSearch.filters
      );

      return results;
    } catch (error) {
      console.error('Execute saved search error:', error);
      throw error;
    }
  }

  /**
   * Get alerts for a saved search
   */
  async getSearchAlerts(
    userId: string,
    searchId: string,
    limit: number = 10
  ): Promise<SearchAlert[]> {
    try {
      const { data, error } = await this.supabase
        .from('search_alerts')
        .select('*')
        .eq('saved_search_id', searchId)
        .eq('user_id', userId)
        .order('alert_sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get search alerts:', error);
        throw new Error('Failed to get search alerts');
      }

      return data || [];
    } catch (error) {
      console.error('Get search alerts error:', error);
      throw error;
    }
  }

  /**
   * Get all alerts for a user
   */
  async getAllAlerts(userId: string, limit: number = 20): Promise<SearchAlert[]> {
    try {
      const { data, error } = await this.supabase
        .from('search_alerts')
        .select('*, saved_searches(name, query)')
        .eq('user_id', userId)
        .order('alert_sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get all alerts:', error);
        throw new Error('Failed to get all alerts');
      }

      return data || [];
    } catch (error) {
      console.error('Get all alerts error:', error);
      throw error;
    }
  }

  /**
   * Check if user can create more saved searches
   */
  async checkSavedSearchLimit(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('check_saved_search_limit', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Failed to check saved search limit:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Check saved search limit error:', error);
      return false;
    }
  }

  /**
   * Get saved searches count for user
   */
  async getSavedSearchesCount(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('get_saved_searches_count', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Failed to get saved searches count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Get saved searches count error:', error);
      return 0;
    }
  }

  /**
   * Get saved search limit for user's tier
   */
  async getSavedSearchLimit(userId: string): Promise<number> {
    try {
      // Get user profile to check tier
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return 0;
      }

      // Return limit based on tier
      switch (profile.tier) {
        case 'free':
          return 0;
        case 'pro':
          return 20;
        case 'enterprise':
          return -1; // Unlimited
        default:
          return 0;
      }
    } catch (error) {
      console.error('Get saved search limit error:', error);
      return 0;
    }
  }

  /**
   * Toggle alert for a saved search
   */
  async toggleAlert(
    userId: string,
    searchId: string,
    enabled: boolean
  ): Promise<SavedSearch> {
    return this.updateSavedSearch(userId, searchId, {
      alert_enabled: enabled,
    });
  }

  /**
   * Update alert frequency
   */
  async updateAlertFrequency(
    userId: string,
    searchId: string,
    frequency: 'daily' | 'weekly' | 'monthly'
  ): Promise<SavedSearch> {
    return this.updateSavedSearch(userId, searchId, {
      alert_frequency: frequency,
    });
  }
}

// Singleton instance
export const savedSearchService = new SavedSearchService();
