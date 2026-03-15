import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search, ExternalLink, Calendar, ChevronLeft, ChevronRight, Zap, AlignLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { searchRegulations } from '../lib/api';
import type { RegulationType } from '../types';
import RegulationBadge from '../components/regulations/RegulationBadge';
import SearchBar from '../components/search/SearchBar';
import { CardSkeleton } from '../components/common/LoadingSkeleton';

const TYPES: RegulationType[] = ['Law', 'Decree', 'Circular', 'Announcement'];

const SearchPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [mode, setMode] = useState<'text' | 'semantic'>('text');
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', query, mode, selectedType, dateFrom, dateTo, page],
    queryFn: () =>
      searchRegulations({
        q: query,
        mode,
        type: selectedType || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        language: isArabic ? 'ar' : 'en',
        page,
        size: 10,
      }),
    enabled: !!query,
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  const handleSearch = (q: string) => {
    setQuery(q);
    setPage(1);
    setSearchParams({ q });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-4">{t('searchRegulations')}</h1>

        {/* Search input */}
        <SearchBar
          onSearch={handleSearch}
          initialValue={query}
          size="lg"
        />
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{t('searchMode')}:</span>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('text')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              mode === 'text' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <AlignLeft size={14} />
            {t('textSearch')}
          </button>
          <button
            onClick={() => setMode('semantic')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              mode === 'semantic' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Zap size={14} />
            {t('semanticSearch')}
          </button>
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-1 ml-4 flex-wrap">
          {['', ...TYPES].map((type) => (
            <button
              key={type || 'all'}
              onClick={() => { setSelectedType(type); setPage(1); }}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                selectedType === type
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-accent'
              )}
            >
              {type === '' ? t('allTypes') : t(type.toLowerCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {!query ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Search size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {isArabic ? 'أدخل كلمة بحث للبدء' : 'Enter a search term to begin'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {isArabic ? 'ابحث في اللوائح والقوانين والمراسيم' : 'Search regulations, laws, and decrees'}
          </p>
        </div>
      ) : isLoading || isFetching ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <p className="text-sm text-gray-500">
            {data.total} {t('resultsFor')} "<span className="font-medium text-primary">{query}</span>"
          </p>

          <div className="space-y-3">
            {data.items.map((result) => {
              const title = isArabic ? result.title_ar : result.title_en;
              const snippet = result.snippet || (isArabic ? result.summary_ar : result.summary_en);
              const formattedDate = (() => {
                try {
                  return format(new Date(result.published_date), 'MMM dd, yyyy');
                } catch {
                  return result.published_date;
                }
              })();

              return (
                <div
                  key={result.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-accent hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <RegulationBadge type={result.type} />
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={12} />
                        {formattedDate}
                      </span>
                    </div>
                    {result.source_url && (
                      <a
                        href={result.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-accent hover:text-accent-dark flex-shrink-0"
                      >
                        <ExternalLink size={12} />
                        {t('source')}
                      </a>
                    )}
                  </div>

                  <Link
                    to={`/regulations/${result.id}`}
                    className="text-base font-semibold text-primary hover:text-accent transition-colors block mb-2"
                  >
                    {title}
                  </Link>

                  {snippet && (
                    <p className="text-sm text-gray-600 line-clamp-2">{snippet}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:border-accent transition-colors"
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
                className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:border-accent transition-colors"
              >
                {t('next')}
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Search size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t('noResults')}</p>
          <p className="text-gray-400 text-sm mt-1">
            {isArabic ? 'حاول البحث بكلمات مختلفة' : 'Try different search terms'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
