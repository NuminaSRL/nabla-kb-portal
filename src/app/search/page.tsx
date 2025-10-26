'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/search/SearchBar';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { SearchResults, SearchResult } from '@/components/search/SearchResults';
import { FilterPanel, FilterState, FilterPreset, FacetCounts } from '@/components/search/FilterPanel';
import { filterService } from '@/lib/search/filter-service';
import { SlidersHorizontal } from 'lucide-react';

const DEFAULT_FILTERS: FilterState = {
  domain: [],
  documentType: [],
  source: [],
  dateFrom: '',
  dateTo: '',
  minScore: 0.5,
};

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [facetCounts, setFacetCounts] = useState<FacetCounts | undefined>();
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user ID and presets on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Get user ID from auth (you'll need to implement this based on your auth setup)
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const data = await response.json();
        setUserId(data.userId);
        
        // Load user's filter presets
        const userPresets = await filterService.getPresets(data.userId);
        setPresets(userPresets);
        
        // Load default preset if exists
        const defaultPreset = await filterService.getDefaultPreset(data.userId);
        if (defaultPreset) {
          setFilters(defaultPreset.filters);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20',
        minScore: filters.minScore.toString(),
      });

      if (filters.domain.length > 0) {
        params.append('domain', filters.domain.join(','));
      }

      if (filters.documentType.length > 0) {
        params.append('type', filters.documentType.join(','));
      }

      if (filters.source.length > 0) {
        params.append('source', filters.source.join(','));
      }

      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }

      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      const response = await fetch(`/api/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);

      // Load facet counts for the current search
      const facets = await filterService.getFacetCounts(searchQuery, filters);
      setFacetCounts(facets);

      // Track filter usage analytics
      if (userId) {
        await filterService.trackFilterUsage(userId, filters, data.results?.length || 0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (query) {
      handleSearch(query);
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setFacetCounts(undefined);
  };

  const handleSavePreset = async (name: string, filterState: FilterState) => {
    if (!userId) return;

    const preset = await filterService.savePreset(userId, name, filterState);
    if (preset) {
      setPresets([...presets, preset]);
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    if (query) {
      handleSearch(query);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!userId) return;

    const success = await filterService.deletePreset(userId, presetId);
    if (success) {
      setPresets(presets.filter((p) => p.id !== presetId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Knowledge Base Search
          </h1>
          <div className="flex gap-4">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
                facetCounts={facetCounts}
                presets={presets}
                onSavePreset={handleSavePreset}
                onLoadPreset={handleLoadPreset}
                onDeletePreset={handleDeletePreset}
              />
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            <SearchResults results={results} isLoading={isLoading} query={query} />
          </div>
        </div>
      </div>
    </div>
  );
}
