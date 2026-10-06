import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/ui/Sidebar';
import { TopBar } from '../components/ui/TopBar';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { Footer } from '../components/ui/Footer';
import { api } from '../services/api';
import { User, Mail, Shield, Save, Lock, Eye, EyeOff } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, checkSession } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Password fields
  const [changePasswordToggle, setChangePasswordToggle] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Valid email address is required.');
      return;
    }

    if (changePasswordToggle) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current password.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setErrorMsg('New passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    const result = await api.profile.update(
      name.trim(),
      email.trim(),
      changePasswordToggle ? currentPassword : undefined,
      changePasswordToggle ? newPassword : undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      setToast({ message: 'Profile updated successfully.', type: 'success' });
      setChangePasswordToggle(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      checkSession();
    } else {
      setErrorMsg(result.message || 'Failed to update profile.');
    }
  };

  const roleBadgeStyle = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    INSTRUCTOR: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    STUDENT: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar: Fixed on desktop, slide-over drawer on mobile */}
      <Sidebar
        activeTab="profile"
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area: Offset by sidebar on desktop (lg:pl-64) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <TopBar
          activeTab="profile"
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          isMobileMenuOpen={mobileOpen}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6 flex-1">
          {/* Avatar Banner Card */}
          <Card className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-md">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md text-white font-black text-3xl flex items-center justify-center border border-white/20 shadow-md">
              {user ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-black tracking-tight">{user?.name}</h2>
                {user?.role && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleBadgeStyle[user.role]}`}>
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100">{user?.email}</p>
              <p className="text-[11px] text-blue-200 pt-1">
                Account ID: #{user?.id}
              </p>
            </div>
          </Card>

          {/* Edit Profile Form */}
          <Card className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Edit Account & Password</h3>
              <p className="text-xs text-slate-500">
                Update your user details and profile security settings.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 max-w-xl">
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Account Role</label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>{user?.role} (Role managed by platform administrator)</span>
                </div>
              </div>

              {/* Password Toggle Option */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={changePasswordToggle}
                    onChange={(e) => setChangePasswordToggle(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-800">Change Account Password</span>
                </label>

                {changePasswordToggle && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-fade-in">
                    <div className="relative">
                      <Input
                        label="Current Password"
                        type={showPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        leftIcon={<Lock className="w-4 h-4" />}
                        placeholder="••••••••"
                        required={changePasswordToggle}
                      />
                    </div>

                    <Input
                      label="New Password"
                      type={showPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      leftIcon={<Lock className="w-4 h-4" />}
                      placeholder="Minimum 6 characters"
                      required={changePasswordToggle}
                    />

                    <Input
                      label="Confirm New Password"
                      type={showPass ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      leftIcon={<Lock className="w-4 h-4" />}
                      placeholder="Re-type new password"
                      required={changePasswordToggle}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 pt-1"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPass ? 'Hide passwords' : 'Show passwords'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </Card>
        </main>

        <Footer />
      </div>
    </div>
  );
};
