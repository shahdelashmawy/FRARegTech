import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Loader, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAlerts, createAlert, deleteAlert, toggleAlert, sendTestAlert } from '../lib/api';
import type { RegulationType, Alert } from '../types';
import AlertCard from '../components/alerts/AlertCard';

const TYPES: RegulationType[] = ['Law', 'Decree', 'Circular', 'Announcement'];

const AlertsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [form, setForm] = useState({
    name: '',
    keywords: [] as string[],
    regulation_types: [] as RegulationType[],
    notification_email: true,
    notification_whatsapp: false,
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => createAlert(data),
    onSuccess: () => {
      toast.success(isArabic ? 'تم إنشاء التنبيه' : 'Alert created');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setShowForm(false);
      setForm({ name: '', keywords: [], regulation_types: [], notification_email: true, notification_whatsapp: false });
      setKeywordInput('');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || t('error')),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => toggleAlert(id, is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
    onError: () => toast.error(t('error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAlert(id),
    onSuccess: () => {
      toast.success(isArabic ? 'تم حذف التنبيه' : 'Alert deleted');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => toast.error(t('error')),
  });

  const testMutation = useMutation({
    mutationFn: (id: number) => sendTestAlert(id),
    onSuccess: () => toast.success(isArabic ? 'تم إرسال التنبيه الاختباري' : 'Test alert sent'),
    onError: () => toast.error(t('error')),
  });

  const addKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const kw = keywordInput.trim();
      if (kw && !form.keywords.includes(kw)) {
        setForm((p) => ({ ...p, keywords: [...p.keywords, kw] }));
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setForm((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== kw) }));
  };

  const toggleType = (type: RegulationType) => {
    setForm((p) => ({
      ...p,
      regulation_types: p.regulation_types.includes(type)
        ? p.regulation_types.filter((t) => t !== type)
        : [...p.regulation_types, type],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(isArabic ? 'الرجاء إدخال اسم التنبيه' : 'Please enter an alert name');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{t('myAlerts')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          {t('createAlert')}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-primary mb-5">{t('createAlert')}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Alert name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('alertName')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder={isArabic ? 'مثال: تحديثات قوانين التمويل' : 'e.g. Fintech License Updates'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('keywords')}</label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg min-h-[48px]">
                {form.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                  >
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={addKeyword}
                  placeholder={
                    form.keywords.length === 0
                      ? (isArabic ? 'أدخل كلمة واضغط Enter' : 'Type keyword and press Enter')
                      : ''
                  }
                  className="flex-1 outline-none text-sm min-w-[120px]"
                />
              </div>
            </div>

            {/* Regulation types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('regulationType')}</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.regulation_types.includes(type)}
                      onChange={() => toggleType(type)}
                      className="text-accent"
                    />
                    <span className="text-sm text-gray-600">{t(type.toLowerCase())}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notification method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('notificationMethod')}</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.notification_email}
                    onChange={(e) => setForm((p) => ({ ...p, notification_email: e.target.checked }))}
                    className="text-accent"
                  />
                  <span className="text-sm text-gray-600">{t('emailNotification')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.notification_whatsapp}
                    onChange={(e) => setForm((p) => ({ ...p, notification_whatsapp: e.target.checked }))}
                    className="text-accent"
                  />
                  <span className="text-sm text-gray-600">{t('whatsappNotification')}</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-60"
              >
                {createMutation.isPending ? <Loader size={16} className="animate-spin" /> : <Bell size={16} />}
                {t('createAlert')}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader size={24} className="animate-spin text-accent" />
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert: Alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggle={(id, active) => toggleMutation.mutate({ id, is_active: active })}
              onDelete={(id) => deleteMutation.mutate(id)}
              onTest={(id) => testMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Bell size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t('noAlerts')}</p>
          <p className="text-gray-400 text-sm mt-1">
            {isArabic
              ? 'أنشئ تنبيهاً لتلقي إشعارات بشأن اللوائح الجديدة'
              : 'Create an alert to be notified about new regulations'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium mx-auto hover:bg-primary-light transition-colors"
          >
            <Plus size={16} />
            {t('createAlert')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
