import React, { useState, useEffect } from 'react';
import { AnalyticsData } from '../../types/auth';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Users, BookOpen, GraduationCap, Award, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react';

export const AdminAnalyticsTab: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.analytics.get()
      .then((res) => {
        if (res.success && res.analytics) {
          setAnalytics(res.analytics);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Performance Analytics</h2>
        <p className="text-xs text-slate-500">Real database metrics and enrollment ratios from MySQL</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Users</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{analytics.totalUsers}</p>
          </div>
        </Card>

        <Card hoverable className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Students</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{analytics.totalStudents}</p>
          </div>
        </Card>

        <Card hoverable className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Instructors</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{analytics.totalInstructors}</p>
          </div>
        </Card>

        <Card hoverable className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Courses</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{analytics.totalCourses}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Course Status Breakdown</span>
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved Courses
                </span>
                <span className="tabular-nums font-bold">{analytics.approvedCourses}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${analytics.totalCourses > 0 ? (analytics.approvedCourses / analytics.totalCourses) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <Clock className="w-3.5 h-3.5" /> Pending Approvals
                </span>
                <span className="tabular-nums font-bold">{analytics.pendingCourses}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: `${analytics.totalCourses > 0 ? (analytics.pendingCourses / analytics.totalCourses) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-red-700">
                  <XCircle className="w-3.5 h-3.5" /> Rejected Courses
                </span>
                <span className="tabular-nums font-bold">{analytics.rejectedCourses}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${analytics.totalCourses > 0 ? (analytics.rejectedCourses / analytics.totalCourses) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Platform Activity & Enrollments</span>
          </h3>

          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
            <p className="text-xs text-blue-900 font-bold">Total Course Enrollments</p>
            <p className="text-3xl font-black text-blue-700 tabular-nums">{analytics.totalEnrollments}</p>
            <p className="text-[11px] text-blue-600">Calculated from student enrollment records in MySQL.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
