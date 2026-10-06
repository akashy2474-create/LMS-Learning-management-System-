import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GraduationCap, Bell, MessageSquare, ChevronDown, User, LogOut, Sparkles, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TopBarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab = 'my-courses',
  setActiveTab,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Fetch unread messages count and listen to real-time clearing event
  useEffect(() => {
    if (user) {
      api.messages.get().then((res) => {
        if (res.success && res.unreadCount !== undefined) {
          setUnreadCount(res.unreadCount);
        }
      });
    }

    const handleMessagesRead = () => {
      setUnreadCount(0);
    };

    window.addEventListener('lms:messages-read', handleMessagesRead);
    return () => {
      window.removeEventListener('lms:messages-read', handleMessagesRead);
    };
  }, [user]);

  const handleNotificationClick = async () => {
    setUnreadCount(0);
    try {
      await api.messages.markAllRead();
    } catch (e) {
      console.error('Failed to mark messages read:', e);
    }
    handleNavClick('messages');
  };

  const handleNavClick = (tabId: string, pathOverride?: string) => {
    if (pathOverride === '/profile' || tabId === 'profile') {
      navigate('/profile');
      return;
    }

    const basePath = user?.role === 'STUDENT' ? '/student' : user?.role === 'INSTRUCTOR' ? '/instructor' : '/admin';
    if (location.pathname !== basePath) {
      navigate(basePath);
    }

    if (setActiveTab) {
      setActiveTab(tabId);
    }
  };

  const getNavItems = () => {
    if (user?.role === 'STUDENT') {
      return [
        { id: 'my-courses', label: 'My Courses' },
        { id: 'browse', label: 'Course Catalog' },
        { id: 'progress', label: 'Learning Progress' },
        { id: 'messages', label: 'Messages' },
        { id: 'profile', label: 'Profile', path: '/profile' },
      ];
    }
    if (user?.role === 'INSTRUCTOR') {
      return [
        { id: 'my-courses', label: 'My Courses' },
        { id: 'students', label: 'Students & Progress' },
        { id: 'messages', label: 'Messages' },
        { id: 'profile', label: 'Profile', path: '/profile' },
      ];
    }
    return [
      { id: 'dashboard', label: 'Users' },
      { id: 'approval', label: 'Course Approvals' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'settings', label: 'Settings' },
      { id: 'profile', label: 'Profile', path: '/profile' },
    ];
  };

  const navItems = getNavItems();
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="w-full flex flex-col z-30 sticky top-0 shadow-xs">
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-slate-200 px-4 sm:px-8 py-1.5 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold tracking-wide text-white">Learn • Grow • Achieve</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell with Badge (clears to 0 immediately upon click) */}
          <button
            onClick={handleNotificationClick}
            className="relative p-1 text-slate-300 hover:text-white transition-colors"
            title={unreadCount > 0 ? `${unreadCount} unread message(s) - click to read & clear` : 'Notifications (no unread)'}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full ring-2 ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Messages Icon */}
          <button
            onClick={handleNotificationClick}
            className="p-1 text-slate-300 hover:text-white transition-colors relative"
            title="Messages Inbox"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-0.5 right-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-8 py-3 flex items-center justify-between">
        {/* Left: Mobile Toggle + LMS Portal Brand */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Toggle Button (at the very top!) */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle navigation drawer"
              title="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => handleNavClick(user?.role === 'ADMIN' ? 'dashboard' : 'my-courses')}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 group-hover:bg-blue-700 transition-colors flex items-center justify-center text-white shadow-md shadow-blue-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none block">
                LMS Portal
              </span>
              <span className="text-[10px] font-bold text-blue-600 block mt-0.5 tracking-wider uppercase">
                {user?.role ? `${user.role.charAt(0) + user.role.slice(1).toLowerCase()} Portal` : 'Portal'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Main Navigation Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600">
          {navItems.map((item, idx) => {
            const isActive = item.path === '/profile'
              ? location.pathname === '/profile'
              : activeTab === item.id && location.pathname !== '/profile';

            return (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => handleNavClick(item.id, item.path)}
                className={`transition-all px-3 py-1.5 rounded-xl font-bold ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Dynamic User Profile Avatar & Name */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                {userInitial}
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate leading-none">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium capitalize mt-0.5 leading-none">
                  {user.role?.toLowerCase()}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 text-slate-800 z-50 text-xs font-semibold animate-fade-in">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="font-extrabold truncate text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-md">
                    {user.role} Account
                  </span>
                </div>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Account Settings</span>
                </button>
                <button
                  onClick={async () => {
                    setProfileDropdownOpen(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
