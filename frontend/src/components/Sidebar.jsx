import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Zap, BarChart3, Zap as Events, Mail, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/dashboard/events', label: 'Events', icon: Events },
    { path: '/dashboard/payouts', label: 'Payouts', icon: Zap },
    { path: '/dashboard/promo', label: 'Promo Emails', icon: Mail },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-60 bg-surface-raised border-r border-surface-overlay flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-surface-overlay flex items-center gap-3">
        <Zap className="w-8 h-8 text-brand" />
        <span className="text-xl font-bold">EventFlow</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-brand/20 text-brand border-l-4 border-brand'
                  : 'text-gray-400 hover:text-white hover:bg-surface-overlay'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-surface-overlay space-y-3">
        <div className="px-4 py-3 bg-surface-overlay rounded-lg">
          <p className="text-sm text-gray-400">Organizer</p>
          <p className="font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.college}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
