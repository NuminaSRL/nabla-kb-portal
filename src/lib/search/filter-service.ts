import { createClient } from '@supabase/supabase-js';
import { FilterState, FilterPreset, FacetCounts } from '@/components/search/FilterPanel';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class FilterService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get facet counts for current search results
   */
  async getFacetCounts(
    query: string,
    currentFilters: Partial<FilterState> = {}
  ): Promise<FacetCounts> {
    try {
      // Get domain counts
      const domainQuery = this.supabase
        .from('documents')
        .select('domain', { count: 'exact' });

      // Get document type counts
      const typeQuery = this.supabase
        .from('documents')
        .select('document_type', { count: 'exact' });

      // Get source counts
      const sourceQuery = this.supabase
        .from('documents')
        .select('source', { count: 'exact' });

      // Apply existing filters (except the one we're counting)
      const applyFilters = (query: any, excludeField?: string) => {
        if (currentFilters.dateFrom && excludeField !== 'dateFrom') {
          query = query.gte('published_date', currentFilters.dateFrom);
        }
        if (currentFilters.dateTo && excludeField !== 'dateTo') {
          query = query.lte('published_date', currentFilters.dateTo);
        }
        return query;
      };

      // Execute queries
      const [domainResult, typeResult, sourceResult] = await Promise.all([
        applyFilters(domainQuery).then((q: any) => q),
        applyFilters(typeQuery).then((q: any) => q),
        applyFilters(sourceQuery).then((q: any) => q),
      ]);

      // Aggregate counts
      const domains: Record<string, number> = {};
      const documentTypes: Record<string, number> = {};
      const sources: Record<string, number> = {};

      // Count domains
      if (domainResult.data) {
        domainResult.data.forEach((item: any) => {
          domains[item.domain] = (domains[item.domain] || 0) + 1;
        });
      }

      // Count document types
      if (typeResult.data) {
        typeResult.data.forEach((item: any) => {
          documentTypes[item.document_type] = (documentTypes[item.document_type] || 0) + 1;
        });
      }

      // Count sources
      if (sourceResult.data) {
        sourceResult.data.forEach((item: any) => {
          sources[item.source] = (sources[item.source] || 0) + 1;
        });
      }

      return { domains, documentTypes, sources };
    } catch (error) {
      console.error('Failed to get facet counts:', error);
      return { domains: {}, documentTypes: {}, sources: {} };
    }
  }

  /**
   * Save filter preset for user
   */
  async savePreset(
    userId: string,
    name: string,
    filters: FilterState,
    isDefault: boolean = false
  ): Promise<FilterPreset | null> {
    try {
      // If setting as default, unset other defaults first
      if (isDefault) {
        await this.supabase
          .from('filter_presets')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data, error } = await this.supabase
        .from('filter_presets')
        .insert({
          user_id: userId,
          name,
          filters: filters as any,
          is_default: isDefault,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save preset:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        filters: data.filters as FilterState,
        isDefault: data.is_default,
      };
    } catch (error) {
      console.error('Failed to save preset:', error);
      return null;
    }
  }

  /**
   * Get user's filter presets
   */
  async getPresets(userId: string): Promise<FilterPreset[]> {
    try {
      const { data, error } = await this.supabase
        .from('filter_presets')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get presets:', error);
        return [];
      }

      return data.map((preset) => ({
        id: preset.id,
        name: preset.name,
        filters: preset.filters as FilterState,
        isDefault: preset.is_default,
      }));
    } catch (error) {
      console.error('Failed to get presets:', error);
      return [];
    }
  }

  /**
   * Delete filter preset
   */
  async deletePreset(userId: string, presetId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('filter_presets')
        .delete()
        .eq('id', presetId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to delete preset:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete preset:', error);
      return false;
    }
  }

  /**
   * Update filter preset
   */
  async updatePreset(
    userId: string,
    presetId: string,
    updates: Partial<{ name: string; filters: FilterState; isDefault: boolean }>
  ): Promise<boolean> {
    try {
      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.filters) updateData.filters = updates.filters;
      if (updates.isDefault !== undefined) {
        updateData.is_default = updates.isDefault;

        // If setting as default, unset other defaults first
        if (updates.isDefault) {
          await this.supabase
            .from('filter_presets')
            .update({ is_default: false })
            .eq('user_id', userId)
            .neq('id', presetId);
        }
      }

      const { error } = await this.supabase
        .from('filter_presets')
        .update(updateData)
        .eq('id', presetId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to update preset:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update preset:', error);
      return false;
    }
  }

  /**
   * Get default preset for user
   */
  async getDefaultPreset(userId: string): Promise<FilterPreset | null> {
    try {
      const { data, error } = await this.supabase
        .from('filter_presets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        filters: data.filters as FilterState,
        isDefault: data.is_default,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Track filter usage analytics
   */
  async trackFilterUsage(
    userId: string,
    filters: FilterState,
    resultCount: number
  ): Promise<void> {
    try {
      await this.supabase.from('filter_analytics').insert({
        user_id: userId,
        filters: filters as any,
        result_count: resultCount,
        used_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track filter usage:', error);
    }
  }

  /**
   * Get filter usage statistics
   */
  async getFilterStats(userId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('filter_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('used_at', startDate.toISOString());

      if (error || !data) {
        return null;
      }

      // Aggregate statistics
      const stats = {
        totalSearches: data.length,
        avgResultCount: data.reduce((sum, item) => sum + item.result_count, 0) / data.length,
        mostUsedDomains: this.aggregateFilterValues(data, 'domain'),
        mostUsedTypes: this.aggregateFilterValues(data, 'documentType'),
        mostUsedSources: this.aggregateFilterValues(data, 'source'),
      };

      return stats;
    } catch (error) {
      console.error('Failed to get filter stats:', error);
      return null;
    }
  }

  /**
   * Helper to aggregate filter values from analytics
   */
  private aggregateFilterValues(data: any[], filterKey: string): Record<string, number> {
    const counts: Record<string, number> = {};

    data.forEach((item) => {
      const filters = item.filters as FilterState;
      const values = filters[filterKey as keyof FilterState];

      if (Array.isArray(values)) {
        values.forEach((value) => {
          counts[value] = (counts[value] || 0) + 1;
        });
      }
    });

    // Sort by count and return top 10
    return Object.fromEntries(
      Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    );
  }

  /**
   * Get suggested filters based on query
   */
  async getSuggestedFilters(query: string): Promise<Partial<FilterState>> {
    try {
      // Simple keyword-based suggestions
      const suggestions: Partial<FilterState> = {
        domain: [],
        documentType: [],
        source: [],
      };

      const lowerQuery = query.toLowerCase();

      // Domain suggestions
      if (lowerQuery.includes('gdpr') || lowerQuery.includes('privacy') || lowerQuery.includes('data protection')) {
        suggestions.domain = ['GDPR'];
      }
      if (lowerQuery.includes('231') || lowerQuery.includes('corporate') || lowerQuery.includes('compliance')) {
        suggestions.domain = [...(suggestions.domain || []), 'D.Lgs 231'];
      }
      if (lowerQuery.includes('tax') || lowerQuery.includes('fiscal')) {
        suggestions.domain = [...(suggestions.domain || []), 'Tax'];
      }
      if (lowerQuery.includes('aml') || lowerQuery.includes('money laundering')) {
        suggestions.domain = [...(suggestions.domain || []), 'AML'];
      }
      if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence')) {
        suggestions.domain = [...(suggestions.domain || []), 'AI Act'];
      }
      if (lowerQuery.includes('contract')) {
        suggestions.domain = [...(suggestions.domain || []), 'Contract'];
      }

      // Document type suggestions
      if (lowerQuery.includes('regulation') || lowerQuery.includes('law')) {
        suggestions.documentType = ['Regulation'];
      }
      if (lowerQuery.includes('guideline') || lowerQuery.includes('guide')) {
        suggestions.documentType = [...(suggestions.documentType || []), 'Guideline'];
      }
      if (lowerQuery.includes('case') || lowerQuery.includes('court')) {
        suggestions.documentType = [...(suggestions.documentType || []), 'Case Law'];
      }

      return suggestions;
    } catch (error) {
      console.error('Failed to get suggested filters:', error);
      return {};
    }
  }
}

// Singleton instance
export const filterService = new FilterService();
