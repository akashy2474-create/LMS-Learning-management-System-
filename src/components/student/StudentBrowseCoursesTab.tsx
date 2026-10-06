import React, { useState, useEffect } from 'react';
import { Course, Enrollment } from '../../types/auth';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { EmptyState } from '../ui/EmptyState';
import { Search, Compass, BookOpen, CheckCircle2, User, ChevronRight, X, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export const StudentBrowseCoursesTab: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCourseModal, setSelectedCourseModal] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [cRes, eRes] = await Promise.all([
      api.courses.getApproved(),
      api.enrollments.getMyEnrollments(),
    ]);

    if (cRes.success && cRes.courses) {
      setCourses(cRes.courses);
    }

    if (eRes.success && eRes.enrollments) {
      setMyEnrollments(eRes.enrollments);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (courseId: number) => {
    setIsSubmitting(true);
    const res = await api.enrollments.enroll(courseId);
    setIsSubmitting(false);

    if (res.success) {
      setToast({
        message: 'Enrollment request submitted successfully! An administrator will review and approve your request.',
        type: 'info',
      });
      fetchData();
      setSelectedCourseModal(null);
    } else {
      setToast({ message: res.message || 'You already have an active or pending enrollment for this course.', type: 'error' });
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Browse Course Catalog</h2>
          <p className="text-xs text-slate-500">
            Select courses to enroll. All student enrollments are reviewed and approved by Platform Administrators.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search approved courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-slate-400 text-xs font-semibold">
          Loading courses catalog...
        </Card>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => {
            const enrollment = myEnrollments.find((e) => e.courseId === c.id);

            return (
              <Card key={c.id} hoverable className="flex flex-col justify-between h-full space-y-4 border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                      Approved Course
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">{c.instructorName}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mb-2 leading-snug">{c.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">{c.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCourseModal(c)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </button>

                  {enrollment?.status === 'APPROVED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Enrolled</span>
                    </span>
                  ) : enrollment?.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>Pending Approval</span>
                    </span>
                  ) : enrollment?.status === 'REJECTED' ? (
                    <Button
                      variant="amber"
                      size="sm"
                      isLoading={isSubmitting}
                      onClick={() => handleEnroll(c.id)}
                    >
                      Re-Apply
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isSubmitting}
                      onClick={() => handleEnroll(c.id)}
                      className="font-bold text-xs"
                    >
                      Request Enrollment
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No approved courses available yet."
          description="When instructors submit new courses and administrators approve them, they will appear here."
          icon={<Compass className="w-12 h-12 text-slate-300" />}
        />
      )}

      {/* Course Details Modal */}
      {selectedCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <button onClick={() => setSelectedCourseModal(null)} className="absolute top-4 right-4 text-slate-400 p-1">
              <X className="w-5 h-5" />
            </button>

            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
              Verified Curriculum
            </span>

            <h3 className="text-lg font-black text-slate-900">{selectedCourseModal.title}</h3>
            <p className="text-xs text-slate-500">Instructor: {selectedCourseModal.instructorName}</p>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">Description:</p>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedCourseModal.description}
              </p>
            </div>

            {selectedCourseModal.syllabus && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800">Syllabus Outline:</p>
                <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedCourseModal.syllabus}
                </pre>
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Approval Notice:</strong> After you request enrollment, a platform administrator will review and approve your request before course materials unlock.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedCourseModal(null)}>
                Close
              </Button>
              {(() => {
                const enr = myEnrollments.find((e) => e.courseId === selectedCourseModal.id);
                if (enr?.status === 'APPROVED') {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enrolled
                    </span>
                  );
                }
                if (enr?.status === 'PENDING') {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      Pending Approval
                    </span>
                  );
                }
                return (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    onClick={() => handleEnroll(selectedCourseModal.id)}
                    className="font-bold"
                  >
                    Request Enrollment
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
