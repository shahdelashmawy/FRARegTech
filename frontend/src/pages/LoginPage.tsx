import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { login, getErrorMessage } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import LanguageToggle from '../components/common/LanguageToggle';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const isRTL = i18n.language === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const response = await login({ email, password });
      storeLogin(response.access_token, response.user);
      // Sync language with user preference
      if (response.user.preferred_language) {
        i18n.changeLanguage(response.user.preferred_language);
      }
      toast.success(t('loginSuccess'));
      navigate('/dashboard');
    } catch (err: any) {
      const msg = getErrorMessage(err, t('invalidCredentials'));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-primary-dark flex items-center justify-center p-4">
      {/* Language toggle top-right */}
      <div className="fixed top-4 right-4">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className={`text-center mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-primary font-bold text-lg">FRA</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl">FRA RegTech</div>
              <div className="text-accent text-sm">تتبع اللوائح التنظيمية</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-primary mb-2">{t('signIn')}</h1>
          <p className="text-gray-500 text-sm mb-6">
            {t('dontHaveAccount')}{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline">
              {t('register')}
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('emailAddress')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? t('loading') : t('signIn')}
            </button>
          </form>
        </div>

        <p className="text-center text-white/60 text-xs mt-6">
          Egyptian Financial Regulatory Authority — RegTech Platform
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
