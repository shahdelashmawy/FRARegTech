import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Phone, Globe, Lock, Save, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProfile, changePassword } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuthStore();
  const isArabic = i18n.language === 'ar';

  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    whatsapp_number: user?.whatsapp_number || '',
    preferred_language: user?.preferred_language || 'en',
    notify_email: user?.notify_email ?? true,
    notify_whatsapp: user?.notify_whatsapp ?? false,
    tracked_keywords: user?.tracked_keywords || [],
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name,
        email: user.email,
        whatsapp_number: user.whatsapp_number || '',
        preferred_language: user.preferred_language,
        notify_email: user.notify_email,
        notify_whatsapp: user.notify_whatsapp,
        tracked_keywords: user.tracked_keywords || [],
      });
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: (data: typeof profile) => updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      i18n.changeLanguage(updatedUser.preferred_language);
      toast.success(t('profileUpdated'));
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || t('error')),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ current_password, new_password }: { current_password: string; new_password: string }) =>
      changePassword(current_password, new_password),
    onSuccess: () => {
      toast.success(isArabic ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || t('error')),
  });

  const addKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const kw = keywordInput.trim();
      if (kw && !profile.tracked_keywords.includes(kw)) {
        setProfile((p) => ({ ...p, tracked_keywords: [...p.tracked_keywords, kw] }));
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setProfile((p) => ({ ...p, tracked_keywords: p.tracked_keywords.filter((k) => k !== kw) }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(profile);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error(t('passwordMismatch'));
      return;
    }
    passwordMutation.mutate({
      current_password: passwords.current_password,
      new_password: passwords.new_password,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-primary">{t('myProfile')}</h1>

      {/* Profile form */}
      <form onSubmit={handleProfileSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-primary flex items-center gap-2">
          <User size={18} />
          {isArabic ? 'المعلومات الشخصية' : 'Personal Information'}
        </h2>

        {/* Name & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fullName')}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('whatsappNumber')}</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="tel"
              value={profile.whatsapp_number}
              onChange={(e) => setProfile((p) => ({ ...p, whatsapp_number: e.target.value }))}
              placeholder="+20 100 000 0000"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('preferredLanguage')}</label>
          <div className="flex gap-4">
            {(['en', 'ar'] as const).map((lang) => (
              <label key={lang} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={profile.preferred_language === lang}
                  onChange={() => setProfile((p) => ({ ...p, preferred_language: lang }))}
                  name="language"
                  className="text-accent"
                />
                <Globe size={14} className="text-gray-400" />
                <span className="text-sm text-gray-700">
                  {lang === 'en' ? t('english') : t('arabic')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tracked keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('trackedKeywords')}</label>
          <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg min-h-[48px]">
            {profile.tracked_keywords.map((kw) => (
              <span
                key={kw}
                className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent-dark rounded-full text-xs font-medium"
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
                profile.tracked_keywords.length === 0
                  ? (isArabic ? 'أدخل كلمة واضغط Enter' : 'Type keyword and press Enter')
                  : ''
              }
              className="flex-1 outline-none text-sm min-w-[120px]"
            />
          </div>
        </div>

        {/* Notification preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('notificationPreferences')}</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notify_email}
                onChange={(e) => setProfile((p) => ({ ...p, notify_email: e.target.checked }))}
                className="text-accent"
              />
              <span className="text-sm text-gray-600">{t('notifyByEmail')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notify_whatsapp}
                onChange={(e) => setProfile((p) => ({ ...p, notify_whatsapp: e.target.checked }))}
                className="text-accent"
              />
              <span className="text-sm text-gray-600">{t('notifyByWhatsApp')}</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={profileMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-60"
        >
          {profileMutation.isPending ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          {t('saveChanges')}
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-primary flex items-center gap-2">
          <Lock size={18} />
          {t('changePassword')}
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('currentPassword')}</label>
          <input
            type="password"
            value={passwords.current_password}
            onChange={(e) => setPasswords((p) => ({ ...p, current_password: e.target.value }))}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('newPassword')}</label>
            <input
              type="password"
              value={passwords.new_password}
              onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('confirmPassword')}</label>
            <input
              type="password"
              value={passwords.confirm_password}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm_password: e.target.value }))}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={passwordMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-60"
        >
          {passwordMutation.isPending ? <Loader size={16} className="animate-spin" /> : <Lock size={16} />}
          {t('changePassword')}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
