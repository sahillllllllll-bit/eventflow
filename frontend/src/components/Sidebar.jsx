import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import {
  Zap, BarChart3, Mail, Award, Settings, LogOut,
  Menu, X, DollarSign, MessageSquare, CalendarDays,
} from 'lucide-react';

const Sidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/dashboard',                   label: 'Dashboard',           icon: BarChart3 },
    { path: '/dashboard/events',            label: 'Events',              icon: CalendarDays },
    { path: '/dashboard/certificates',      label: 'Certificates',        icon: Award },
    { path: '/dashboard/allcertificates',   label: 'Issued Certificates', icon: Award },
    { path: '/dashboard/payouts',           label: 'Payouts',             icon: Zap },
    { path: '/dashboard/promo',             label: 'Promo Emails',        icon: Mail },
    { path: '/dashboard/settings',          label: 'Settings',            icon: Settings },
    { path: '/dashboard/pricing',           label: 'Pricing',             icon: DollarSign },
    // ← Community Chatroom — opens /dashboard/chat (event selector inside)
    { path: '/dashboard/chat',              label: 'Community Chatroom',  icon: MessageSquare },
  ];

  // Active check — also highlight if on /dashboard/chat/:eventId
  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + '/');

  const handleLogout = () => { logout(); navigate('/'); };

  const handleNavClick = (path) => { navigate(path); setIsOpen(false); };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface-raised hover:bg-surface-overlay rounded-lg transition"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div className={`fixed left-0 top-0 h-screen w-60 bg-surface-raised border-r border-surface-overlay flex flex-col transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>

        {/* Logo */}
        <div
  onClick={() => navigate('/')}
  className="p-6 border-b border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition"
>
  <img
    src="https://res.cloudinary.com/dmhykhefr/image/upload/v1779460044/ChatGPT_Image_May_21__2026__02_47_45_PM-removebg-preview_kww7oj.png"
    alt="EventGlow Logo"
    className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
  />
  <span
    className="text-base sm:text-lg font-black uppercase tracking-widest bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent"
    style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
  >
    EventGlow
  </span>
</div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon   = item.icon;
            const active = isActive(item.path);
            const isChatRoom = item.path === '/dashboard/chat';
            return (
              <button
                key={item.path + item.label}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-brand/20 text-brand border-l-4 border-brand'
                    : 'text-gray-400 hover:text-white hover:bg-surface-overlay'
                } ${isChatRoom ? 'mt-2 border-t border-surface-overlay pt-3' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
                {/* {isChatRoom && (
                  <span className="ml-auto text-[10px] bg-brand/20 text-brand px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                    .
                  </span>
                )} */}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-surface-overlay space-y-3">
          <div className="px-4 py-3 bg-surface-overlay rounded-lg">
            <p className="text-xs text-gray-400">Organizer</p>
            <p className="font-semibold text-white truncate text-sm">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.college}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition text-sm"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;