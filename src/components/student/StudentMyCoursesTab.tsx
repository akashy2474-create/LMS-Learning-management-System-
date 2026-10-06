import React, { useState, useEffect } from 'react';
import { Enrollment, CourseMaterial } from '../../types/auth';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { EmptyState } from '../ui/EmptyState';
import {
  MoreVertical,
  Search,
  ChevronDown,
  CheckCircle2,
  FileText,
  Download,
  ArrowLeft,
  LogOut,
  ShieldAlert,
  BookOpen,
  Grid,
  List,
  UserCheck,
  Calendar,
  Sparkles,
  Eye,
  X,
  Clock,
  Lock,
  XCircle,
} from 'lucide-react';

interface StudentMyCoursesTabProps {
  onBrowseCatalog?: () => void;
}

export const StudentMyCoursesTab: React.FC<StudentMyCoursesTabProps> = ({ onBrowseCatalog }) => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);

  // Search, Sort, View Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'A-Z' | 'Z-A' | 'recent' | 'progress'>('A-Z');
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');

  // Modals & Menus
  const [unenrollModal, setUnenrollModal] = useState<Enrollment | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [previewPDF, setPreviewPDF] = useState<{ title: string; pdfData: string; content: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchEnrollments = async () => {
    setLoading(true);
    const res = await api.enrollments.getMyEnrollments();
    if (res.success && res.enrollments) {
      setEnrollments(res.enrollments);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const openCoursePlayer = async (enrollment: Enrollment) => {
    if (enrollment.status === 'PENDING') {
      setToast({
        message: 'This course enrollment is currently pending Administrator approval. Course lessons will unlock once approved.',
        type: 'info',
      });
      return;
    }

    if (enrollment.status === 'REJECTED') {
      setToast({
        message: `Enrollment was not approved: ${enrollment.rejectionReason || 'Requirements not met.'}`,
        type: 'error',
      });
      return;
    }

    setActiveEnrollment(enrollment);
    const res = await api.materials.getByCourse(enrollment.courseId);
    if (res.success && res.materials) {
      setMaterials(res.materials);
    }
  };

  const handleCompleteMaterial = async (materialId: number) => {
    if (!activeEnrollment) return;
    const res = await api.materials.complete(materialId, activeEnrollment.courseId);
    if (res.success) {
      setToast({ message: 'Lesson completed! Progress updated.', type: 'success' });
      openCoursePlayer(activeEnrollment);
      fetchEnrollments();
    } else {
      setToast({ message: res.message || 'Error updating lesson progress.', type: 'error' });
    }
  };

  const handleDownloadFile = (material: CourseMaterial) => {
    if (material.pdfData) {
      const link = document.createElement('a');
      link.href = material.pdfData;
      link.download = `${material.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ message: `Downloading ${material.title}.pdf...`, type: 'success' });
    } else {
      // Create text file blob download
      const blob = new Blob([`LMS Portal — Study Material\n\nTitle: ${material.title}\nCourse ID: ${material.courseId}\n\nContent:\n${material.content}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${material.title.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ message: `Downloading ${material.title}_Notes.txt...`, type: 'success' });
    }
  };

  const handleUnenroll = async () => {
    if (!unenrollModal) return;
    setIsSubmitting(true);
    const res = await api.enrollments.unenroll(unenrollModal.courseId);
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Unenrolled from course.', type: 'info' });
      setUnenrollModal(null);
      if (activeEnrollment && activeEnrollment.courseId === unenrollModal.courseId) {
        setActiveEnrollment(null);
      }
      fetchEnrollments();
    } else {
      setToast({ message: res.message || 'Failed to unenroll.', type: 'error' });
    }
  };

  // Abstract educational visuals
  const abstractBanners = [
    'from-blue-600 via-indigo-600 to-blue-700',
    'from-slate-700 via-blue-800 to-indigo-900',
    'from-teal-600 via-cyan-600 to-blue-600',
    'from-indigo-600 via-purple-600 to-blue-700',
    'from-[#1e3a8a] via-blue-700 to-indigo-800',
  ];

  // Filtering & Sorting Logic
  const processedEnrollments = enrollments
    .filter((e) => (e.courseTitle || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const titleA = (a.courseTitle || '').toLowerCase();
      const titleB = (b.courseTitle || '').toLowerCase();
      if (sortBy === 'A-Z') return titleA.localeCompare(titleB);
      if (sortBy === 'Z-A') return titleB.localeCompare(titleA);
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'recent') return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
      return 0;
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {!activeEnrollment ? (
        <div className="space-y-6">
          {/* Top Section */}
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Hi, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Continue learning and build your skills.
            </p>
          </div>

          {/* Main Card Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4">
            <div className="px-6 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
                <p className="text-xs text-slate-500">Courses you're currently enrolled in</p>
              </div>

              {enrollments.length > 0 && (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full w-fit">
                  {enrollments.length} Active Enrollment{enrollments.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Course Filters */}
            <div className="px-6 py-3 bg-slate-50/60 border-y border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 min-w-[220px]">
                <input
                  type="text"
                  placeholder="Search your courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Sort Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="A-Z">Course Name A-Z</option>
                    <option value="Z-A">Course Name Z-A</option>
                    <option value="recent">Recently Enrolled</option>
                    <option value="progress">Progress</option>
                  </select>
                </div>

                {/* Grid / List Toggle */}
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl">
                  <button
                    onClick={() => setViewStyle('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewStyle === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewStyle('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewStyle === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Course Cards Container */}
            <div className="p-6">
              {processedEnrollments.length > 0 ? (
                <div className={viewStyle === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {processedEnrollments.map((e, idx) => {
                    const bannerGradient = abstractBanners[idx % abstractBanners.length];

                    return (
                      <div
                        key={e.id}
                        className={`bg-white rounded-2xl border border-slate-200/90 hover:border-blue-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex ${
                          viewStyle === 'grid' ? 'flex-col h-full justify-between' : 'flex-col sm:flex-row items-center p-4 gap-4'
                        }`}
                      >
                        {/* Course Visual / Banner */}
                        {viewStyle === 'grid' ? (
                          <div
                            onClick={() => openCoursePlayer(e)}
                            className={`h-36 w-full bg-gradient-to-r ${bannerGradient} p-4 flex items-end justify-between cursor-pointer relative group`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            {e.status === 'PENDING' ? (
                              <span className="text-[10px] font-bold text-slate-950 bg-amber-400 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1 shadow-sm animate-pulse">
                                <Clock className="w-3 h-3" />
                                Pending Admin Approval
                              </span>
                            ) : e.status === 'REJECTED' ? (
                              <span className="text-[10px] font-bold text-white bg-rose-600 backdrop-blur-md px-2.5 py-1 rounded-full border border-rose-400 flex items-center gap-1 shadow-sm">
                                <XCircle className="w-3 h-3" />
                                Enrollment Rejected
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-white bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Enrolled
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${bannerGradient} shrink-0 flex items-center justify-center text-white`}>
                            <BookOpen className="w-8 h-8" />
                          </div>
                        )}

                        {/* Card Content */}
                        <div className={`flex-1 flex flex-col justify-between ${viewStyle === 'grid' ? 'p-5 space-y-4' : 'w-full'}`}>
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3
                                onClick={() => openCoursePlayer(e)}
                                className="text-base font-extrabold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer leading-snug line-clamp-2"
                              >
                                {e.courseTitle}
                              </h3>
                            </div>

                            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Instructor: {e.instructorName || 'Academic Faculty'}</span>
                            </p>
                          </div>

                          {/* Status Notice if Pending or Rejected */}
                          {e.status === 'PENDING' && (
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                              <span className="leading-relaxed">
                                <strong>Enrollment Pending:</strong> Waiting for Administrator approval. Course lessons and study materials will unlock once approved.
                              </span>
                            </div>
                          )}

                          {e.status === 'REJECTED' && (
                            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">
                                <strong>Enrollment Not Approved:</strong> {e.rejectionReason || 'Requirements not satisfied.'}
                              </span>
                            </div>
                          )}

                          {/* Progress Section (Active for Approved) */}
                          {e.status === 'APPROVED' && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-600">Course Progress</span>
                                <span className="text-blue-700 tabular-nums">{e.progress}% Complete</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${e.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Footer Actions */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            {e.status === 'APPROVED' ? (
                              <Button variant="primary" size="sm" onClick={() => openCoursePlayer(e)}>
                                <Sparkles className="w-3.5 h-3.5 mr-1" />
                                <span>Continue Learning</span>
                              </Button>
                            ) : e.status === 'PENDING' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="!border-amber-200 !text-amber-800 !bg-amber-50 cursor-not-allowed font-bold"
                              >
                                <Lock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                <span>Pending Admin Approval</span>
                              </Button>
                            ) : (
                              <Button
                                variant="amber"
                                size="sm"
                                onClick={async () => {
                                  const res = await api.enrollments.enroll(e.courseId);
                                  if (res.success) {
                                    setToast({ message: 'Enrollment re-submitted for approval.', type: 'info' });
                                    fetchEnrollments();
                                  }
                                }}
                              >
                                <span>Re-Apply</span>
                              </Button>
                            )}

                            <div className="relative">
                              <button
                                onClick={() => setMenuOpenId(menuOpenId === e.id ? null : e.id)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {menuOpenId === e.id && (
                                <div className="absolute right-0 bottom-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs font-semibold animate-fade-in">
                                  {e.status === 'APPROVED' && (
                                    <button
                                      onClick={() => {
                                        setMenuOpenId(null);
                                        openCoursePlayer(e);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-800 flex items-center gap-2"
                                    >
                                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                      <span>View Materials</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      setUnenrollModal(e);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-red-600 flex items-center gap-2"
                                  >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>{e.status === 'PENDING' ? 'Cancel Request' : 'Unenroll Course'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty State per Spec 12 */
                <div className="py-12 text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">No courses yet</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Explore the course catalog and start learning.
                    </p>
                  </div>
                  <Button variant="primary" size="md" onClick={onBrowseCatalog}>
                    <span>Browse Course Catalog</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Lesson Player & Downloadable Materials */
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <button
              onClick={() => setActiveEnrollment(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Courses</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Course Progress: {activeEnrollment.progress}%
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{activeEnrollment.courseTitle}</h2>
            <p className="text-xs text-slate-500 mt-1">Instructor: {activeEnrollment.instructorName || 'Academic Faculty'}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Course Materials ({materials.length})</h3>

            {materials.length > 0 ? (
              <div className="space-y-4">
                {materials.map((m) => (
                  <div key={m.id} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                          m.materialType === 'PDF' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {m.materialType}
                        </span>

                        <span className="text-xs text-slate-400 font-medium">Material #{m.id}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Accessible PDF In-Browser Preview Button */}
                        {(m.materialType === 'PDF' || m.pdfData) && (
                          <button
                            onClick={() =>
                              setPreviewPDF({
                                title: m.title,
                                pdfData: m.pdfData || '',
                                content: m.content,
                              })
                            }
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-200"
                            title="Read PDF document in browser"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Read PDF</span>
                          </button>
                        )}

                        {/* Real File Download Button */}
                        <button
                          onClick={() => handleDownloadFile(m)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                          title="Download study material"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          <span>Download {m.materialType === 'PDF' || m.pdfData ? 'PDF' : 'Notes'}</span>
                        </button>

                        {m.completed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <Button variant="amber" size="sm" onClick={() => handleCompleteMaterial(m.id)}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Complete</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900">{m.title}</h4>
                      {m.description && <p className="text-xs text-slate-500 mt-1">{m.description}</p>}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Spec 9: No materials available */
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No learning materials available yet.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Your instructor will publish course materials soon.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accessible In-Browser PDF Reader Modal */}
      {previewPDF && (
        <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl flex flex-col h-[85vh] relative animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">{previewPDF.title}</h4>
                  <p className="text-[11px] text-slate-400">Accessible Study Document</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewPDF.pdfData && (
                  <a
                    href={previewPDF.pdfData}
                    download={`${previewPDF.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewPDF(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 py-4 overflow-hidden">
              {previewPDF.pdfData ? (
                <iframe
                  src={previewPDF.pdfData}
                  className="w-full h-full rounded-2xl border border-slate-200"
                  title={previewPDF.title}
                />
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 h-full overflow-y-auto whitespace-pre-wrap text-xs text-slate-800 leading-relaxed font-sans">
                  {previewPDF.content}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unenroll Modal */}
      {unenrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Unenroll Course</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to unenroll from <span className="font-bold text-slate-800">{unenrollModal.courseTitle}</span>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setUnenrollModal(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" isLoading={isSubmitting} onClick={handleUnenroll}>
                Unenroll
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
