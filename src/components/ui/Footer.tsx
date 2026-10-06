import React from 'react';
import { GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6 px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800">LMS Portal</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-medium">Learn • Grow • Achieve</span>
        </div>

        <p className="text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} LMS Portal. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
