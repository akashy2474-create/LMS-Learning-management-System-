import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (name: string, email: string, password: string, confirmPassword: string, role: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<{ success: boolean; message: string }>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkSession = async () => {
    try {
      setLoading(true);
      const res = await api.auth.getSession();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check Java HttpSession on app mount / refresh
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    if (!email || !email.trim()) {
      return { success: false, message: 'Please enter your email.' };
    }
    if (!password || !password.trim()) {
      return { success: false, message: 'Please enter your password.' };
    }

    const res = await api.auth.login(email.trim(), password.trim());
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, message: res.message || 'Login successful', user: res.user };
    } else {
      return { success: false, message: res.message || 'Invalid email or password.' };
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string, role: string) => {
    if (!name || !name.trim()) {
      return { success: false, message: 'Full name is required.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match.' };
    }
    if (!role || (role !== 'STUDENT' && role !== 'INSTRUCTOR')) {
      return { success: false, message: 'Please select a valid role.' };
    }

    const res = await api.auth.register(name.trim(), email.trim(), password, role);
    if (res.success) {
      if (res.user) {
        setUser(res.user);
      }
      return { success: true, message: res.message || 'Account created successfully.' };
    } else {
      return { success: false, message: res.message || 'Registration failed.' };
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (name: string, email: string) => {
    const res = await api.profile.update(name.trim(), email.trim());
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, message: res.message || 'Profile updated successfully.' };
    } else {
      return { success: false, message: res.message || 'Failed to update profile.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
