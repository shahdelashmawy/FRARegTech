import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, ExternalLink, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import type { Regulation } from '../../types';
import RegulationBadge from './RegulationBadge';

interface RegulationCardProps {
  regulation: Regulation;
  compact?: boolean;
}

const RegulationCard: React.FC<RegulationCardProps> = ({ regulation, compact = false }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const title = isArabic ? regulation.title_ar : regulation.title_en;
  const summary = isArabic ? regulation.summary_ar : regulation.summary_en;

  const formattedDate = (() => {
    try {
      return format(new Date(regulation.published_date), isArabic ? 'dd/MM/yyyy' : 'MMM dd, yyyy');
    } catch {
      return regulation.published_date;
    }
  })();

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200 hover:border-accent hover:shadow-md transition-all',
        compact ? 'p-4' : 'p-5'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <RegulationBadge type={regulation.type} />
        <div className="flex items-center gap-1 text-gray-400 text-xs flex-shrink-0">
          <Calendar size={12} />
          <span>{formattedDate}</span>
        </div>
      </div>

      <h3 className={clsx('font-semibold text-primary mb-2 leading-snug', compact ? 'text-sm' : 'text-base')}>
        {title}
      </h3>

      {!compact && summary && (
        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{summary}</p>
      )}

      {!compact && regulation.tags && regulation.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {regulation.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {regulation.source_url ? (
          <a
            href={regulation.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} />
            {t('source')}
          </a>
        ) : (
          <span />
        )}
        <Link
          to={`/regulations/${regulation.id}`}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent transition-colors"
        >
          {t('viewDetails')}
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
};

export default RegulationCard;
