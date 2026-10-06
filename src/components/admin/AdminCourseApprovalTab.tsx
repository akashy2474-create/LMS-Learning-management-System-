import React, { useState, useEffect } from 'react';
import { Course, Enrollment } from '../../types/auth';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Toast } from '../ui/Toast';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  BookOpen,
  Eye,
  User,
  Calendar,
  Users,
  Search,
  Filter,
  Clock,
  ShieldCheck,
  Mail,
  GraduationCap,
} from 'lucide-react';

export const AdminCourseApprovalTab: React.FC = () => {
  // Main view switcher: Course Approvals vs Student Enrollment Approvals
  const [activeApprovalView, setActiveApprovalView] = useState<'COURSES' | 'ENROLLMENTS'>('ENROLLMENTS');

  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseStatusFilter, setCourseStatusFilter] = useState<string>('ALL');
  const [courseSearch, setCourseSearch] = useState('');
  const [rejectModalCourse, setRejectModalCourse] = useState<Course | null>(null);
  const [viewCourseModal, setViewCourseModal] = useState<Course | null>(null);
  const [courseRejectionReason, setCourseRejectionReason] = useState('');

  // Enrollments state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<string>('ALL');
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [rejectModalEnrollment, setRejectModalEnrollment] = useState<Enrollment | null>(null);
  const [enrollmentRejectionReason, setEnrollmentRejectionReason] = useState('');

  // Global state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchCourses = async () => {
    setCourseLoading(true);
    const res = await api.courses.getAll();
    if (res.success && res.courses) {
      setCourses(res.courses);
    }
    setCourseLoading(false);
  };

  const fetchEnrollments = async () => {
    setEnrollmentLoading(true);
    const res = await api.enrollments.getAdminEnrollments();
    if (res.success && res.enrollments) {
      setEnrollments(res.enrollments);
    }
    setEnrollmentLoading(false);
  };

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, []);

  // Course handlers
  const handleApproveCourse = async (courseId: number) => {
    setIsSubmitting(true);
    const res = await api.courses.approve(courseId);
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Course approved successfully.', type: 'success' });
      if (viewCourseModal && viewCourseModal.id === courseId) {
        setViewCourseModal(null);
      }
      fetchCourses();
    } else {
      setToast({ message: res.message || 'Failed to approve course.', type: 'error' });
    }
  };

  const handleRejectCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalCourse) return;
    setIsSubmitting(true);
    const res = await api.courses.reject(rejectModalCourse.id, courseRejectionReason);
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Course rejected.', type: 'info' });
      setRejectModalCourse(null);
      if (viewCourseModal && viewCourseModal.id === rejectModalCourse.id) {
        setViewCourseModal(null);
      }
      setCourseRejectionReason('');
      fetchCourses();
    } else {
      setToast({ message: res.message || 'Failed to reject course.', type: 'error' });
    }
  };

  // Enrollment handlers
  const handleApproveEnrollment = async (enrollmentId: number) => {
    setIsSubmitting(true);
    const res = await api.enrollments.approveEnrollment(enrollmentId);
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Student enrollment approved! Student can now access the course.', type: 'success' });
      fetchEnrollments();
    } else {
      setToast({ message: res.message || 'Failed to approve enrollment.', type: 'error' });
    }
  };

  const handleRejectEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalEnrollment) return;
    setIsSubmitting(true);
    const res = await api.enrollments.rejectEnrollment(rejectModalEnrollment.id, enrollmentRejectionReason);
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Student enrollment request rejected.', type: 'info' });
      setRejectModalEnrollment(null);
      setEnrollmentRejectionReason('');
      fetchEnrollments();
    } else {
      setToast({ message: res.message || 'Failed to reject enrollment.', type: 'error' });
    }
  };

  // Counts
  const pendingCoursesCount = courses.filter((c) => c.status === 'PENDING').length;
  const pendingEnrollmentsCount = enrollments.filter((e) => e.status === 'PENDING').length;
  const approvedEnrollmentsCount = enrollments.filter((e) => e.status === 'APPROVED').length;
  const rejectedEnrollmentsCount = enrollments.filter((e) => e.status === 'REJECTED').length;

  // Filtered lists
  const filteredCourses = courses.filter((c) => {
    const matchesFilter = courseStatusFilter === 'ALL' || c.status === courseStatusFilter;
    const matchesSearch =
      c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(courseSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesFilter = enrollmentStatusFilter === 'ALL' || e.status === enrollmentStatusFilter;
    const matchesSearch =
      (e.studentName && e.studentName.toLowerCase().includes(enrollmentSearch.toLowerCase())) ||
      (e.studentEmail && e.studentEmail.toLowerCase().includes(enrollmentSearch.toLowerCase())) ||
      (e.courseTitle && e.courseTitle.toLowerCase().includes(enrollmentSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Pending Approval
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header with Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Platform Approvals Hub
          </h2>
          <p className="text-xs text-slate-500">
            Manage course approval requests from instructors and student course enrollment requests
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveApprovalView('ENROLLMENTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeApprovalView === 'ENROLLMENTS'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Enrollments</span>
            {pendingEnrollmentsCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full animate-pulse">
                {pendingEnrollmentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveApprovalView('COURSES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeApprovalView === 'COURSES'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Course Approvals</span>
            {pendingCoursesCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full">
                {pendingCoursesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: STUDENT ENROLLMENT APPROVALS (PRIMARY USER REQUEST)     */}
      {/* ============================================================== */}
      {activeApprovalView === 'ENROLLMENTS' && (
        <div className="space-y-6">
          {/* Enrollment KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200 bg-white">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Requests</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{enrollments.length}</p>
            </Card>

            <Card className="p-4 border-amber-200 bg-amber-50/50">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Pending Admin Approval
              </span>
              <p className="text-2xl font-black text-amber-700 mt-1">{pendingEnrollmentsCount}</p>
            </Card>

            <Card className="p-4 border-emerald-200 bg-emerald-50/50">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approved Students
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{approvedEnrollmentsCount}</p>
            </Card>

            <Card className="p-4 border-rose-200 bg-rose-50/50">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Rejected Requests
              </span>
              <p className="text-2xl font-black text-rose-700 mt-1">{rejectedEnrollmentsCount}</p>
            </Card>
          </div>

          {/* Search & Filter Toolbar */}
          <Card className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student name, email, or course..."
                  value={enrollmentSearch}
                  onChange={(e) => setEnrollmentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filter:
                </span>
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setEnrollmentStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      enrollmentStatusFilter === status
                        ? status === 'PENDING'
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                          : 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'ALL' ? 'All Requests' : status.charAt(0) + status.slice(1).toLowerCase()}
                    {status === 'PENDING' && pendingEnrollmentsCount > 0 && ` (${pendingEnrollmentsCount})`}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Enrollments Table */}
          {enrollmentLoading ? (
            <Card className="p-12 text-center text-slate-400 text-xs font-semibold">
              Loading student enrollment requests...
            </Card>
          ) : filteredEnrollments.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12 text-slate-300" />}
              title="No Enrollment Requests Found"
              description={
                enrollmentSearch || enrollmentStatusFilter !== 'ALL'
                  ? 'No student enrollments match your current filters.'
                  : 'New student course enrollments will appear here for Admin review and approval.'
              }
            />
          ) : (
            <Card className="overflow-hidden border-slate-200 p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Student Details</th>
                      <th className="py-3.5 px-4">Enrolled Course</th>
                      <th className="py-3.5 px-4">Instructor</th>
                      <th className="py-3.5 px-4">Requested Date</th>
                      <th className="py-3.5 px-4">Approval Status</th>
                      <th className="py-3.5 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredEnrollments.map((enr) => (
                      <tr
                        key={enr.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          enr.status === 'PENDING' ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs shrink-0">
                              {enr.studentName ? enr.studentName.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900">{enr.studentName || 'Student'}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-300" />
                                {enr.studentEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[220px] truncate">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="truncate">{enr.courseTitle}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {enr.instructorName || 'Prof. Faculty'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                          {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : 'Recent'}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(enr.status)}
                          {enr.status === 'REJECTED' && enr.rejectionReason && (
                            <p className="text-[10px] text-rose-500 mt-0.5 truncate max-w-[150px]" title={enr.rejectionReason}>
                              {enr.rejectionReason}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {enr.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleApproveEnrollment(enr.id)}
                                  isLoading={isSubmitting}
                                  className="!bg-emerald-600 hover:!bg-emerald-700 text-white font-bold"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRejectModalEnrollment(enr);
                                    setEnrollmentRejectionReason('');
                                  }}
                                  className="!text-rose-600 !border-rose-200 hover:!bg-rose-50 font-bold"
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {enr.status === 'APPROVED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRejectModalEnrollment(enr);
                                  setEnrollmentRejectionReason('Revoked by Administrator');
                                }}
                                className="text-slate-500 hover:text-rose-600 text-xs"
                              >
                                Revoke
                              </Button>
                            )}

                            {enr.status === 'REJECTED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveEnrollment(enr.id)}
                                isLoading={isSubmitting}
                                className="!text-emerald-600 !border-emerald-200 hover:!bg-emerald-50 text-xs font-bold"
                              >
                                Re-Approve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: COURSE APPROVALS (INSTRUCTOR SUBMITTED COURSES)        */}
      {/* ============================================================== */}
      {activeApprovalView === 'COURSES' && (
        <div className="space-y-6">
          {/* Course Status Filters */}
          <Card className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search courses or instructor..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setCourseStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      courseStatusFilter === status
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'ALL' ? 'All Courses' : status.charAt(0) + status.slice(1).toLowerCase()}
                    {status === 'PENDING' && pendingCoursesCount > 0 && ` (${pendingCoursesCount})`}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Courses List */}
          {courseLoading ? (
            <Card className="p-12 text-center text-slate-400 text-xs font-semibold">
              Loading courses for review...
            </Card>
          ) : filteredCourses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-12 h-12 text-slate-300" />}
              title="No Courses Found"
              description="No courses match your filter criteria."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((c) => (
                <Card key={c.id} className="flex flex-col justify-between border-slate-200 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Course #{c.id}
                      </span>
                      {getStatusBadge(c.status)}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2">
                      {c.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {c.description || 'No description provided.'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {c.instructorName || 'Instructor'}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    {c.status === 'REJECTED' && c.rejectionReason && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                        <span className="font-bold block">Rejection Reason:</span>
                        {c.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewCourseModal(c)}
                      className="text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View Details
                    </Button>

                    <div className="flex items-center gap-1.5">
                      {c.status !== 'APPROVED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveCourse(c.id)}
                          isLoading={isSubmitting}
                          className="!bg-emerald-600 hover:!bg-emerald-700 text-white font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                      )}

                      {c.status !== 'REJECTED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRejectModalCourse(c);
                            setCourseRejectionReason('');
                          }}
                          className="!text-rose-600 !border-rose-200 hover:!bg-rose-50 font-bold"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: REJECT STUDENT ENROLLMENT MODAL                       */}
      {/* ============================================================== */}
      {rejectModalEnrollment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Reject Student Enrollment
              </h3>
              <button
                onClick={() => setRejectModalEnrollment(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Rejecting enrollment for student <strong className="text-slate-900">{rejectModalEnrollment.studentName}</strong> in course <strong className="text-slate-900">{rejectModalEnrollment.courseTitle}</strong>.
            </p>

            <form onSubmit={handleRejectEnrollment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  value={enrollmentRejectionReason}
                  onChange={(e) => setEnrollmentRejectionReason(e.target.value)}
                  placeholder="e.g. Prerequisites not met, Batch capacity full, Incomplete profile..."
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectModalEnrollment(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: REJECT COURSE MODAL                                   */}
      {/* ============================================================== */}
      {rejectModalCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Reject Course Submission
              </h3>
              <button
                onClick={() => setRejectModalCourse(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please provide feedback for instructor <strong className="text-slate-900">{rejectModalCourse.instructorName}</strong> on why <strong className="text-slate-900">{rejectModalCourse.title}</strong> is being rejected:
            </p>

            <form onSubmit={handleRejectCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rejection Reason
                </label>
                <textarea
                  value={courseRejectionReason}
                  onChange={(e) => setCourseRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete syllabus, Missing required learning modules..."
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectModalCourse(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: VIEW COURSE DETAILS MODAL                             */}
      {/* ============================================================== */}
      {viewCourseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">{viewCourseModal.title}</h3>
                {getStatusBadge(viewCourseModal.status)}
              </div>
              <button
                onClick={() => setViewCourseModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Course Description:</span>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {viewCourseModal.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Syllabus & Curriculum:</span>
                <div className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-[11px] whitespace-pre-wrap">
                  {viewCourseModal.syllabus || 'No curriculum outline.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Instructor</span>
                  <span className="font-bold text-slate-800">{viewCourseModal.instructorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Submitted Date</span>
                  <span className="font-bold text-slate-800">
                    {viewCourseModal.createdAt ? new Date(viewCourseModal.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setViewCourseModal(null)}>
                Close
              </Button>
              {viewCourseModal.status !== 'APPROVED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApproveCourse(viewCourseModal.id)}
                  isLoading={isSubmitting}
                  className="!bg-emerald-600 hover:!bg-emerald-700 text-white font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Approve Course
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
