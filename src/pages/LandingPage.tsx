import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/ui/Navbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Course } from '../types/auth';
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Search,
  Compass,
  Star,
  Clock,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.courses) {
          setCourses(data.courses);
        }
      })
      .catch((err) => console.error('Failed to load courses:', err));
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Soft background decor blobs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-200/30 blur-3xl rounded-full -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Text Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Next-Generation Learning Management System</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Learn. Grow. <span className="text-blue-600 underline decoration-amber-400 decoration-wavy decoration-2">Achieve.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Empowering students and instructors with a modern, friendly educational ecosystem. Discover structured
                courses, master in-demand skills, and track your learning progress seamlessly.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a href="#courses" className="w-full sm:w-auto">
                  <Button variant="amber" size="lg" className="w-full sm:w-auto">
                    <span>Explore Courses</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </a>
                <Link to="/register" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Get Started Free
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-200/60 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Verified Instructors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Interactive Content</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Role-Based Access</span>
                </div>
              </div>
            </div>

            {/* Hero Educational Illustration Component */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Visual Card Decor */}
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-amber-400 text-amber-950 font-bold text-xs rounded-full shadow-xs">
                      Live LMS
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-2">Interactive Study Portal</h3>
                  <p className="text-blue-100 text-xs mb-6 leading-relaxed">
                    Designed for students, instructors, and administrators with clean workflows.
                  </p>

                  <div className="space-y-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Course Progress</span>
                      <span className="text-amber-300">85% Completed</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-amber-400 h-2 rounded-full w-[85%]" />
                    </div>
                  </div>
                </div>

                {/* Floating Stat Card 1 */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Curated Modules</p>
                    <p className="text-sm font-bold text-slate-900">Industry Standard</p>
                  </div>
                </div>

                {/* Floating Stat Card 2 */}
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Certification</p>
                    <p className="text-sm font-bold text-slate-900">Verified Credentials</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Designed for Real Educational Impact
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Everything you need to manage courses, teach students, and track academic growth in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Learn from Instructors</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect with qualified educators, access comprehensive course syllabi, and receive expert guidance on
                every step of your learning path.
              </p>
            </Card>

            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Track Your Progress</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Monitor your study milestones, complete course modules, and view your personal academic dashboard with
                transparent statistics.
              </p>
            </Card>

            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Explore Courses</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Browse through diverse subjects including Full-Stack Java Development, Computer Science Algorithms,
                and DevOps Engineering.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Course Catalog Section */}
      <section id="courses" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Catalog</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Explore Available Courses</h2>
          </div>

          {/* Search Filter Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} hoverable className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg">
                      Java & Web
                    </span>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {course.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{course.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">{course.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {course.instructorName ? course.instructorName.charAt(0) : 'I'}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                      {course.instructorName || 'Instructor'}
                    </span>
                  </div>

                  <Link to="/register">
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600">
                      Enroll <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No courses matching your search</h3>
            <p className="text-xs text-slate-500 mt-1">Try searching for Java, Web, or Algorithms.</p>
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-slate-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">About Our Platform</span>
              <h2 className="text-3xl font-extrabold tracking-tight">Built with Core Java Servlets & Modern React</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                This Learning Management System is engineered using a robust full-stack architecture. The backend is
                powered by Core Java, Jakarta Servlets, JDBC, and MySQL database, while the frontend offers a responsive,
                soft-shadowed, human-centered UI built with React.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link to="/register">
                  <Button variant="amber" size="md">
                    Join LMS Today
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="md" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                    Existing User Login
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span>Platform Architecture & Security</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Secure Password Hashing with BCrypt</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>HttpSession-based Authentication & Authorization Filter</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Role-Based Redirection (ADMIN, INSTRUCTOR, STUDENT)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>PreparedStatements & DAO Data Access Pattern</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Online Learning Management System. All rights reserved.</p>
            <p className="text-slate-500">Core Java Servlet & React LMS</p>
          </div>
        </div>
      </section>
    </div>
  );
};
