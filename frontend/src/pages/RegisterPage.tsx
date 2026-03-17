import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock, Mail, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { register, getErrorMessage } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import LanguageToggle from '../components/common/LanguageToggle';

const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    whatsapp_number: '',
    preferred_language: 'en' as 'en' | 'ar',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        whatsapp_number: form.whatsapp_number || undefined,
        preferred_language: form.preferred_language,
      });
      storeLogin(response.access_token, response.user);
      i18n.changeLanguage(form.preferred_language);
      toast.success(t('registerSuccess'));
      navigate('/dashboard');
    } catch (err: any) {
      const msg = getErrorMessage(err, t('error'));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-primary-dark flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
            <span className="text-primary font-bold text-lg">FRA</span>
          </div>
          <div>
            <div className="text-white font-bold text-xl">FRA RegTech</div>
            <div className="text-accent text-sm">تتبع اللوائح التنظيمية</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-primary mb-2">{t('createAccount')}</h1>
          <p className="text-gray-500 text-sm mb-6">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline">
              {t('signIn')}
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fullName')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  required
                  placeholder="Ahmed Mohamed"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('confirmPasswordLabel')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={form.confirm_password}
                    onChange={(e) => handleChange('confirm_password', e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('whatsappNumber')} <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={form.whatsapp_number}
                  onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                  placeholder="+20 100 000 0000"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('preferredLanguage')}</label>
              <div className="flex gap-3">
                {(['en', 'ar'] as const).map((lang) => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      value={lang}
                      checked={form.preferred_language === lang}
                      onChange={() => handleChange('preferred_language', lang)}
                      className="text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-gray-700">
                      {lang === 'en' ? t('english') : t('arabic')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? t('loading') : t('createAccount')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
