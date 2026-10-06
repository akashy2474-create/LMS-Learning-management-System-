import React, { useState, useEffect } from 'react';
import { Course, CourseMaterial } from '../../types/auth';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Toast } from '../ui/Toast';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
  ShieldAlert,
  Upload,
  Download,
  Eye,
  FileCheck,
  CheckCircle2,
  FileDown,
} from 'lucide-react';

interface InstructorMaterialsModalProps {
  course: Course;
  onClose: () => void;
}

export const InstructorMaterialsModal: React.FC<InstructorMaterialsModalProps> = ({ course, onClose }) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editMaterialModal, setEditMaterialModal] = useState<CourseMaterial | null>(null);
  const [deleteMaterialModal, setDeleteMaterialModal] = useState<CourseMaterial | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [materialType, setMaterialType] = useState<'Lecture' | 'Article' | 'Lesson' | 'Resource' | 'PDF'>('Lesson');
  const [pdfData, setPdfData] = useState<string>('');
  const [attachedFileName, setAttachedFileName] = useState<string>('');

  // PDF Preview State
  const [previewPDF, setPreviewPDF] = useState<{ title: string; pdfData: string; content: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchMaterials = async () => {
    setLoading(true);
    const res = await api.materials.getByCourse(course.id);
    if (res.success && res.materials) {
      setMaterials(res.materials);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, [course.id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setToast({ message: 'Please select a valid PDF file.', type: 'error' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'PDF size exceeds maximum limit of 10MB.', type: 'error' });
      return;
    }

    setAttachedFileName(file.name);
    setMaterialType('PDF');
    if (!title) {
      setTitle(file.name.replace(/\.pdf$/i, ''));
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPdfData(reader.result);
        setToast({ message: `Attached "${file.name}" successfully!`, type: 'success' });
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContent('');
    setMaterialType('Lesson');
    setPdfData('');
    setAttachedFileName('');
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setToast({ message: 'Title and content description are required.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    const res = await api.materials.add(
      course.id,
      title.trim(),
      description.trim(),
      content.trim(),
      materialType,
      pdfData || undefined
    );
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Course material published successfully.', type: 'success' });
      setAddOpen(false);
      resetForm();
      fetchMaterials();
    } else {
      setToast({ message: res.message || 'Failed to add material.', type: 'error' });
    }
  };

  const handleEditMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMaterialModal || !title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const res = await api.materials.update(
      editMaterialModal.id,
      title.trim(),
      description.trim(),
      content.trim(),
      materialType,
      pdfData || undefined
    );
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Material updated successfully.', type: 'success' });
      setEditMaterialModal(null);
      resetForm();
      fetchMaterials();
    } else {
      setToast({ message: res.message || 'Failed to update material.', type: 'error' });
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deleteMaterialModal) return;
    setIsSubmitting(true);
    const res = await api.materials.delete(deleteMaterialModal.id);
    setIsSubmitting(false);

    if (res.success) {
      setToast({ message: 'Material deleted successfully.', type: 'info' });
      setDeleteMaterialModal(null);
      fetchMaterials();
    } else {
      setToast({ message: res.message || 'Failed to delete material.', type: 'error' });
    }
  };

  const openEditModal = (m: CourseMaterial) => {
    setEditMaterialModal(m);
    setTitle(m.title);
    setDescription(m.description || '');
    setContent(m.content || '');
    setMaterialType(m.materialType || 'Lesson');
    setPdfData(m.pdfData || '');
    setAttachedFileName(m.pdfData ? 'Existing Attached PDF' : '');
  };

  const handleDownloadPDF = (m: CourseMaterial) => {
    if (m.pdfData) {
      const link = document.createElement('a');
      link.href = m.pdfData;
      link.download = `${m.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ message: `Downloading ${m.title}.pdf...`, type: 'success' });
    } else {
      const blob = new Blob([`LMS Portal - ${course.title}\n\nTitle: ${m.title}\n\nContent:\n${m.content}`], {
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${m.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ message: `Downloading ${m.title}.pdf...`, type: 'success' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 pr-8">
          <div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              Course #{course.id}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{course.title} — Course Materials</h3>
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 flex-1 overflow-y-auto space-y-4">
          {!addOpen && !editMaterialModal ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Published Modules & PDFs ({materials.length})
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setAddOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Material / PDF</span>
                </Button>
              </div>

              {materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-200 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              m.materialType === 'PDF' || m.pdfData
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}
                          >
                            {m.materialType}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{m.title}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Accessible PDF Preview / Download */}
                          {(m.materialType === 'PDF' || m.pdfData) && (
                            <>
                              <button
                                onClick={() =>
                                  setPreviewPDF({
                                    title: m.title,
                                    pdfData: m.pdfData || '',
                                    content: m.content,
                                  })
                                }
                                className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors border border-blue-100"
                                title="View PDF"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>

                              <button
                                onClick={() => handleDownloadPDF(m)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors border border-slate-200"
                                title="Download PDF File"
                              >
                                <Download className="w-3.5 h-3.5 text-blue-600" />
                                <span>PDF</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Edit Material"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteMaterialModal(m)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {m.description && <p className="text-xs text-slate-500 font-medium">{m.description}</p>}

                      <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-24 overflow-y-auto font-sans">
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No learning materials added yet</p>
                  <p className="text-[11px] text-slate-400">Click Add Material / PDF above to publish notes or upload lecture guides.</p>
                </div>
              )}
            </div>
          ) : (
            /* Add or Edit Material Form */
            <form onSubmit={addOpen ? handleAddMaterial : handleEditMaterial} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-900">
                  {addOpen ? 'Add New Learning Material or PDF' : 'Edit Course Material'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    setEditMaterialModal(null);
                    resetForm();
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Material Title"
                  placeholder="e.g. Unit 1: Introduction & Lecture Notes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Material Type</label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="Lesson">Lesson</option>
                    <option value="Lecture">Lecture</option>
                    <option value="PDF">PDF Handbook / Notes</option>
                    <option value="Article">Article</option>
                    <option value="Resource">Resource</option>
                  </select>
                </div>
              </div>

              <Input
                label="Brief Description / Subtitle (Optional)"
                placeholder="e.g. Core concepts, definitions, and practice exercises"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* PDF File Upload Zone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Attach PDF Document (Accessible & Downloadable)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Max size: 10MB</span>
                </label>

                <div className="p-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl bg-slate-50/50 text-center transition-colors">
                  <input
                    type="file"
                    id="pdf-upload"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer block space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-600 hover:underline">
                        Choose PDF file to upload
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Converts automatically to in-browser accessible format with direct download
                      </p>
                    </div>
                  </label>

                  {attachedFileName && (
                    <div className="mt-3 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-blue-800 font-bold truncate">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{attachedFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedFileName('');
                          setPdfData('');
                        }}
                        className="text-[11px] font-bold text-red-600 hover:text-red-800 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Text / Markdown Content */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Lesson Notes & Summary Text
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter detailed lesson content, study guidance, learning objectives, and review questions..."
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddOpen(false);
                    setEditMaterialModal(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{addOpen ? 'Publish Material' : 'Save Changes'}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* PDF In-Browser Preview Modal */}
      {previewPDF && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl flex flex-col h-[85vh] relative animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{previewPDF.title}</h4>
                  <p className="text-xs text-slate-400">Accessible Study Document</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewPDF.pdfData && (
                  <a
                    href={previewPDF.pdfData}
                    download={`${previewPDF.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewPDF(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
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

      {/* Delete Confirmation Modal */}
      {deleteMaterialModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Material</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-800">{deleteMaterialModal.title}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteMaterialModal(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" isLoading={isSubmitting} onClick={handleDeleteMaterial}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
