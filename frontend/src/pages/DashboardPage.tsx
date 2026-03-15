import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FileText, Bell, FolderOpen, TrendingUp, ArrowRight, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { getStats, getLatestRegulations } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import RegulationCard from '../components/regulations/RegulationCard';
import { StatCardSkeleton, CardSkeleton } from '../components/common/LoadingSkeleton';
import SearchBar from '../components/search/SearchBar';

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const isArabic = i18n.language === 'ar';

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const { data: latestRegs, isLoading: regsLoading } = useQuery({
    queryKey: ['regulations', 'latest'],
    queryFn: () => getLatestRegulations(10),
  });

  const statCards = [
    {
      label: t('totalRegulations'),
      value: stats?.total_regulations ?? '—',
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: t('newThisWeek'),
      value: stats?.new_this_week ?? '—',
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-100',
    },
    {
      label: t('activeAlerts'),
      value: stats?.active_alerts ?? '—',
      icon: Bell,
      color: 'bg-orange-50 text-orange-600',
      border: 'border-orange-100',
    },
    {
      label: t('savedDocuments'),
      value: stats?.saved_documents ?? '—',
      icon: FolderOpen,
      color: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {t('welcomeBack')}, {user?.full_name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(new Date(), isArabic ? 'dd/MM/yyyy' : 'EEEE, MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Quick Search */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1">{t('quickSearch')}</h2>
        <p className="text-white/60 text-sm mb-4">
          {isArabic
            ? 'ابحث في قاعدة بيانات اللوائح والقوانين المصرية'
            : 'Search the Egyptian financial regulations database'}
        </p>
        <SearchBar
          placeholder={t('quickSearch')}
          navigateToSearch
          size="lg"
          className="max-w-2xl"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={clsx(
                    'bg-white rounded-xl border p-5 transition-all hover:shadow-md',
                    card.border
                  )}
                >
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.color)}>
                    <Icon size={20} />
                  </div>
                  <div className="text-2xl font-bold text-primary">{card.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
                </div>
              );
            })}
      </div>

      {/* Latest Regulations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">{t('latestRegulations')}</h2>
          <Link
            to="/regulations"
            className="flex items-center gap-1 text-sm text-accent hover:text-accent-dark font-medium"
          >
            {t('viewAll')} <ArrowRight size={14} />
          </Link>
        </div>

        {regsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : latestRegs && latestRegs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestRegs.map((reg) => (
              <RegulationCard key={reg.id} regulation={reg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('noRegulations')}</p>
            <Link to="/upload" className="mt-3 inline-flex items-center gap-1 text-sm text-accent font-medium">
              {t('upload')} <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/search', label: t('search'), icon: Search, desc: isArabic ? 'البحث في اللوائح' : 'Search regulations' },
          { to: '/ai-query', label: t('aiAssistant'), icon: FileText, desc: isArabic ? 'اسأل المساعد الذكي' : 'Ask AI assistant' },
          { to: '/alerts', label: t('alerts'), icon: Bell, desc: isArabic ? 'إدارة التنبيهات' : 'Manage alerts' },
          { to: '/upload', label: t('upload'), icon: FolderOpen, desc: isArabic ? 'رفع المستندات' : 'Upload documents' },
        ].map(({ to, label, icon: Icon, desc }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-accent hover:shadow-sm transition-all group"
          >
            <Icon size={24} className="text-accent mb-2" />
            <div className="font-semibold text-primary text-sm">{label}</div>
            <div className="text-gray-500 text-xs mt-0.5">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
