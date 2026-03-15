import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Bot,
  Tag,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { getRegulation, getRelatedRegulations } from '../lib/api';
import RegulationBadge from '../components/regulations/RegulationBadge';
import RegulationCard from '../components/regulations/RegulationCard';
import { Skeleton } from '../components/common/LoadingSkeleton';

const RegulationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [langView, setLangView] = useState<'en' | 'ar'>(i18n.language as 'en' | 'ar');

  const regId = parseInt(id || '0');

  const { data: regulation, isLoading } = useQuery({
    queryKey: ['regulation', regId],
    queryFn: () => getRegulation(regId),
    enabled: !!regId,
  });

  const { data: related } = useQuery({
    queryKey: ['regulation', regId, 'related'],
    queryFn: () => getRelatedRegulations(regId),
    enabled: !!regId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!regulation) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">{t('noData')}</p>
        <button onClick={() => navigate('/regulations')} className="mt-3 text-accent font-medium">
          {t('regulations')}
        </button>
      </div>
    );
  }

  const title = langView === 'ar' ? regulation.title_ar : regulation.title_en;
  const content = langView === 'ar' ? regulation.content_ar : regulation.content_en;
  const summary = langView === 'ar' ? regulation.summary_ar : regulation.summary_en;

  const formattedDate = (() => {
    try {
      return format(new Date(regulation.published_date), 'MMMM dd, yyyy');
    } catch {
      return regulation.published_date;
    }
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => navigate('/regulations')}
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          {t('regulations')}
        </button>
        <span>/</span>
        <span className="text-primary font-medium truncate max-w-xs">{title}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <RegulationBadge type={regulation.type} />
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Calendar size={14} />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLangView('en')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                langView === 'en' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
              }`}
            >
              <Globe size={12} />
              EN
            </button>
            <button
              onClick={() => setLangView('ar')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                langView === 'ar' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
              }`}
            >
              <Globe size={12} />
              عربي
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-primary mb-4 leading-snug">{title}</h1>

        {regulation.source_url && (
          <a
            href={regulation.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-accent hover:text-accent-dark text-sm font-medium"
          >
            <ExternalLink size={14} />
            {t('source')}
          </a>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
          <h2 className="font-semibold text-primary mb-3 flex items-center gap-2">
            <div className="w-1 h-5 bg-accent rounded-full" />
            Summary
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Full content */}
      {content && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-primary mb-4">Full Text</h2>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      )}

      {/* Tags */}
      {regulation.tags && regulation.tags.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-primary mb-3 flex items-center gap-2">
            <Tag size={16} />
            {t('tags')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {regulation.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ask AI button */}
      <Link
        to={`/ai-query?regulation=${regId}`}
        className="flex items-center justify-center gap-3 w-full py-4 bg-primary hover:bg-primary-light text-white rounded-xl font-semibold transition-colors"
      >
        <Bot size={20} />
        {i18n.language === 'ar' ? 'اسأل المساعد الذكي عن هذه اللائحة' : 'Ask AI about this regulation'}
      </Link>

      {/* Related regulations */}
      {related && related.length > 0 && (
        <div>
          <h2 className="font-semibold text-primary mb-4">Related Regulations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {related.slice(0, 4).map((reg) => (
              <RegulationCard key={reg.id} regulation={reg} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegulationDetailPage;
