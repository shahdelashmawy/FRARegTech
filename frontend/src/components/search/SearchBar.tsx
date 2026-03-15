import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  navigateToSearch?: boolean;
  initialValue?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  onSearch,
  navigateToSearch = false,
  initialValue = '',
  className,
  size = 'md',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (navigateToSearch) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else if (onSearch) {
      onSearch(query.trim());
    }
  };

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-14 text-lg',
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('relative w-full', className)}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={size === 'lg' ? 20 : 16}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || t('searchPlaceholder')}
          className={clsx(
            'w-full pl-10 pr-10 rounded-xl border border-gray-200 bg-white',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
            'placeholder:text-gray-400 text-gray-900',
            sizeClasses[size]
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
