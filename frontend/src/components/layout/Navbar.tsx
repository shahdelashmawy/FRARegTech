import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileText,
  Search,
  Bot,
  Upload,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import LanguageToggle from '../common/LanguageToggle';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isRTL = i18n.language === 'ar';

  const navLinks = [
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/regulations', label: t('regulations'), icon: FileText },
    { to: '/search', label: t('search'), icon: Search },
    { to: '/ai-query', label: t('aiAssistant'), icon: Bot },
    { to: '/upload', label: t('upload'), icon: Upload },
    { to: '/alerts', label: t('alerts'), icon: Bell },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-sm">FRA</span>
            </div>
            <div className={clsx('hidden sm:block', isRTL && 'text-right')}>
              <div className="text-white font-bold text-base leading-tight">FRA RegTech</div>
              <div className="text-accent text-xs leading-tight">تتبع اللوائح التنظيمية</div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-accent text-primary'
                      : 'text-gray-300 hover:text-white hover:bg-primary-light'
                  )
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageToggle />

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-sm">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user?.full_name?.split(' ')[0]}
                </span>
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div className={clsx(
                  'absolute top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50',
                  isRTL ? 'left-0' : 'right-0'
                )}>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} />
                    {t('profile')}
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden text-gray-300 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-primary-dark border-t border-primary-light">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full',
                    isActive
                      ? 'bg-accent text-primary'
                      : 'text-gray-300 hover:text-white hover:bg-primary-light'
                  )
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
