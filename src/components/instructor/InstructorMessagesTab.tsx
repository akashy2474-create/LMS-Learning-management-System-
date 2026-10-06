import React, { useState, useEffect } from 'react';
import { Enrollment, Message } from '../../types/auth';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { EmptyState } from '../ui/EmptyState';
import { MessageSquare, Send } from 'lucide-react';

export const InstructorMessagesTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<Enrollment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Enrollment | null>(null);
  const [messageText, setMessageText] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchMessagesAndStudents = async () => {
    setLoading(true);
    const [msgRes, studRes] = await Promise.all([
      api.messages.get(),
      api.enrollments.getInstructorStudents(),
    ]);

    if (msgRes.success && msgRes.messages) {
      setMessages(msgRes.messages);
      const unreadList = msgRes.messages.filter((m) => !m.isRead);
      if (unreadList.length > 0) {
        api.messages.markAllRead();
      }
    }
    if (studRes.success && studRes.students) setStudents(studRes.students);

    setLoading(false);
  };

  useEffect(() => {
    fetchMessagesAndStudents();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setToast({ message: 'Please select a recipient student.', type: 'error' });
      return;
    }
    if (!messageText.trim()) return;

    setIsSubmitting(true);
    const res = await api.messages.send(selectedStudent.studentId, selectedStudent.courseId, messageText);
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Message sent successfully.', type: 'success' });
      setMessageText('');
      fetchMessagesAndStudents();
    } else {
      setToast({ message: res.message || 'Failed to send message.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Student Communication</h2>
        <p className="text-xs text-slate-500">Send direct course announcements and educational messages to enrolled students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Send Message Form */}
        <Card className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" />
            <span>Send New Message</span>
          </h3>

          <form onSubmit={handleSendMessage} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Enrolled Student</label>
              {students.length > 0 ? (
                <select
                  value={selectedStudent ? `${selectedStudent.studentId}-${selectedStudent.courseId}` : ''}
                  onChange={(e) => {
                    const found = students.find((s) => `${s.studentId}-${s.courseId}` === e.target.value);
                    setSelectedStudent(found || null);
                  }}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  required
                >
                  <option value="">-- Choose Student & Course --</option>
                  {students.map((s) => (
                    <option key={`${s.studentId}-${s.courseId}`} value={`${s.studentId}-${s.courseId}`}>
                      {s.studentName} ({s.courseTitle})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  No enrolled students available yet.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type educational message or announcement..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <Button variant="amber" size="sm" type="submit" isLoading={isSubmitting} className="w-full">
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </Button>
          </form>
        </Card>

        {/* Message Log */}
        <Card className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Sent & Received Messages</span>
          </h3>

          {messages.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {messages.map((m) => (
                <div key={m.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="text-blue-700">To: {m.receiverName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">{m.courseTitle}</p>
                  <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                    {m.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No messages yet"
              description="Send announcements or guidance messages to your enrolled students."
              icon="folder"
            />
          )}
        </Card>
      </div>
    </div>
  );
};
