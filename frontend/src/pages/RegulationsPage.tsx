import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Filter, SlidersHorizontal, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { getRegulations } from '../lib/api';
import type { RegulationType } from '../types';
import RegulationCard from '../components/regulations/RegulationCard';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import SearchBar from '../components/search/SearchBar';

const TYPES: RegulationType[] = ['Law', 'Decree', 'Circular', 'Announcement'];

const RegulationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'relevance'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['regulations', page, selectedType, dateFrom, dateTo, sort, searchQuery],
    queryFn: () =>
      getRegulations({
        page,
        size: 12,
        type: selectedType || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort,
      }),
  });

  const typeLabels: Record<string, string> = {
    Law: t('law'),
    Decree: t('decree'),
    Circular: t('circular'),
    Announcement: t('announcement'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{t('regulations')}</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all',
            showFilters
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-200 hover:border-accent'
          )}
        >
          <SlidersHorizontal size={16} />
          {t('filters')}
        </button>
      </div>

      {/* Search */}
      <SearchBar
        onSearch={(q) => { setSearchQuery(q); setPage(1); }}
        initialValue={searchQuery}
      />

      <div className="flex gap-6">
        {/* Filter sidebar */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                <Filter size={16} />
                {t('filterBy')}
              </h3>

              {/* Type filter */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('regulationType')}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={selectedType === ''}
                      onChange={() => { setSelectedType(''); setPage(1); }}
                      className="text-accent"
                    />
                    <span className="text-sm text-gray-600">{t('allTypes')}</span>
                  </label>
                  {TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        checked={selectedType === type}
                        onChange={() => { setSelectedType(type); setPage(1); }}
                        className="text-accent"
                      />
                      <span className="text-sm text-gray-600">{typeLabels[type]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dateRange')}
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">{t('from')}</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                      className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t('to')}</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                      className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('sortBy')}
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="newest">{t('newest')}</option>
                  <option value="oldest">{t('oldest')}</option>
                  <option value="relevance">{t('relevance')}</option>
                </select>
              </div>

              {/* Reset */}
              {(selectedType || dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setSelectedType('');
                    setDateFrom('');
                    setDateTo('');
                    setPage(1);
                  }}
                  className="w-full mt-4 text-sm text-red-500 hover:text-red-700 text-center"
                >
                  Clear filters
                </button>
              )}
            </div>
          </aside>
        )}

        {/* Results */}
        <div className="flex-1">
          {/* Results count */}
          {!isLoading && data && (
            <p className="text-sm text-gray-500 mb-4">
              {data.total} {t('regulations')}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-red-500">{t('error')}</p>
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.items.map((reg) => (
                  <RegulationCard key={reg.id} regulation={reg} />
                ))}
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-accent transition-colors"
                  >
                    <ChevronLeft size={16} />
                    {t('previous')}
                  </button>
                  <span className="text-sm text-gray-500">
                    {t('page')} {page} {t('of')} {data.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-accent transition-colors"
                  >
                    {t('next')}
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t('noRegulations')}</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegulationsPage;
