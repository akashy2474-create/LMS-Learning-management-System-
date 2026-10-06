import React, { useState, useEffect } from 'react';
import { Message } from '../../types/auth';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { CheckCheck, Mail } from 'lucide-react';

export const StudentMessagesTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    const res = await api.messages.get();
    if (res.success && res.messages) {
      setMessages(res.messages);
      const unreadList = res.messages.filter((m) => !m.isRead);
      setUnreadCount(unreadList.length);

      // Automatically mark all unread messages as read upon viewing the tab
      if (unreadList.length > 0) {
        api.messages.markAllRead().then(() => {
          setUnreadCount(0);
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Student Messages</h2>
          <p className="text-xs text-slate-500">Read announcements and course messages sent by your instructors</p>
        </div>

        {unreadCount > 0 && (
          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            <span>{unreadCount} Unread Message{unreadCount > 1 ? 's' : ''}</span>
          </span>
        )}
      </div>

      <Card className="space-y-4">
        {messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl border transition-all bg-slate-50/60 border-slate-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-blue-700">From: {m.senderName}</span>
                    <span className="text-slate-400 font-normal">({m.courseTitle})</span>
                  </span>

                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 mt-2">
                  {m.message}
                </p>

                <div className="flex justify-end pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold inline-flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Read
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No messages in your inbox"
            description="When instructors post course announcements or direct feedback, they will appear here."
            icon="folder"
          />
        )}
      </Card>
    </div>
  );
};
