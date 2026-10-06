import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ text = 'Loading LMS portal...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600 tracking-wide">{text}</p>
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 bg-slate-50/90 backdrop-blur-xs z-50 flex items-center justify-center">{content}</div>;
  }

  return content;
};
