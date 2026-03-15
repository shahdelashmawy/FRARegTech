import React from 'react';
import { clsx } from 'clsx';
import type { RegulationType } from '../../types';

interface RegulationBadgeProps {
  type: RegulationType;
  className?: string;
}

const typeConfig: Record<RegulationType, { label: string; labelAr: string; className: string }> = {
  Law: {
    label: 'Law',
    labelAr: 'قانون',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  Decree: {
    label: 'Decree',
    labelAr: 'مرسوم',
    className: 'bg-purple-100 text-purple-800 border border-purple-200',
  },
  Circular: {
    label: 'Circular',
    labelAr: 'تعميم',
    className: 'bg-orange-100 text-orange-800 border border-orange-200',
  },
  Announcement: {
    label: 'Announcement',
    labelAr: 'إعلان',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
};

const RegulationBadge: React.FC<RegulationBadgeProps> = ({ type, className }) => {
  const config = typeConfig[type] || typeConfig.Announcement;
  const dir = document.documentElement.dir;
  const label = dir === 'rtl' ? config.labelAr : config.label;

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        config.className,
        className
      )}
    >
      {label}
    </span>
  );
};

export default RegulationBadge;
