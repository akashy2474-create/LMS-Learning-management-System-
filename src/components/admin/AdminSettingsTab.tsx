import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { SystemSettings } from '../../types/auth';
import { api } from '../../services/api';
import { Save, Mail, Globe } from 'lucide-react';

export const AdminSettingsTab: React.FC = () => {
  const [platformName, setPlatformName] = useState('');
  const [platformEmail, setPlatformEmail] = useState('');
  const [allowStudentRegistration, setAllowStudentRegistration] = useState(true);
  const [allowInstructorRegistration, setAllowInstructorRegistration] = useState(true);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    const res = await api.settings.get();
    if (res.success && res.settings) {
      const s: SystemSettings = res.settings;
      setPlatformName(s.platformName);
      setPlatformEmail(s.platformEmail);
      setAllowStudentRegistration(s.allowStudentRegistration);
      setAllowInstructorRegistration(s.allowInstructorRegistration);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await api.settings.update(
      platformName,
      platformEmail,
      allowStudentRegistration,
      allowInstructorRegistration
    );
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Settings updated successfully.', type: 'success' });
    } else {
      setToast({ message: res.message || 'Failed to update settings.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h2 className="text-xl font-extrabold text-slate-900">System Settings</h2>
        <p className="text-xs text-slate-500">Configure core platform parameters stored in MySQL database</p>
      </div>

      <Card className="space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">General Platform Config</h3>

            <Input
              label="Platform Name"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              leftIcon={<Globe className="w-4 h-4" />}
              required
            />

            <Input
              label="Platform Administrator Email"
              type="email"
              value={platformEmail}
              onChange={(e) => setPlatformEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Registration Governance</h3>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Allow Student Registration</p>
                <p className="text-[11px] text-slate-500">Permit new student account registrations on the portal</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowStudentRegistration}
                  onChange={(e) => setAllowStudentRegistration(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Allow Instructor Registration</p>
                <p className="text-[11px] text-slate-500">Permit new instructor account registrations on the portal</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowInstructorRegistration}
                  onChange={(e) => setAllowInstructorRegistration(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
