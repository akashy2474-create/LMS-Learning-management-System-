export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  syllabus: string;
  termCode?: string;
  instructorId: number;
  instructorName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  studentCount?: number;
}

export interface Enrollment {
  id: number;
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  courseId: number;
  courseTitle?: string;
  instructorName?: string;
  termCode?: string;
  progress: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  enrolledAt: string;
  completedAt?: string;
  lastActivity?: string;
}

export interface CourseMaterial {
  id: number;
  courseId: number;
  title: string;
  description: string;
  content: string;
  pdfData?: string;
  materialType: 'Lecture' | 'Article' | 'Lesson' | 'Resource' | 'PDF';
  createdAt: string;
  completed?: boolean;
}

export interface Message {
  id: number;
  senderId: number;
  senderName?: string;
  receiverId: number;
  receiverName?: string;
  courseId: number;
  courseTitle?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemSettings {
  id: number;
  platformName: string;
  platformEmail: string;
  allowStudentRegistration: boolean;
  allowInstructorRegistration: boolean;
  updatedAt?: string;
}

export interface AnalyticsData {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalCourses: number;
  pendingCourses: number;
  approvedCourses: number;
  rejectedCourses: number;
  totalEnrollments: number;
}
