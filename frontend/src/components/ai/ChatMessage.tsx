import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bot, User, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import type { ChatMessage as ChatMessageType } from '../../types';
import RegulationBadge from '../regulations/RegulationBadge';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'flex gap-3 mb-6',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
          isUser ? 'bg-primary text-white' : 'bg-accent text-primary'
        )}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Bubble */}
      <div className={clsx('flex-1 max-w-2xl', isUser && 'flex flex-col items-end')}>
        <div
          className={clsx(
            'rounded-2xl px-4 py-3 shadow-sm',
            isUser
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 w-full">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              {t('sources')}
            </p>
            <div className="space-y-1">
              {message.sources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {source.source_url ? (
                    <a
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-dark"
                    >
                      <ExternalLink size={12} />
                      <span>{isArabic ? source.title_ar : source.title_en}</span>
                    </a>
                  ) : (
                    <Link
                      to={`/regulations/${source.regulation_id}`}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-dark"
                    >
                      <ExternalLink size={12} />
                      <span>{isArabic ? source.title_ar : source.title_en}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related regulations */}
        {!isUser && message.relevant_regulations && message.relevant_regulations.length > 0 && (
          <div className="mt-3 w-full">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              {t('relatedRegulations')}
            </p>
            <div className="space-y-2">
              {message.relevant_regulations.slice(0, 3).map((reg) => (
                <Link
                  key={reg.id}
                  to={`/regulations/${reg.id}`}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-accent transition-colors group"
                >
                  <span className="text-xs text-gray-700 group-hover:text-primary font-medium line-clamp-1">
                    {isArabic ? reg.title_ar : reg.title_en}
                  </span>
                  <RegulationBadge type={reg.type} className="flex-shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <span className="text-xs text-gray-400 mt-1 block">
          {format(message.timestamp, 'HH:mm')}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
