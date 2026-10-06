import React, { useState, useEffect } from 'react';
import { Enrollment } from '../../types/auth';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { EmptyState } from '../ui/EmptyState';
import {
  Search,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Filter,
  Send,
  X,
  Calendar,
} from 'lucide-react';

export const InstructorStudentsTab: React.FC = () => {
  const [students, setStudents] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [progressFilter, setProgressFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'>('ALL');
  const [sortBy, setSortBy] = useState<'progress-desc' | 'progress-asc' | 'name-asc' | 'recent'>('progress-desc');

  // Quick message modal
  const [messageModalStudent, setMessageModalStudent] = useState<Enrollment | null>(null);
  const [quickMessageText, setQuickMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.enrollments.getInstructorStudents();
      if (res.success && res.students) {
        setStudents(res.students);
      }
    } catch (err) {
      console.error('Failed to fetch instructor students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Compute distinct courses for filter dropdown
  const uniqueCourses = Array.from(new Set(students.map((s) => s.courseTitle).filter(Boolean)));

  // Calculate metrics
  const totalStudents = students.length;
  const completedCount = students.filter((s) => s.progress >= 100).length;
  const inProgressCount = students.filter((s) => s.progress > 0 && s.progress < 100).length;
  const notStartedCount = students.filter((s) => s.progress === 0).length;
  const avgProgress = totalStudents > 0
    ? Math.round(students.reduce((acc, s) => acc + (s.progress || 0), 0) / totalStudents)
    : 0;

  // Filter & sort logic
  const filteredStudents = students
    .filter((s) => {
      const matchesSearch =
        (s.studentName && s.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.studentEmail && s.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.courseTitle && s.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCourse = courseFilter === 'ALL' || s.courseTitle === courseFilter;

      let matchesProgress = true;
      if (progressFilter === 'COMPLETED') matchesProgress = s.progress >= 100;
      else if (progressFilter === 'IN_PROGRESS') matchesProgress = s.progress > 0 && s.progress < 100;
      else if (progressFilter === 'NOT_STARTED') matchesProgress = s.progress === 0;

      return matchesSearch && matchesCourse && matchesProgress;
    })
    .sort((a, b) => {
      if (sortBy === 'progress-desc') return (b.progress || 0) - (a.progress || 0);
      if (sortBy === 'progress-asc') return (a.progress || 0) - (b.progress || 0);
      if (sortBy === 'name-asc') return (a.studentName || '').localeCompare(b.studentName || '');
      if (sortBy === 'recent') return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
      return 0;
    });

  const handleSendQuickMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageModalStudent || !quickMessageText.trim()) return;

    setIsSendingMessage(true);
    const res = await api.messages.send(
      messageModalStudent.studentId,
      messageModalStudent.courseId,
      quickMessageText.trim()
    );
    setIsSendingMessage(false);

    if (res.success) {
      setToast({ message: `Message sent to ${messageModalStudent.studentName}!`, type: 'success' });
      setMessageModalStudent(null);
      setQuickMessageText('');
    } else {
      setToast({ message: res.message || 'Failed to send message.', type: 'error' });
    }
  };

  const getStatusBadge = (progress: number) => {
    if (progress >= 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed (100%)
        </span>
      );
    }
    if (progress >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <TrendingUp className="w-3 h-3 text-blue-600" />
          Advanced ({progress}%)
        </span>
      );
    }
    if (progress > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          In Progress ({progress}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <AlertCircle className="w-3 h-3 text-slate-400" />
        Not Started (0%)
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Progress Tracker</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor real-time course completions, material progress, and active learners
          </p>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <Card className="p-4 border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Enrolled</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalStudents}</p>
          <span className="text-[10px] text-slate-400 font-medium">Students enrolled</span>
        </Card>

        <Card className="p-4 border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
          <span className="text-[10px] text-slate-400 font-medium">Finished all units</span>
        </Card>

        <Card className="p-4 border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600">{inProgressCount}</p>
          <span className="text-[10px] text-slate-400 font-medium">Actively studying</span>
        </Card>

        <Card className="p-4 border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Not Started</span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-600">{notStartedCount}</p>
          <span className="text-[10px] text-slate-400 font-medium">0% progress</span>
        </Card>

        <Card className="p-4 border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Progress</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700">{avgProgress}%</p>
          <span className="text-[10px] text-slate-400 font-medium">Across all courses</span>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="p-4 space-y-3 border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student by name, email, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Course Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold whitespace-nowrap flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              Course:
            </span>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer max-w-[200px]"
            >
              <option value="ALL">All Courses ({students.length})</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="progress-desc">Progress: High to Low</option>
              <option value="progress-asc">Progress: Low to High</option>
              <option value="name-asc">Student Name (A-Z)</option>
              <option value="recent">Recently Enrolled</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          {[
            { id: 'ALL', label: `All Students (${totalStudents})` },
            { id: 'COMPLETED', label: `Completed (${completedCount})` },
            { id: 'IN_PROGRESS', label: `In Progress (${inProgressCount})` },
            { id: 'NOT_STARTED', label: `Not Started (${notStartedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setProgressFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                progressFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Students Table */}
      <Card className="p-0 overflow-hidden border-slate-200 shadow-2xs">
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-5">Student Learner</th>
                  <th className="py-3.5 px-4">Enrolled Course</th>
                  <th className="py-3.5 px-4">Progress Metric</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Enrolled Date</th>
                  <th className="py-3.5 px-5 text-right">Direct Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const initial = s.studentName ? s.studentName.charAt(0).toUpperCase() : 'S';
                  const progressVal = Math.min(100, Math.max(0, s.progress || 0));

                  return (
                    <tr key={`${s.id}-${s.studentId}-${s.courseId}`} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{s.studentName}</p>
                            <p className="text-[11px] text-slate-400 font-normal">{s.studentEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="line-clamp-1 max-w-[220px]">{s.courseTitle}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">Course ID: #{s.courseId}</span>
                      </td>

                      {/* Progress Bar & Number */}
                      <td className="py-4 px-4 w-52">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">Completion</span>
                            <span className="font-extrabold text-blue-700 tabular-nums">{progressVal}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progressVal >= 100
                                  ? 'bg-emerald-600'
                                  : progressVal >= 50
                                  ? 'bg-blue-600'
                                  : progressVal > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${progressVal}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {s.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            Pending Admin Approval
                          </span>
                        ) : s.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            Enrollment Rejected
                          </span>
                        ) : (
                          getStatusBadge(progressVal)
                        )}
                      </td>

                      {/* Enrolled Date */}
                      <td className="py-4 px-4 text-slate-500">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : 'Active'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMessageModalStudent(s)}
                          className="text-xs font-semibold"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>Message</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              title="No students match the criteria"
              description="Try adjusting your search query, course filter, or progress status filters."
              icon="folder"
            />
          </div>
        )}
      </Card>

      {/* Quick Message Modal */}
      {messageModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Message Student</h3>
                  <p className="text-xs text-slate-500">
                    To: <span className="font-semibold text-slate-800">{messageModalStudent.studentName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMessageModalStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-500 font-medium">
                Course: <span className="font-bold text-slate-800">{messageModalStudent.courseTitle}</span>
              </p>
              <p className="text-slate-500 font-medium">
                Current Progress: <span className="font-bold text-blue-700">{messageModalStudent.progress}%</span>
              </p>
            </div>

            <form onSubmit={handleSendQuickMessage} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Message Text</label>
                <textarea
                  rows={4}
                  value={quickMessageText}
                  onChange={(e) => setQuickMessageText(e.target.value)}
                  placeholder={`Hi ${messageModalStudent.studentName}, great job on your progress in ${messageModalStudent.courseTitle}...`}
                  required
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setMessageModalStudent(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSendingMessage}>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
