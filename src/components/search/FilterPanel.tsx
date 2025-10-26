'use client';

import { useState, useEffect } from 'react';
import { Filter, X, Save, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterState {
  domain: string[];
  documentType: string[];
  source: string[];
  dateFrom: string;
  dateTo: string;
  minScore: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  isDefault?: boolean;
}

export interface FacetCounts {
  domains: Record<string, number>;
  documentTypes: Record<string, number>;
  sources: Record<string, number>;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  facetCounts?: FacetCounts;
  presets?: FilterPreset[];
  onSavePreset?: (name: string, filters: FilterState) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
  onDeletePreset?: (presetId: string) => void;
}

const DOMAINS = ['GDPR', 'D.Lgs 231', 'Tax', 'AML', 'AI Act', 'Contract'];
const DOCUMENT_TYPES = ['Regulation', 'Guideline', 'Case Law', 'Opinion', 'Directive', 'Standard'];
const SOURCES = ['EUR-Lex', 'Gazzetta Ufficiale', 'EDPB', 'Italian Parliament', 'EU Commission', 'Court Decisions'];

export function FilterPanel({
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  facetCounts,
  presets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    domain: true,
    documentType: true,
    source: false,
    date: false,
    relevance: false,
    presets: false,
  });
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleArrayFilter = (filterKey: 'domain' | 'documentType' | 'source', value: string) => {
    const currentValues = filters[filterKey];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFilterChange({
      ...filters,
      [filterKey]: newValues,
    });
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  const hasActiveFilters = () => {
    return (
      filters.domain.length > 0 ||
      filters.documentType.length > 0 ||
      filters.source.length > 0 ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.minScore > 0.5
    );
  };

  const FilterSection = ({
    title,
    sectionKey,
    children,
  }: {
    title: string;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
  }) => (
    <div className="mb-4 border-b border-gray-200 pb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left mb-2"
      >
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {expandedSections[sectionKey] && <div className="mt-2">{children}</div>}
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h2>
        {hasActiveFilters() && (
          <button
            onClick={onResetFilters}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter Presets */}
      {presets.length > 0 && (
        <FilterSection title="Saved Filters" sectionKey="presets">
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                <button
                  onClick={() => onLoadPreset?.(preset)}
                  className="flex-1 text-left text-sm text-gray-700 hover:text-gray-900"
                >
                  <Clock className="h-3 w-3 inline mr-1" />
                  {preset.name}
                  {preset.isDefault && (
                    <span className="ml-2 text-xs text-blue-600">(Default)</span>
                  )}
                </button>
                {!preset.isDefault && (
                  <button
                    onClick={() => onDeletePreset?.(preset.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Domain Filter */}
      <FilterSection title="Domain" sectionKey="domain">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {DOMAINS.map((domain) => {
            const count = facetCounts?.domains[domain] || 0;
            return (
              <label
                key={domain}
                className="flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.domain.includes(domain)}
                    onChange={() => toggleArrayFilter('domain', domain)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{domain}</span>
                </div>
                {facetCounts && (
                  <span className="text-xs text-gray-400">({count})</span>
                )}
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Document Type Filter */}
      <FilterSection title="Document Type" sectionKey="documentType">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {DOCUMENT_TYPES.map((type) => {
            const count = facetCounts?.documentTypes[type] || 0;
            return (
              <label
                key={type}
                className="flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.documentType.includes(type)}
                    onChange={() => toggleArrayFilter('documentType', type)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{type}</span>
                </div>
                {facetCounts && (
                  <span className="text-xs text-gray-400">({count})</span>
                )}
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Source Filter */}
      <FilterSection title="Source" sectionKey="source">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {SOURCES.map((source) => {
            const count = facetCounts?.sources[source] || 0;
            return (
              <label
                key={source}
                className="flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.source.includes(source)}
                    onChange={() => toggleArrayFilter('source', source)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{source}</span>
                </div>
                {facetCounts && (
                  <span className="text-xs text-gray-400">({count})</span>
                )}
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Date Range Filter */}
      <FilterSection title="Date Range" sectionKey="date">
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </FilterSection>

      {/* Relevance Score Filter */}
      <FilterSection title="Minimum Relevance" sectionKey="relevance">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {Math.round(filters.minScore * 100)}%
            </span>
            <span className="text-xs text-gray-400">
              {filters.minScore === 0.5 ? 'Default' : 'Custom'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={filters.minScore}
            onChange={(e) => updateFilter('minScore', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </FilterSection>

      {/* Action Buttons */}
      <div className="space-y-2 mt-6">
        <button
          onClick={onApplyFilters}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Apply Filters
        </button>

        {onSavePreset && (
          <>
            {!showSavePreset ? (
              <button
                onClick={() => setShowSavePreset(true)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save as Preset
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSavePreset()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePreset}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowSavePreset(false);
                      setPresetName('');
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-1">
            {filters.domain.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
              >
                {d}
                <button
                  onClick={() => toggleArrayFilter('domain', d)}
                  className="hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.documentType.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded"
              >
                {t}
                <button
                  onClick={() => toggleArrayFilter('documentType', t)}
                  className="hover:text-green-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.source.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded"
              >
                {s}
                <button
                  onClick={() => toggleArrayFilter('source', s)}
                  className="hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
