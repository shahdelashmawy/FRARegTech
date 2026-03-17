import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Mail, MessageCircle, Trash2, FlaskConical, ToggleLeft, ToggleRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { Alert } from '../../types';
import RegulationBadge from '../regulations/RegulationBadge';

interface AlertCardProps {
  alert: Alert;
  onToggle: (id: number, active: boolean) => void;
  onDelete: (id: number) => void;
  onTest: (id: number) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onToggle, onDelete, onTest }) => {
  const { t } = useTranslation();

  return (
    <div className={clsx(
      'bg-white rounded-xl border p-5 transition-all',
      alert.is_active ? 'border-gray-200 hover:border-accent hover:shadow-sm' : 'border-gray-100 opacity-60'
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx(
            'w-9 h-9 rounded-lg flex items-center justify-center',
            alert.is_active ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-gray-400'
          )}>
            <Bell size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-primary text-sm">{alert.name}</h3>
            <span className={clsx(
              'text-xs font-medium',
              alert.is_active ? 'text-green-600' : 'text-gray-400'
            )}>
              {alert.is_active ? t('active') : t('inactive')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onTest(alert.id)}
            className="p-1.5 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
            title={t('sendTest')}
          >
            <FlaskConical size={16} />
          </button>
          <button
            onClick={() => onToggle(alert.id, !alert.is_active)}
            className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
          >
            {alert.is_active ? (
              <ToggleRight size={20} className="text-green-500" />
            ) : (
              <ToggleLeft size={20} />
            )}
          </button>
          <button
            onClick={() => onDelete(alert.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Keywords */}
      {alert.keywords && alert.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {alert.keywords.map((kw) => (
            <span key={kw} className="text-xs bg-primary/5 text-primary px-2 py-0.5 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Regulation types */}
      {alert.regulation_types && alert.regulation_types.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {alert.regulation_types.map((type) => (
            <RegulationBadge key={type} type={type} />
          ))}
        </div>
      )}

      {/* Notification methods */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Mail size={12} />
          <span>{t('emailNotification')}</span>
        </div>
        {alert.last_triggered && (
          <div className="ml-auto text-xs text-gray-400">
            {t('triggered')}: {new Date(alert.last_triggered).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
