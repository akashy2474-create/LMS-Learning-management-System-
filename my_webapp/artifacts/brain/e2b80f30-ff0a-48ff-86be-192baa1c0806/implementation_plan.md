# Instructor Progress Tracking, Unified Navigation, PDF Studio & Notification System

A comprehensive upgrade to deliver accurate instructor student progress tracking, seamless top navigation across all roles, direct PDF upload with in-browser viewing, database record synchronization, and immediate notification counter clearing.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following confirmed decisions have been incorporated into this plan:
> - **PDF Management**: Direct file picker upload converting PDFs to embedded data storage, paired with an instant in-browser modal reader and direct download button.
> - **Navigation Strategy**: Streamlined top navigation bar mapping 1-to-1 to active views without redundant or duplicate tab items across Student, Instructor, and Admin portals.
> - **Admin Visibility**: Full name, role badges, and email clarity in User Management; complete course details (syllabus, description, instructor) with approve/reject workflow and feedback.
> - **Instructor Student Progress**: High-density, professional tabular view showing student name, email, enrolled course, completed lesson counts, progress percentage, and enrollment timestamp.
> - **Notification Counter**: Automatic clearing to 0 immediately when viewing messages or clicking the notification icon, synchronized via global events.

---

## 1. Overview & Core Concept

This update transforms key operational workflows in the LMS:
1. **Instructors** gain full visibility into student progress with accurate course enrollment metrics, completed lesson counts, and the ability to upload and manage accessible course PDFs.
2. **Students** can preview course PDFs directly in an in-browser modal viewer before downloading, and see dynamic progress tracking.
3. **Admins** have transparent user administration with role filters and course approval actions.
4. **Top Navigation & Notifications** operate reliably with zero dead links and real-time unread badge clearance.

---

## 2. User Experience & Visual Design

### A. Instructor Student Progress Dashboard (`InstructorStudentsTab.tsx`)
- **Metric Highlights**: Summary stats at the top:
  - *Total Enrolled Students*
  - *Active Courses with Enrollments*
  - *Average Completion Rate*
- **Structured Progress Table**:
  - **Student**: Name with initial avatar + email.
  - **Course**: Title with course ID.
  - **Lesson Progress**: Clean fraction indicator (e.g. `2 / 3 Lessons Completed`) paired with a progress bar and percentage (`67%`).
  - **Status**: Status indicator (`In Progress`, `Completed`, `Not Started`).
  - **Enrolled Date**: Formatted date timestamp.
  - **Actions**: Direct message student shortcut.

### B. PDF Studio & Accessible Viewer
- **Instructor Upload Flow (`InstructorMaterialsModal.tsx`)**:
  - File picker accepting `.pdf` documents.
  - Reads PDF as Data URL with size validation.
  - Preview button to verify uploaded document before saving.
- **In-Browser PDF Reader Modal (`PdfViewerModal.tsx`)**:
  - Accessible modal embedded via clean `<iframe />` / object viewer.
  - Integrated zoom/download action bar and close button.
  - Available to both students in `StudentMyCoursesTab` and instructors in `InstructorMaterialsModal`.

### C. Top Navigation Bar Refinement (`TopBar.tsx`)
- Streamlined tabs with clear visual active indicators:
  - **Student**: `My Courses`, `Course Catalog`, `Progress`, `Messages`, `Profile`.
  - **Instructor**: `My Courses`, `Student Progress`, `Messages`, `Profile`.
  - **Admin**: `User Management`, `Course Approvals`, `Analytics`, `Settings`, `Profile`.
- Dynamic user profile pill with initials and role tag.

### D. Real-Time Notification Clearing
- Global notification event bus (`window.dispatchEvent(new CustomEvent('lms_notifications_cleared'))`).
- When student or instructor visits the Messages tab or clicks the notification bell, unread count resets to 0 instantly and triggers backend batch read update.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct File Picker with Data URL Storage**
  - *Approach*: Store accessible PDFs as base64 Data URLs directly in SQLite `course_materials.pdf_data`.
  - *Why*: Eliminates dependencies on external cloud object storage (S3/GCS buckets) or complex multipart upload endpoints, ensuring hermetic, offline-safe operation and instant download capability.
- **Decision 2: Atomic Batch Read Endpoint**
  - *Approach*: Add `PUT /api/messages/read-all` to mark all unread messages for the logged-in user in a single SQL update.
  - *Why*: Prevents stale notification badges and multiple sequential network requests.
- **Decision 3: Real Database Seed & Synchronization**
  - *Approach*: Ensure migration script guarantees `pdf_data` column exists, updates `courses` with actual materials, and ensures instructor courses have enrolled students with verified lesson progress.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       TopBar.tsx                            │
│  - LMS Portal Brand   - Role Nav Links   - Unread Badge (0) │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼──────────────────────┐
       ▼                       ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Student View    │  │ Instructor View  │  │   Admin View     │
│ - My Courses     │  │ - My Courses     │  │ - Users Table    │
│ - PDF Reader     │  │ - Students Table │  │ - Course Review  │
│ - Lesson Player  │  │ - PDF Upload     │  │ - Analytics      │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         Express API                         │
│  GET /api/instructor/students (Enriched with lesson counts) │
│  GET /api/materials/course/:id (Includes pdf_data)          │
│  POST / PUT /api/materials (Supports pdf_data payload)      │
│  PUT /api/messages/read-all (Atomic badge clear)            │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQLite Database Engine                   │
│  - users, courses, course_materials (pdf_data)              │
│  - enrollments, material_progress, messages, settings       │
└─────────────────────────────────────────────────────────────┘
```

### API & Database Enhancements
1. **`server.ts`**:
   - `GET /api/instructor/students`: Join `material_progress` and `course_materials` to return `completedLessons`, `totalLessons`, and calculated `progress`.
   - `GET /api/materials/course/:courseId`: Select `cm.pdf_data as pdfData`.
   - `POST /api/materials` & `PUT /api/materials/:id`: Accept and persist `pdfData`.
   - `PUT /api/messages/read-all`: Mark all messages where `receiver_id = user.id` as read (`is_read = 1`).
   - Database Migration & Seed: Populate verified courses, enrollments, and accessible PDF study guides.

2. **Frontend Components**:
   - `src/components/ui/PdfViewerModal.tsx`: In-browser PDF modal reader with download button.
   - `src/components/instructor/InstructorStudentsTab.tsx`: Professional progress dashboard with metrics and structured student list.
   - `src/components/instructor/InstructorMaterialsModal.tsx`: PDF file picker upload + preview.
   - `src/components/student/StudentMyCoursesTab.tsx`: In-browser PDF preview modal trigger.
   - `src/components/ui/TopBar.tsx`: Cleaned-up role navigation and instant unread count clearing.
   - `src/services/api.ts`: Helper methods for `readAllMessages` and PDF material payloads.

---

## 5. Verification Plan

### Automated Build Check
- Execute `compile_applet` to ensure clean TypeScript compilation with zero errors.

### End-to-End Verification
1. **Instructor Dashboard**: Log in as `instructor@lms.com` (`Instructor@123`) -> Navigate to `Student Progress` -> Confirm enrolled students (`Akash yadav`, `Rahul Sharma`), course titles, lesson completion counts (e.g. `1/2 Lessons`), and progress bars display accurately.
2. **PDF Studio**: Open course materials in Instructor view -> Upload a PDF using the file picker -> Confirm it saves and is viewable in the PDF viewer modal.
3. **Student Experience**: Log in as `student@lms.com` (`Student@123`) -> Open a course with PDF -> Click "View PDF" -> Confirm in-browser reader opens and downloads properly.
4. **Notification Clearing**: Check notification bell -> Click Messages -> Confirm notification badge clears to 0 immediately in TopBar and Sidebar.
5. **Admin Controls**: Log in as `admin@lms.com` (`Admin@123`) -> Verify User Management displays names, roles, and emails; verify Course Approvals allows approving/rejecting courses with reasons.
