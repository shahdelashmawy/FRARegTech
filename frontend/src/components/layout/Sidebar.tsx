import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileText,
  Search,
  Bot,
  Upload,
  Bell,
  User,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const { t } = useTranslation();

  const navLinks = [
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/regulations', label: t('regulations'), icon: FileText },
    { to: '/search', label: t('search'), icon: Search },
    { to: '/ai-query', label: t('aiAssistant'), icon: Bot },
    { to: '/upload', label: t('upload'), icon: Upload },
    { to: '/alerts', label: t('alerts'), icon: Bell },
    { to: '/profile', label: t('profile'), icon: User },
  ];

  return (
    <aside
      className={clsx(
        'hidden lg:flex flex-col bg-primary h-full transition-all duration-300 shadow-xl',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent text-primary'
                  : 'text-gray-300 hover:text-white hover:bg-primary-light'
              )
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
