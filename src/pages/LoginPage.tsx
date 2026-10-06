import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { GraduationCap, Mail, Lock, LogIn, KeyRound, Sparkles, X, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (user.role === 'INSTRUCTOR') navigate('/instructor', { replace: true });
      else navigate('/student', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    const result = await login(email, password);

    setIsSubmitting(false);

    if (result.success && result.user) {
      setToast({ message: 'Login successful!', type: 'success' });
      const role = result.user.role;
      if (role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (role === 'INSTRUCTOR') {
        navigate('/instructor', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } else {
      setErrorMsg(result.message || 'Invalid email or password.');
    }
  };

  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* LEFT SECTION: Educational Illustration Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />

          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">LMS</span>
            </Link>

            <div className="space-y-4">
              <span className="px-3 py-1 bg-amber-400 text-amber-950 font-bold text-xs rounded-full">
                Welcome Back
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight leading-snug">
                Access Your Learning Portal
              </h2>
              <p className="text-xs text-blue-100 leading-relaxed">
                Connect to your personalized dashboard, manage course modules, and view academic records.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-8 border-t border-white/15">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>HttpSession Authorization</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>BCrypt Password Hashing</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Role-Based Access Control</span>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Login Card Form */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In</h1>
              <p className="text-xs text-slate-500 mt-1">Please enter your credentials to log in.</p>
            </div>

            {/* Quick Demo Seed Credentials Switcher */}
            <div className="mb-6 p-3 bg-blue-50/70 border border-blue-100 rounded-2xl">
              <p className="text-[11px] font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick Test Credentials (1-Click Fill):</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@lms.com', 'Admin@123')}
                  className="px-2.5 py-1.5 bg-white hover:bg-blue-100 border border-blue-200 rounded-xl text-[11px] font-bold text-blue-700 transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('instructor@lms.com', 'Instructor@123')}
                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-700 transition-colors"
                >
                  Instructor
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('student@lms.com', 'Student@123')}
                  className="px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 transition-colors"
                >
                  Student
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-medium">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} className="w-full mt-2">
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Button>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 font-medium">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800 underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              If you forgot your password, please contact your system administrator at{' '}
              <span className="font-bold text-slate-700">admin@lms.com</span> or use one of the 1-click test accounts.
            </p>
            <Button variant="primary" size="sm" onClick={() => setForgotModalOpen(false)} className="w-full">
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
