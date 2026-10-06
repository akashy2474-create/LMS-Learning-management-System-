import React, { useState, useEffect } from 'react';
import { Enrollment } from '../../types/auth';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { TrendingUp, BookOpen, Award, CheckCircle2 } from 'lucide-react';

export const StudentProgressTab: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.enrollments.getMyEnrollments()
      .then((res) => {
        if (res.success && res.enrollments) setEnrollments(res.enrollments);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalEnrolled = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.progress >= 100).length;
  const avgProgress =
    totalEnrolled > 0
      ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / totalEnrolled)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Learning Progress Dashboard</h2>
        <p className="text-xs text-slate-500">Track your completed lessons, course percentages, and academic milestones</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverable className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Enrolled Courses</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{totalEnrolled}</p>
          </div>
        </Card>

        <Card hoverable className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Completed Courses</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{completedCourses}</p>
          </div>
        </Card>

        <Card hoverable className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Average Progress</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{avgProgress}%</p>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Detailed Course Breakdown</h3>

        {enrollments.length > 0 ? (
          <div className="space-y-4">
            {enrollments.map((e) => (
              <div key={e.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{e.courseTitle}</h4>
                  <span className="font-black text-sm text-blue-700 tabular-nums">{e.progress}%</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${e.progress}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400">
                  Instructor: {e.instructorName} · Enrolled {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : 'Recent'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="You haven't enrolled in any course yet."
            description="Enroll in a course from the catalog to track your learning progress."
            icon="course"
          />
        )}
      </Card>
    </div>
  );
};
