// ==========================================
// AUTH TYPES
// ==========================================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER';
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ==========================================
// STUDENT TYPES
// ==========================================
export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  email?: string;
  address?: string;
  photo?: string;
  isActive: boolean;
  admissionDate: string;
  createdAt: string;
  classStreamId: string;
  classStream?: ClassStream;
  assessments?: Assessment[];
}

// ==========================================
// CLASS STREAM TYPES
// ==========================================
export interface ClassStream {
  id: string;
  name: string;
  level: number;
  stream: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  averagePerformance?: number;
  _count?: { students: number; classSubjects: number };
  classSubjects?: ClassSubject[];
  students?: Student[];
}

export interface ClassSubject {
  id: string;
  classStreamId: string;
  subjectId: string;
  subject: Subject;
}

// ==========================================
// SUBJECT TYPES
// ==========================================
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { classSubjects: number; assessments: number };
}

// ==========================================
// ASSESSMENT TYPES
// ==========================================
export interface Assessment {
  id: string;
  catScore: number;
  examScore: number;
  total: number;
  grade?: string;
  remarks?: string;
  term: 'TERM_1' | 'TERM_2' | 'TERM_3';
  academicYear: string;
  studentId: string;
  subjectId: string;
  classStreamId: string;
  student?: Student;
  subject?: Subject;
  classStream?: ClassStream;
}

// ==========================================
// GRADING SCALE
// ==========================================
export interface GradingScale {
  id: string;
  grade: string;
  minScore: number;
  maxScore: number;
  remarks: string;
  points: number;
}

// ==========================================
// DASHBOARD
// ==========================================
export interface DashboardStats {
  stats: {
    totalStudents: number;
    totalClasses: number;
    totalSubjects: number;
    averagePerformance: number;
  };
  recentStudents: Student[];
  recentActivities: ActivityLog[];
  genderStats: { gender: string; _count: number }[];
  classPerformance: { name: string; students: number; average: number }[];
  enrollmentTrend: { month: string; count: number }[];
  gradeDistribution: { grade: string; count: number }[];
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  description: string;
  createdAt: string;
}

// ==========================================
// API RESPONSE
// ==========================================
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  errors?: { field: string; message: string }[];
}

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==========================================
// FORM TYPES
// ==========================================
export interface StudentFormData {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  email?: string;
  address?: string;
  classStreamId: string;
}

export interface ClassStreamFormData {
  name: string;
  level: number;
  stream: string;
  description?: string;
}

export interface SubjectFormData {
  name: string;
  code: string;
  description?: string;
}

export interface AssessmentFormData {
  studentId: string;
  subjectId: string;
  catScore: number;
  examScore: number;
  term: 'TERM_1' | 'TERM_2' | 'TERM_3';
  academicYear: string;
  remarks?: string;
}
