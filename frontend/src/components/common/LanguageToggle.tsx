import React from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

interface LanguageToggleProps {
  className?: string;
  compact?: boolean;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ className, compact = false }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const toggle = () => {
    i18n.changeLanguage(isArabic ? 'en' : 'ar');
  };

  return (
    <button
      onClick={toggle}
      className={clsx(
        'flex items-center gap-1 px-3 py-1.5 rounded-full border border-accent text-accent',
        'hover:bg-accent hover:text-primary font-semibold text-sm transition-all',
        className
      )}
      title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      {isArabic ? 'EN' : 'عربي'}
    </button>
  );
};

export default LanguageToggle;
