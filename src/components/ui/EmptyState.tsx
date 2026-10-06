import React from 'react';
import { BookOpen, FolderOpen, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: 'course' | 'folder' | 'alert' | React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon = 'course',
}) => {
  const defaultIcons: Record<string, React.ReactNode> = {
    course: <BookOpen className="w-10 h-10 text-blue-500" />,
    folder: <FolderOpen className="w-10 h-10 text-blue-500" />,
    alert: <AlertCircle className="w-10 h-10 text-amber-500" />,
  };

  const renderedIcon = typeof icon === 'string' ? defaultIcons[icon] || defaultIcons.course : icon;

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 my-4">
      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4">
        {renderedIcon}
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};
