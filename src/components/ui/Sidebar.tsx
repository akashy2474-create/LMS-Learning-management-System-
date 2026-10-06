import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Users,
  BookOpen,
  Settings,
  UserCircle,
  LogOut,
  GraduationCap,
  MessageSquare,
  Compass,
  TrendingUp,
  X,
  UserCheck,
  BookMarked,
  BarChart3,
  CheckSquare,
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = 'dashboard',
  setActiveTab,
  mobileOpen: controlledMobileOpen,
  setMobileOpen: controlledSetMobileOpen,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isMobileOpen = controlledMobileOpen !== undefined ? controlledMobileOpen : internalMobileOpen;
  const setOpen = controlledSetMobileOpen || setInternalMobileOpen;

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const role = user.role;

  const roleBadgeColor = {
    ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    INSTRUCTOR: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    STUDENT: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const navItemsByRole = {
    ADMIN: [
      { id: 'dashboard', label: 'User Management', icon: Users, path: '/admin' },
      { id: 'approval', label: 'Course Approvals', icon: CheckSquare, path: '/admin' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/admin' },
      { id: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
    ],
    INSTRUCTOR: [
      { id: 'my-courses', label: 'My Courses', icon: BookMarked, path: '/instructor' },
      { id: 'students', label: 'Students & Progress', icon: UserCheck, path: '/instructor' },
      { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/instructor' },
      { id: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
    ],
    STUDENT: [
      { id: 'my-courses', label: 'My Courses', icon: BookOpen, path: '/student' },
      { id: 'browse', label: 'Course Catalog', icon: Compass, path: '/student' },
      { id: 'progress', label: 'Learning Progress', icon: TrendingUp, path: '/student' },
      { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/student' },
      { id: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
    ],
  };

  const currentNavItems = navItemsByRole[role] || [];

  const handleItemClick = (id: string, path: string) => {
    if (path === '/profile') {
      navigate('/profile');
    } else {
      if (location.pathname !== path) {
        navigate(path);
      }
      if (setActiveTab) {
        setActiveTab(id);
      }
    }
    setOpen(false);
  };

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-fade-in"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Fixed on Desktop, Slide-over Drawer on Mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Brand Header with Close Button for Mobile */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-100">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-none">LMS Portal</h1>
                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md border ${roleBadgeColor[role]}`}>
                  {role} Portal
                </span>
              </div>
            </div>

            {/* Close button for mobile drawer */}
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Navigation</p>
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/profile'
                  ? location.pathname === '/profile'
                  : activeTab === item.id && location.pathname !== '/profile';

              const isMessageTab = item.id === 'messages';

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id, item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {isMessageTab && unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-900 font-extrabold text-[10px] rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dynamic User Footer Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
