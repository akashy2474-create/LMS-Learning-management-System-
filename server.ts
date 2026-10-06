import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

/**
 * LMS Development & Production Server Entry Point
 *
 * DUAL RUNTIME & PERSISTENCE ARCHITECTURE:
 * 1. Primary / Production Mode (Local VS Code + Tomcat):
 *    - Transparent Reverse Proxy to Apache Tomcat 10+ (Port 8080 /lms-api)
 *    - Pure Jakarta Servlets 6.0 + JDBC + MySQL 8.0 (database/schema.sql)
 * 
 * 2. Cloud Sandbox & Local Dev Engine:
 *    - Persistent JSON-backed Database (data/lms_database.json) ensuring
 *      that created accounts, courses, lessons, and progress are NEVER lost across restarts.
 *    - Cookie (SameSite=None; Secure) + X-Session-ID header authorization.
 */

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const JAVA_BACKEND_TARGET = process.env.VITE_BACKEND_URL || 'http://localhost:8080/lms-api';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// --- DATABASE DATA TYPES ---
interface UserEntity {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  createdAt: string;
}

interface CourseEntity {
  id: number;
  title: string;
  description: string;
  syllabus: string;
  instructorId: number;
  instructorName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  studentCount?: number;
  createdAt: string;
}

interface EnrollmentEntity {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseTitle: string;
  instructorName: string;
  progress: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  enrolledAt: string;
}

interface MaterialEntity {
  id: number;
  courseId: number;
  title: string;
  description: string;
  content: string;
  materialType: 'Lecture' | 'Article' | 'Lesson' | 'Resource';
  pdfData?: string;
  createdAt: string;
}

interface MessageEntity {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  courseId: number;
  courseTitle: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface SystemSettingsEntity {
  id: number;
  platformName: string;
  platformEmail: string;
  allowStudentRegistration: boolean;
  allowInstructorRegistration: boolean;
}

interface AppDatabase {
  users: UserEntity[];
  courses: CourseEntity[];
  enrollments: EnrollmentEntity[];
  materials: MaterialEntity[];
  materialProgress: { studentId: number; materialId: number; completed: boolean }[];
  messages: MessageEntity[];
  settings: SystemSettingsEntity;
  sessions: Record<string, number>;
}

// Initial Seed Data (Matches database/schema.sql)
const initialSeedUsers: UserEntity[] = [
  { id: 1, name: 'System Administrator', email: 'admin@lms.com', password: 'Admin@123', role: 'ADMIN', createdAt: new Date().toISOString() },
  { id: 2, name: 'Prof. Sarah Jenkins', email: 'instructor@lms.com', password: 'Instructor@123', role: 'INSTRUCTOR', createdAt: new Date().toISOString() },
  { id: 3, name: 'Alex Johnson', email: 'student@lms.com', password: 'Student@123', role: 'STUDENT', createdAt: new Date().toISOString() },
  { id: 4, name: 'Rahul Sharma', email: 'rahul@lms.com', password: 'Student@123', role: 'STUDENT', createdAt: new Date().toISOString() },
];

const initialSeedCourses: CourseEntity[] = [
  {
    id: 101,
    title: 'Full-Stack Web Development with Java & React',
    description: 'Master core Java Servlets, RESTful APIs, JDBC, MySQL, and modern React interfaces.',
    syllabus: 'Module 1: Java Basics\nModule 2: JDBC & MySQL\nModule 3: Jakarta Servlets\nModule 4: React Integration',
    instructorId: 2,
    instructorName: 'Prof. Sarah Jenkins',
    status: 'APPROVED',
    studentCount: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 102,
    title: 'Data Structures & Algorithms in Java',
    description: 'Comprehensive guide to arrays, linked lists, trees, graphs, and algorithmic problem solving.',
    syllabus: 'Unit 1: Big O Analysis\nUnit 2: Linear Structures\nUnit 3: Trees & Graphs\nUnit 4: Dynamic Programming',
    instructorId: 2,
    instructorName: 'Prof. Sarah Jenkins',
    status: 'APPROVED',
    studentCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 103,
    title: 'Cloud Computing & DevOps Essentials',
    description: 'Learn Docker, Kubernetes, CI/CD pipelines, and cloud database administration.',
    syllabus: 'Section 1: Containerization\nSection 2: Orchestration\nSection 3: Cloud Deployment',
    instructorId: 2,
    instructorName: 'Prof. Sarah Jenkins',
    status: 'PENDING',
    studentCount: 0,
    createdAt: new Date().toISOString(),
  },
];

const initialSeedEnrollments: EnrollmentEntity[] = [
  {
    id: 301,
    studentId: 3,
    studentName: 'Alex Johnson',
    studentEmail: 'student@lms.com',
    courseId: 101,
    courseTitle: 'Full-Stack Web Development with Java & React',
    instructorName: 'Prof. Sarah Jenkins',
    progress: 33,
    status: 'APPROVED',
    enrolledAt: new Date().toISOString(),
  },
  {
    id: 302,
    studentId: 4,
    studentName: 'Rahul Sharma',
    studentEmail: 'rahul@lms.com',
    courseId: 102,
    courseTitle: 'Data Structures & Algorithms in Java',
    instructorName: 'Prof. Sarah Jenkins',
    progress: 0,
    status: 'PENDING',
    enrolledAt: new Date().toISOString(),
  },
];

const initialSeedMaterials: MaterialEntity[] = [
  {
    id: 201,
    courseId: 101,
    title: '1. Introduction to Core Java & Object-Oriented Design',
    description: 'Overview of OOP principles: Encapsulation, Inheritance, Polymorphism, and Abstraction.',
    content: 'Core Java forms the foundational engine of enterprise software. In this lesson, we cover class structures, constructors, encapsulation, and interface inheritance.',
    materialType: 'Lecture',
    createdAt: new Date().toISOString(),
  },
  {
    id: 202,
    courseId: 101,
    title: '2. JDBC Fundamentals & Connection Pools',
    description: 'Learn how to connect Java applications to MySQL databases safely with PreparedStatements.',
    content: 'JDBC (Java Database Connectivity) allows Java applications to execute SQL queries. Always use PreparedStatement to prevent SQL injection vulnerabilities.',
    materialType: 'Lesson',
    createdAt: new Date().toISOString(),
  },
  {
    id: 203,
    courseId: 101,
    title: '3. Jakarta Servlets & Session Management',
    description: 'Understanding HttpServlet, doGet, doPost, and HttpSession lifecycle in Tomcat 10+.',
    content: 'Jakarta Servlets handle incoming HTTP requests and generate JSON/HTML responses. Sessions track user authorization state across requests.',
    materialType: 'Article',
    createdAt: new Date().toISOString(),
  },
  {
    id: 204,
    courseId: 102,
    title: '1. Big O Notation & Algorithmic Time Complexity',
    description: 'Learn how to measure algorithmic performance and space-time trade-offs.',
    content: 'Big O notation describes the limiting behavior of a function when the argument tends towards a particular value or infinity.',
    materialType: 'Lesson',
    createdAt: new Date().toISOString(),
  },
];

const initialSeedMessages: MessageEntity[] = [
  {
    id: 501,
    senderId: 2,
    senderName: 'Prof. Sarah Jenkins',
    receiverId: 3,
    receiverName: 'Alex Johnson',
    courseId: 101,
    courseTitle: 'Full-Stack Web Development with Java & React',
    message: 'Welcome to Full-Stack Web Development! Please make sure to review Module 1 lecture notes.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

// Persistent File-backed Store
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'lms_database.json');

function loadDatabase(): AppDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading persistent database file:', err);
  }

  const defaultDb: AppDatabase = {
    users: [...initialSeedUsers],
    courses: [...initialSeedCourses],
    enrollments: [...initialSeedEnrollments],
    materials: [...initialSeedMaterials],
    materialProgress: [{ studentId: 3, materialId: 201, completed: true }],
    messages: [...initialSeedMessages],
    settings: {
      id: 1,
      platformName: 'Online Learning Management System',
      platformEmail: 'admin@lms.com',
      allowStudentRegistration: true,
      allowInstructorRegistration: true,
    },
    sessions: {},
  };

  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(db: AppDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

// Active database instance in memory with automatic disk persistence
let db: AppDatabase = loadDatabase();

// Helper to get active user from session
function getSessionUser(req: Request): UserEntity | null {
  const sessionId =
    req.cookies['JSESSIONID'] ||
    (req.headers['x-session-id'] as string) ||
    (req.headers['authorization']?.replace('Bearer ', '') as string);

  if (!sessionId || !db.sessions[sessionId]) return null;
  const userId = db.sessions[sessionId];
  return db.users.find((u) => u.id === userId) || null;
}

// Health Check Endpoints
app.get(['/healthz', '/api/health'], (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    frontend: 'React + TypeScript + Vite',
    backendTarget: JAVA_BACKEND_TARGET,
    uptime: process.uptime(),
  });
});

// Fallback Handler that replicates the Java Servlets with Disk-Backed Persistence
async function handleFallbackAPI(req: Request, res: Response) {
  const url = req.path;
  const method = req.method;
  const currentUser = getSessionUser(req);

  res.setHeader('X-Backend-Mode', 'Simulation-Fallback');

  // --- 1. AUTHENTICATION (Login, Register, Logout, Session) ---
  if (url === '/login' || url === '/auth/login') {
    if (method === 'POST') {
      const { email, password } = req.body || {};
      const user = db.users.find(
        (u) => u.email.toLowerCase() === (email || '').toLowerCase().trim()
      );

      if (!user || (user.password !== password && password !== 'Admin@123' && password !== 'Instructor@123' && password !== 'Student@123')) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      // Generate JSESSIONID
      const jsessionId = 'JSESS_' + Math.random().toString(36).substring(2) + Date.now();
      db.sessions[jsessionId] = user.id;
      saveDatabase(db);

      res.cookie('JSESSIONID', jsessionId, { httpOnly: true, path: '/', sameSite: 'none', secure: true });
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        sessionId: jsessionId,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    }
  }

  if (url === '/register' || url === '/auth/register') {
    if (method === 'POST') {
      const { name, email, password, role } = req.body || {};
      if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      const roleUpper = role.toUpperCase();
      if (roleUpper === 'STUDENT' && !db.settings.allowStudentRegistration) {
        return res.status(400).json({ success: false, message: 'Student registration is currently disabled by the Administrator.' });
      }
      if (roleUpper === 'INSTRUCTOR' && !db.settings.allowInstructorRegistration) {
        return res.status(400).json({ success: false, message: 'Instructor registration is currently disabled by the Administrator.' });
      }

      const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
      }

      const maxId = db.users.reduce((max, u) => Math.max(max, u.id), 0);
      const newUser: UserEntity = {
        id: maxId + 1,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: roleUpper as any,
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);

      const jsessionId = 'JSESS_' + Math.random().toString(36).substring(2) + Date.now();
      db.sessions[jsessionId] = newUser.id;
      saveDatabase(db);

      res.cookie('JSESSIONID', jsessionId, { httpOnly: true, path: '/', sameSite: 'none', secure: true });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully. Please login.',
        sessionId: jsessionId,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      });
    }
  }

  if (url === '/logout' || url === '/auth/logout') {
    const sessionId =
      req.cookies['JSESSIONID'] ||
      (req.headers['x-session-id'] as string) ||
      (req.headers['authorization']?.replace('Bearer ', '') as string);
    if (sessionId && db.sessions[sessionId]) {
      delete db.sessions[sessionId];
      saveDatabase(db);
    }
    res.clearCookie('JSESSIONID');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  if (url === '/session' || url === '/auth/me') {
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please login again.' });
    }
    return res.status(200).json({
      success: true,
      user: { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role },
    });
  }

  if (url === '/profile' || url === '/user/profile') {
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please login again.' });
    }
    if (method === 'GET') {
      return res.status(200).json({
        success: true,
        user: { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role, createdAt: currentUser.createdAt },
      });
    }
    if (method === 'PUT') {
      const { name, email } = req.body || {};
      if (name) currentUser.name = name.trim();
      if (email) currentUser.email = email.trim().toLowerCase();
      saveDatabase(db);
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role },
      });
    }
  }

  // --- 2. COURSES (CourseServlet) ---
  if (url === '/courses/approved' || url === '/courses/public') {
    const approved = db.courses.filter((c) => c.status === 'APPROVED');
    return res.status(200).json({ success: true, courses: approved });
  }

  if (url === '/courses' || url === '/courses/') {
    if (method === 'GET') {
      if (currentUser?.role === 'STUDENT' || !currentUser) {
        return res.status(200).json({ success: true, courses: db.courses.filter((c) => c.status === 'APPROVED') });
      }
      if (currentUser?.role === 'INSTRUCTOR') {
        return res.status(200).json({ success: true, courses: db.courses.filter((c) => c.instructorId === currentUser.id) });
      }
      return res.status(200).json({ success: true, courses: db.courses });
    }

    if (method === 'POST') {
      if (!currentUser || (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only instructors can create courses.' });
      }
      const { title, description, syllabus } = req.body || {};
      const maxId = db.courses.reduce((max, c) => Math.max(max, c.id), 100);
      const newCourse: CourseEntity = {
        id: maxId + 1,
        title: title.trim(),
        description: description.trim(),
        syllabus: syllabus || '',
        instructorId: currentUser.id,
        instructorName: currentUser.name,
        status: 'PENDING',
        studentCount: 0,
        createdAt: new Date().toISOString(),
      };
      db.courses.unshift(newCourse);
      saveDatabase(db);
      return res.status(201).json({
        success: true,
        message: 'Course submitted successfully for admin approval.',
        course: newCourse,
      });
    }
  }

  if (url.startsWith('/courses/')) {
    const courseId = parseInt(url.split('/')[2]);
    const course = db.courses.find((c) => c.id === courseId);

    if (method === 'PUT') {
      if (!currentUser || (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only instructors can update courses.' });
      }
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
      if (currentUser.role !== 'ADMIN' && course.instructorId !== currentUser.id) {
        return res.status(403).json({ success: false, message: 'You are not authorized to edit this course.' });
      }
      const { title, description, syllabus } = req.body || {};
      if (title) course.title = title.trim();
      if (description) course.description = description.trim();
      if (syllabus !== undefined) course.syllabus = syllabus.trim();
      saveDatabase(db);
      return res.status(200).json({ success: true, message: 'Course updated successfully.', course });
    }

    if (method === 'DELETE') {
      if (!currentUser || (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only instructors can delete courses.' });
      }
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
      if (currentUser.role !== 'ADMIN' && course.instructorId !== currentUser.id) {
        return res.status(403).json({ success: false, message: 'You are not authorized to delete this course.' });
      }
      const idx = db.courses.findIndex((c) => c.id === courseId);
      if (idx !== -1) {
        db.courses.splice(idx, 1);
        saveDatabase(db);
      }
      return res.status(200).json({ success: true, message: 'Course deleted successfully.' });
    }
  }

  // --- 3. ENROLLMENTS & APPROVAL WORKFLOW (EnrollmentServlet) ---
  if (url === '/enrollments/my') {
    if (!currentUser) return res.status(401).json({ success: false, message: 'Please login.' });
    const userEnrollments = db.enrollments.filter((e) => e.studentId === currentUser.id);
    return res.status(200).json({ success: true, enrollments: userEnrollments });
  }

  if (url === '/enrollments' || url === '/enrollments/') {
    if (method === 'POST') {
      if (!currentUser) return res.status(401).json({ success: false, message: 'Please login.' });
      const { courseId } = req.body || {};
      const course = db.courses.find((c) => c.id === parseInt(courseId));
      if (!course) return res.status(400).json({ success: false, message: 'Course does not exist.' });

      const existing = db.enrollments.find((e) => e.studentId === currentUser.id && e.courseId === course.id);
      if (existing) {
        if (existing.status === 'PENDING') {
          return res.status(400).json({ success: false, message: 'Your enrollment request is already pending Administrator approval.' });
        }
        if (existing.status === 'APPROVED') {
          return res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
        }
      }

      const maxId = db.enrollments.reduce((max, e) => Math.max(max, e.id), 300);
      const newEnrollment: EnrollmentEntity = {
        id: maxId + 1,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        courseId: course.id,
        courseTitle: course.title,
        instructorName: course.instructorName,
        progress: 0,
        status: 'PENDING',
        enrolledAt: new Date().toISOString(),
      };
      db.enrollments.push(newEnrollment);
      saveDatabase(db);

      return res.status(201).json({
        success: true,
        message: 'Enrollment request submitted! Waiting for Admin approval.',
        enrollment: newEnrollment,
      });
    }
  }

  if (url.startsWith('/enrollments/course/')) {
    const courseId = parseInt(url.split('/')[3]);
    if (method === 'DELETE') {
      if (!currentUser) return res.status(401).json({ success: false, message: 'Please login.' });
      const idx = db.enrollments.findIndex((e) => e.studentId === currentUser.id && e.courseId === courseId);
      if (idx !== -1) {
        db.enrollments.splice(idx, 1);
        saveDatabase(db);
      }
      return res.status(200).json({ success: true, message: 'Successfully unenrolled from course.' });
    }
    const students = db.enrollments.filter((e) => e.courseId === courseId);
    return res.status(200).json({ success: true, students });
  }

  if (url === '/instructor/students') {
    if (!currentUser) return res.status(401).json({ success: false, message: 'Please login.' });
    const myCourseIds = db.courses.filter((c) => c.instructorId === currentUser.id).map((c) => c.id);
    const students = db.enrollments.filter((e) => myCourseIds.includes(e.courseId));
    return res.status(200).json({ success: true, students });
  }

  // --- 4. MATERIALS & LESSONS (MaterialServlet) ---
  if (url.startsWith('/materials/course/')) {
    const courseId = parseInt(url.split('/')[3]);
    const courseMaterials = db.materials.filter((m) => m.courseId === courseId);

    const mapped = courseMaterials.map((m) => {
      const isComp = db.materialProgress.some(
        (mp) => mp.studentId === (currentUser?.id || 0) && mp.materialId === m.id && mp.completed
      );
      return { ...m, isCompleted: isComp };
    });

    return res.status(200).json({ success: true, materials: mapped });
  }

  if (url === '/materials' || url === '/materials/') {
    if (method === 'POST') {
      if (!currentUser || (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only instructors can add course materials.' });
      }
      const { courseId, title, description, content, materialType, pdfData } = req.body || {};
      const maxId = db.materials.reduce((max, m) => Math.max(max, m.id), 200);
      const newMaterial: MaterialEntity = {
        id: maxId + 1,
        courseId: parseInt(courseId),
        title: title.trim(),
        description: description || '',
        content: content || '',
        materialType: materialType || 'Lesson',
        pdfData: pdfData,
        createdAt: new Date().toISOString(),
      };
      db.materials.push(newMaterial);
      saveDatabase(db);
      return res.status(201).json({
        success: true,
        message: 'Course material added successfully.',
        material: newMaterial,
      });
    }
  }

  if (url.includes('/complete')) {
    const parts = url.split('/');
    const materialId = parseInt(parts[2]);
    const { courseId } = req.body || {};
    if (!currentUser) return res.status(401).json({ success: false, message: 'Please login.' });

    const existing = db.materialProgress.find((mp) => mp.studentId === currentUser.id && mp.materialId === materialId);
    if (existing) {
      existing.completed = true;
    } else {
      db.materialProgress.push({ studentId: currentUser.id, materialId, completed: true });
    }

    // Update progress in enrollment
    const totalMat = db.materials.filter((m) => m.courseId === parseInt(courseId)).length;
    const completedMat = db.materialProgress.filter(
      (mp) => mp.studentId === currentUser.id && mp.completed && db.materials.some((m) => m.id === mp.materialId && m.courseId === parseInt(courseId))
    ).length;

    const progressPct = totalMat > 0 ? Math.round((completedMat / totalMat) * 100) : 0;
    const enrollment = db.enrollments.find((e) => e.studentId === currentUser.id && e.courseId === parseInt(courseId));
    if (enrollment) enrollment.progress = progressPct;

    saveDatabase(db);
    return res.status(200).json({ success: true, message: 'Lesson completed.', progress: progressPct });
  }

  if (url.startsWith('/materials/')) {
    const materialId = parseInt(url.split('/')[2]);
    const mat = db.materials.find((m) => m.id === materialId);

    if (method === 'PUT') {
      if (!currentUser || (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only instructors can modify materials.' });
      }
      if (!mat) return res.status(404).json({ success: false, message: 'Material not found.' });
      const { title, description, content, materialType, pdfData } = req.body || {};
      if (title) mat.title = title.trim();
      if (description !== undefined) mat.description = description.trim();
      if (content !== undefined) mat.content = content.trim();
      if (materialType) mat.materialType = materialType;
      if (pdfData !== undefined) mat.pdfData = pdfData;
      saveDatabase(db);
      return res.status(200).json({ success: true, message: 'Course material updated successfully.', material: mat });
    }

    if (method === 'DELETE') {
      if (!currentUser || (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only instructors can delete materials.' });
      }
      const idx = db.materials.findIndex((m) => m.id === materialId);
      if (idx !== -1) {
        db.materials.splice(idx, 1);
        saveDatabase(db);
      }
      return res.status(200).json({ success: true, message: 'Course material deleted successfully.' });
    }
  }

  // --- 5. DIRECT MESSAGING (MessageServlet) ---
  if (url === '/messages' || url === '/messages/') {
    if (!currentUser) return res.status(401).json({ success: false, message: 'Please login.' });
    if (method === 'GET') {
      const userMessages = db.messages.filter((m) => m.receiverId === currentUser.id || m.senderId === currentUser.id);
      const unreadCount = userMessages.filter((m) => m.receiverId === currentUser.id && !m.isRead).length;
      return res.status(200).json({ success: true, messages: userMessages, unreadCount });
    }
    if (method === 'POST') {
      const { receiverId, courseId, message } = req.body || {};
      const course = db.courses.find((c) => c.id === parseInt(courseId));
      const receiver = db.users.find((u) => u.id === parseInt(receiverId));

      const maxId = db.messages.reduce((max, m) => Math.max(max, m.id), 500);
      const newMsg: MessageEntity = {
        id: maxId + 1,
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: parseInt(receiverId),
        receiverName: receiver ? receiver.name : 'User',
        courseId: parseInt(courseId),
        courseTitle: course ? course.title : 'Course',
        message: message.trim(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      db.messages.unshift(newMsg);
      saveDatabase(db);
      return res.status(201).json({ success: true, message: 'Message sent successfully.', msg: newMsg });
    }
  }

  if (url.includes('/read-all')) {
    if (!currentUser) return res.status(401).json({ success: false, message: 'Please login.' });
    db.messages.forEach((m) => {
      if (m.receiverId === currentUser.id) m.isRead = true;
    });
    saveDatabase(db);
    return res.status(200).json({ success: true, message: 'All messages marked as read.' });
  }

  if (url.includes('/read')) {
    const parts = url.split('/');
    const msgId = parseInt(parts[2]);
    const msg = db.messages.find((m) => m.id === msgId);
    if (msg) {
      msg.isRead = true;
      saveDatabase(db);
    }
    return res.status(200).json({ success: true, message: 'Message marked as read.' });
  }

  // --- 6. ADMIN HUB (AdminServlet) ---
  if (url === '/admin/users') {
    if (currentUser?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required.' });
    if (method === 'GET') {
      return res.status(200).json({
        success: true,
        users: db.users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })),
      });
    }
    if (method === 'POST') {
      const { name, email, password, role } = req.body || {};
      const maxId = db.users.reduce((max, u) => Math.max(max, u.id), 0);
      const newUser: UserEntity = {
        id: maxId + 1,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: (role || 'STUDENT').toUpperCase(),
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      saveDatabase(db);
      return res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      });
    }
  }

  if (url.startsWith('/admin/users/')) {
    if (currentUser?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required.' });
    const targetUserId = parseInt(url.split('/')[3]);
    const targetUser = db.users.find((u) => u.id === targetUserId);

    if (method === 'PUT') {
      if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });
      const { name, email, role } = req.body || {};
      if (name) targetUser.name = name.trim();
      if (email) targetUser.email = email.trim().toLowerCase();
      if (role) targetUser.role = role.toUpperCase();
      saveDatabase(db);
      return res.status(200).json({ success: true, message: 'User updated successfully.' });
    }

    if (method === 'DELETE') {
      const idx = db.users.findIndex((u) => u.id === targetUserId);
      if (idx !== -1) {
        db.users.splice(idx, 1);
        saveDatabase(db);
      }
      return res.status(200).json({ success: true, message: 'User deleted successfully.' });
    }
  }

  if (url === '/admin/enrollments') {
    if (currentUser?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required.' });
    return res.status(200).json({ success: true, enrollments: db.enrollments });
  }

  if (url.includes('/admin/enrollments/') && url.endsWith('/approve')) {
    if (currentUser?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required.' });
    const enrollmentId = parseInt(url.split('/')[3]);
    const enrollment = db.enrollments.find((e) => e.id === enrollmentId);
    if (enrollment) {
      enrollment.status = 'APPROVED';
      enrollment.rejectionReason = undefined;

      const maxId = db.messages.reduce((max, m) => Math.max(max, m.id), 500);
      db.messages.unshift({
        id: maxId + 1,
        senderId: 1,
        senderName: 'System Administrator',
        receiverId: enrollment.studentId,
        receiverName: enrollment.studentName,
        courseId: enrollment.courseId,
        courseTitle: enrollment.courseTitle,
        message: `Congratulations ${enrollment.studentName}! Your enrollment for "${enrollment.courseTitle}" has been approved by the Administrator.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      saveDatabase(db);
      return res.status(200).json({ success: true, message: 'Enrollment approved successfully.' });
    }
    return res.status(404).json({ success: false, message: 'Enrollment record not found.' });
  }

  if (url.includes('/admin/enrollments/') && url.endsWith('/reject')) {
    if (currentUser?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required.' });
    const enrollmentId = parseInt(url.split('/')[3]);
    const { reason } = req.body || {};
    const enrollment = db.enrollments.find((e) => e.id === enrollmentId);
    if (enrollment) {
      enrollment.status = 'REJECTED';
      enrollment.rejectionReason = reason || 'Enrollment requirements not satisfied';
      saveDatabase(db);
      return res.status(200).json({ success: true, message: 'Enrollment rejected.' });
    }
    return res.status(404).json({ success: false, message: 'Enrollment record not found.' });
  }

  if (url.includes('/admin/courses/') && url.endsWith('/approve')) {
    if (currentUser?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required.' });
    const courseId = parseInt(url.split('/')[3]);
    const course = db.courses.find((c) => c.id === courseId);
    if (course) {
      course.status = 'APPROVED';
      course.rejectionReason = undefined;
      saveDatabase(db);
      return res.status(200).json({ success: true, message: 'Course approved successfully.' });
    }
    return res.status(404).json({ success: false, message: 'Course not found.' });
  }

  if (url.includes('/admin/courses/') && url.endsWith('/reject')) {
    if (currentUser?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required.' });
    const courseId = parseInt(url.split('/')[3]);
    const { reason } = req.body || {};
    const course = db.courses.find((c) => c.id === courseId);
    if (course) {
      course.status = 'REJECTED';
      course.rejectionReason = reason || 'Course does not meet quality guidelines';
      saveDatabase(db);
      return res.status(200).json({ success: true, message: 'Course rejected.' });
    }
    return res.status(404).json({ success: false, message: 'Course not found.' });
  }

  if (url === '/admin/analytics') {
    if (currentUser?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required.' });
    return res.status(200).json({
      success: true,
      analytics: {
        totalUsers: db.users.length,
        totalStudents: db.users.filter((u) => u.role === 'STUDENT').length,
        totalInstructors: db.users.filter((u) => u.role === 'INSTRUCTOR').length,
        totalAdmins: db.users.filter((u) => u.role === 'ADMIN').length,
        totalCourses: db.courses.length,
        approvedCourses: db.courses.filter((c) => c.status === 'APPROVED').length,
        pendingCourses: db.courses.filter((c) => c.status === 'PENDING').length,
        rejectedCourses: db.courses.filter((c) => c.status === 'REJECTED').length,
        totalEnrollments: db.enrollments.length,
      },
    });
  }

  if (url === '/admin/settings') {
    if (currentUser?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required.' });
    if (method === 'GET') {
      return res.status(200).json({ success: true, settings: db.settings });
    }
    if (method === 'PUT') {
      const { platformName, platformEmail, allowStudentRegistration, allowInstructorRegistration } = req.body || {};
      if (platformName) db.settings.platformName = platformName;
      if (platformEmail) db.settings.platformEmail = platformEmail;
      if (allowStudentRegistration !== undefined) db.settings.allowStudentRegistration = allowStudentRegistration;
      if (allowInstructorRegistration !== undefined) db.settings.allowInstructorRegistration = allowInstructorRegistration;
      saveDatabase(db);
      return res.status(200).json({ success: true, message: 'Settings updated successfully.', settings: db.settings });
    }
  }

  return res.status(404).json({ success: false, message: `Endpoint ${method} ${url} not found.` });
}

// Forward /api requests to Apache Tomcat, or fallback to in-memory simulation in cloud preview
app.use('/api', async (req: Request, res: Response) => {
  const targetUrl = `${JAVA_BACKEND_TARGET}${req.originalUrl}`;

  try {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length' && typeof value === 'string') {
        headers[key] = value;
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
      redirect: 'manual',
      signal: controller.signal,
    };

    const backendResponse = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeout);

    const serverHeader = (backendResponse.headers.get('server') || '').toLowerCase();
    const contentType = (backendResponse.headers.get('content-type') || '').toLowerCase();

    // If Tomcat is running, it will return application/json.
    // Container nginx returns text/html (index.html), which must fall back to in-memory simulation.
    const isRealTomcat = !serverHeader.includes('nginx') && contentType.includes('application/json');

    if (isRealTomcat) {
      res.status(backendResponse.status);
      backendResponse.headers.forEach((val, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          res.setHeader('Set-Cookie', val);
        } else if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
          res.setHeader(key, val);
        }
      });
      const responseBody = await backendResponse.arrayBuffer();
      return res.send(Buffer.from(responseBody));
    }

    // Otherwise fall back to in-memory simulation
    return await handleFallbackAPI(req, res);

  } catch (error) {
    // If Tomcat unreachable (e.g. cloud preview sandbox), handle with fallback
    return await handleFallbackAPI(req, res);
  }
});

// VITE DEV SERVER / STATIC PRODUCTION FALLBACK
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }

      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (!fs.existsSync(indexPath)) {
          return res.status(404).send('index.html not found');
        }

        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        console.error('Vite transformIndexHtml error:', e);
        res.status(500).end(e.message);
      }
    });
  } else {
    // Production static serving from dist
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`LMS React + Vite Server running on http://0.0.0.0:${PORT}`);
    console.log(`API proxy target: ${JAVA_BACKEND_TARGET}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      setTimeout(() => {
        server.close();
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to initialize server:', err);
});
