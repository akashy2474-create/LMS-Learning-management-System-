import React, { useState, useEffect } from 'react';
import { Course } from '../../types/auth';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { Toast } from '../ui/Toast';
import { InstructorMaterialsModal } from './InstructorMaterialsModal';
import { Plus, Edit2, Trash2, AlertCircle, Users, FileText, X, ShieldAlert } from 'lucide-react';

export const InstructorCoursesTab: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editCourseModal, setEditCourseModal] = useState<Course | null>(null);
  const [deleteCourseModal, setDeleteCourseModal] = useState<Course | null>(null);
  const [materialsCourseModal, setMaterialsCourseModal] = useState<Course | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    const res = await api.courses.getAll();
    if (res.success && res.courses) {
      setCourses(res.courses);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await api.courses.create(title, description, syllabus);
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Course submitted successfully for admin approval.', type: 'success' });
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setSyllabus('');
      fetchCourses();
    } else {
      setToast({ message: res.message || 'Failed to create course.', type: 'error' });
    }
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourseModal) return;
    setIsSubmitting(true);
    const res = await api.courses.update(editCourseModal.id, title, description, syllabus);
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Course updated successfully.', type: 'success' });
      setEditCourseModal(null);
      fetchCourses();
    } else {
      setToast({ message: res.message || 'Failed to update course.', type: 'error' });
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourseModal) return;
    setIsSubmitting(true);
    const res = await api.courses.delete(deleteCourseModal.id);
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Course deleted successfully.', type: 'info' });
      setDeleteCourseModal(null);
      fetchCourses();
    } else {
      setToast({ message: res.message || 'Failed to delete course.', type: 'error' });
    }
  };

  const statusBadgeStyle = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">My Courses</h2>
          <p className="text-xs text-slate-500">Author new courses, manage syllabus modules, and add learning materials</p>
        </div>

        <Button
          variant="amber"
          size="sm"
          onClick={() => {
            setTitle('');
            setDescription('');
            setSyllabus('');
            setCreateModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </Button>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((c) => (
            <Card key={c.id} className="flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border bg-slate-50 text-slate-700">
                    ID: #{c.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${statusBadgeStyle[c.status]}`}>
                    {c.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{c.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 leading-relaxed">
                  {c.description}
                </p>

                {c.status === 'REJECTED' && c.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium flex items-start gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Admin Rejection Reason:</span>
                      <span>{c.rejectionReason}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>{c.studentCount || 0} Enrolled Students</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <Button variant="secondary" size="sm" onClick={() => setMaterialsCourseModal(c)}>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Materials</span>
                  </Button>

                  <button
                    onClick={() => {
                      setEditCourseModal(c);
                      setTitle(c.title);
                      setDescription(c.description);
                      setSyllabus(c.syllabus);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Course"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteCourseModal(c)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="You haven't created any courses yet."
          description="Click 'Create New Course' to author a subject syllabus and submit it for admin approval."
          actionText="Create Course"
          onAction={() => setCreateModalOpen(true)}
          icon="course"
        />
      )}

      {/* Create Course Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <button onClick={() => setCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900">Create New Course</h3>
            <p className="text-xs text-slate-500">Course will be saved as PENDING for admin review.</p>

            <form onSubmit={handleCreateCourse} className="space-y-3">
              <Input label="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Syllabus Outline</label>
                <textarea
                  rows={4}
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="Module 1: ...&#10;Module 2: ..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="amber" size="sm" type="submit" isLoading={isSubmitting}>
                  Submit Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <button onClick={() => setEditCourseModal(null)} className="absolute top-4 right-4 text-slate-400 p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900">Edit Course</h3>

            <form onSubmit={handleEditCourse} className="space-y-3">
              <Input label="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Syllabus Outline</label>
                <textarea
                  rows={4}
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setEditCourseModal(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {deleteCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Course Permanently?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-800">{deleteCourseModal.title}</span>? This will cascade-delete all associated course materials, student enrollments, and messages from the database.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteCourseModal(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" isLoading={isSubmitting} onClick={handleDeleteCourse}>
                Delete Course
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Materials Modal */}
      {materialsCourseModal && (
        <InstructorMaterialsModal course={materialsCourseModal} onClose={() => setMaterialsCourseModal(null)} />
      )}
    </div>
  );
};
