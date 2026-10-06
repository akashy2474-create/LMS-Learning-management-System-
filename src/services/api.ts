import { User, Course, Enrollment, CourseMaterial, Message, SystemSettings, AnalyticsData } from '../types/auth';

/**
 * Centralized API Service for Java Servlet Backend
 *
 * Architecture:
 * React/Vite (Port 3000) ──► Vite Proxy (/api/*) ──► Tomcat 10+ (Port 8080 /lms-api/api/*)
 * Authentication: Pure Jakarta HttpServletRequest / HttpSession cookie (JSESSIONID) via credentials: "include"
 */
const API_BASE_URL = '/api';

// In-memory / session storage token for iframe cookie resilience
let activeSessionId: string | null = null;
try {
  activeSessionId = sessionStorage.getItem('lms_session_id');
} catch {}

export const setSessionToken = (token: string | null) => {
  activeSessionId = token;
  try {
    if (token) sessionStorage.setItem('lms_session_id', token);
    else sessionStorage.removeItem('lms_session_id');
  } catch {}
};

// Generic HTTP request helper using credentials: "include" + Session Header
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (activeSessionId) {
    defaultHeaders['X-Session-ID'] = activeSessionId;
    defaultHeaders['Authorization'] = `Bearer ${activeSessionId}`;
  }

  const config: RequestInit = {
    ...options,
    credentials: 'include', // CRITICAL: Ensures Tomcat JSESSIONID cookie is sent with every request
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized globally
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Your session has expired. Please login again.',
      } as T;
    }

    // Handle 403 Forbidden globally
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'You do not have permission to perform this action.',
      } as T;
    }

    // Safely parse JSON
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data as T;
    } catch {
      return {
        success: response.ok,
        message: response.ok ? 'Operation completed.' : 'An error occurred.',
      } as T;
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Network error. Please try again.',
    } as T;
  }
}

// --- CENTRALIZED API SERVICE METHODS (Mapped directly to Jakarta Servlets) ---

export const api = {
  // 1. Authentication & Session (LoginServlet, RegisterServlet, LogoutServlet, SessionServlet)
  auth: {
    login: async (email: string, password: string) => {
      const res = await request<{ success: boolean; message: string; user?: User; sessionId?: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.success && res.sessionId) {
        setSessionToken(res.sessionId);
      }
      return res;
    },

    register: async (name: string, email: string, password: string, role: string) => {
      const res = await request<{ success: boolean; message: string; user?: User; sessionId?: string }>('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      if (res.success && res.sessionId) {
        setSessionToken(res.sessionId);
      }
      return res;
    },

    logout: async () => {
      setSessionToken(null);
      return request<{ success: boolean; message: string }>('/logout', {
        method: 'POST',
      });
    },

    getSession: () =>
      request<{ success: boolean; user?: User; message?: string }>('/session', {
        method: 'GET',
      }),
  },

  // 2. User Profile (ProfileServlet)
  profile: {
    get: () =>
      request<{ success: boolean; user?: User; message?: string }>('/profile', {
        method: 'GET',
      }),

    update: (name: string, email: string, currentPassword?: string, newPassword?: string) =>
      request<{ success: boolean; message: string; user?: User }>('/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email, currentPassword, newPassword }),
      }),
  },

  // 3. Admin User Management (AdminServlet)
  adminUsers: {
    getAll: () =>
      request<{ success: boolean; users?: User[]; message?: string }>('/admin/users', {
        method: 'GET',
      }),

    create: (name: string, email: string, password: string, role: string) =>
      request<{ success: boolean; message: string; user?: User }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      }),

    update: (id: number, name: string, email: string, role: string) =>
      request<{ success: boolean; message: string; user?: User }>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ id, name, email, role }),
      }),

    delete: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/users/${id}`, {
        method: 'DELETE',
      }),
  },

  // 4. Courses & Course Approvals (CourseServlet, AdminServlet)
  courses: {
    getAll: () =>
      request<{ success: boolean; courses?: Course[]; message?: string }>('/courses', {
        method: 'GET',
      }),

    getApproved: () =>
      request<{ success: boolean; courses?: Course[]; message?: string }>('/courses/approved', {
        method: 'GET',
      }),

    create: (title: string, description: string, syllabus: string) =>
      request<{ success: boolean; message: string; course?: Course }>('/courses', {
        method: 'POST',
        body: JSON.stringify({ title, description, syllabus }),
      }),

    update: (id: number, title: string, description: string, syllabus: string) =>
      request<{ success: boolean; message: string; course?: Course }>(`/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ id, title, description, syllabus }),
      }),

    delete: (id: number) =>
      request<{ success: boolean; message: string }>(`/courses/${id}`, {
        method: 'DELETE',
      }),

    approve: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/courses/${id}/approve`, {
        method: 'POST',
      }),

    reject: (id: number, reason?: string) =>
      request<{ success: boolean; message: string }>(`/admin/courses/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // 5. Enrollments & Approval Workflow (EnrollmentServlet, AdminServlet)
  enrollments: {
    enroll: (courseId: number) =>
      request<{ success: boolean; message: string; enrollment?: Enrollment }>('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      }),

    unenroll: (courseId: number) =>
      request<{ success: boolean; message: string }>(`/enrollments/course/${courseId}`, {
        method: 'DELETE',
      }),

    getMyEnrollments: () =>
      request<{ success: boolean; enrollments?: Enrollment[]; message?: string }>('/enrollments/my', {
        method: 'GET',
      }),

    getCourseStudents: (courseId: number) =>
      request<{ success: boolean; students?: Enrollment[]; message?: string }>(`/enrollments/course/${courseId}`, {
        method: 'GET',
      }),

    getInstructorStudents: () =>
      request<{ success: boolean; students?: Enrollment[]; message?: string }>('/instructor/students', {
        method: 'GET',
      }),

    getAdminEnrollments: () =>
      request<{ success: boolean; enrollments?: Enrollment[]; message?: string }>('/admin/enrollments', {
        method: 'GET',
      }),

    approveEnrollment: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/enrollments/${id}/approve`, {
        method: 'POST',
      }),

    rejectEnrollment: (id: number, reason?: string) =>
      request<{ success: boolean; message: string }>(`/admin/enrollments/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // 6. Course Materials & Learning (MaterialServlet)
  materials: {
    getByCourse: (courseId: number) =>
      request<{ success: boolean; materials?: CourseMaterial[]; message?: string }>(`/materials/course/${courseId}`, {
        method: 'GET',
      }),

    add: (courseId: number, title: string, description: string, content: string, materialType: string, pdfData?: string) =>
      request<{ success: boolean; message: string; material?: CourseMaterial }>('/materials', {
        method: 'POST',
        body: JSON.stringify({ courseId, title, description, content, materialType, pdfData }),
      }),

    update: (id: number, title: string, description: string, content: string, materialType: string, pdfData?: string) =>
      request<{ success: boolean; message: string }>(`/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ id, title, description, content, materialType, pdfData }),
      }),

    delete: (id: number) =>
      request<{ success: boolean; message: string }>(`/materials/${id}`, {
        method: 'DELETE',
      }),

    complete: (materialId: number, courseId: number) =>
      request<{ success: boolean; message: string; progress?: number }>(`/materials/${materialId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      }),
  },

  // 7. Direct Messaging (MessageServlet)
  messages: {
    getAll: () =>
      request<{ success: boolean; messages?: Message[]; unreadCount?: number; message?: string }>('/messages', {
        method: 'GET',
      }),

    get: () =>
      request<{ success: boolean; messages?: Message[]; unreadCount?: number; message?: string }>('/messages', {
        method: 'GET',
      }),

    send: (receiverId: number, courseId: number, messageText: string) =>
      request<{ success: boolean; message: string; msg?: Message }>('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiverId, courseId, message: messageText }),
      }),

    markAsRead: (messageId: number) =>
      request<{ success: boolean; message: string }>(`/messages/${messageId}/read`, {
        method: 'PUT',
      }),

    markAllRead: () =>
      request<{ success: boolean; message: string }>('/messages/read-all', {
        method: 'PUT',
      }),
  },

  // 8. Admin Settings & Analytics (AdminServlet)
  admin: {
    getAnalytics: () =>
      request<{ success: boolean; analytics?: AnalyticsData; message?: string }>('/admin/analytics', {
        method: 'GET',
      }),

    getSettings: () =>
      request<{ success: boolean; settings?: SystemSettings; message?: string }>('/admin/settings', {
        method: 'GET',
      }),

    updateSettings: (settings: Partial<SystemSettings>) =>
      request<{ success: boolean; message: string; settings?: SystemSettings }>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },

  // Direct helper aliases
  analytics: {
    get: () =>
      request<{ success: boolean; analytics?: AnalyticsData; message?: string }>('/admin/analytics', {
        method: 'GET',
      }),
  },

  settings: {
    get: () =>
      request<{ success: boolean; settings?: SystemSettings; message?: string }>('/admin/settings', {
        method: 'GET',
      }),
    update: (
      arg1: Partial<SystemSettings> | string,
      platformEmail?: string,
      allowStudentRegistration?: boolean,
      allowInstructorRegistration?: boolean
    ) => {
      let payload: Partial<SystemSettings>;
      if (typeof arg1 === 'string') {
        payload = {
          platformName: arg1,
          platformEmail,
          allowStudentRegistration,
          allowInstructorRegistration,
        };
      } else {
        payload = arg1;
      }
      return request<{ success: boolean; message: string; settings?: SystemSettings }>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
  },
};
