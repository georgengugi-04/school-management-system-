import api from '@/lib/api';
import {
  Student, ClassStream, Subject, Assessment,
  StudentFormData, ClassStreamFormData, SubjectFormData, AssessmentFormData
} from '@/types';

// ==========================================
// STUDENT SERVICES
// ==========================================
export const studentService = {
  getAll: (params?: Record<string, any>) =>
    api.get('/students', { params }),

  getById: (id: string) =>
    api.get(`/students/${id}`),

  getByClass: (classStreamId: string) =>
    api.get(`/students/class/${classStreamId}`),

  create: (data: StudentFormData) =>
    api.post('/students', data),

  update: (id: string, data: Partial<StudentFormData>) =>
    api.put(`/students/${id}`, data),

  delete: (id: string) =>
    api.delete(`/students/${id}`),
};

// ==========================================
// CLASS STREAM SERVICES
// ==========================================
export const classService = {
  getAll: () =>
    api.get('/classes'),

  getById: (id: string) =>
    api.get(`/classes/${id}`),

  create: (data: ClassStreamFormData) =>
    api.post('/classes', data),

  update: (id: string, data: Partial<ClassStreamFormData>) =>
    api.put(`/classes/${id}`, data),

  delete: (id: string) =>
    api.delete(`/classes/${id}`),

  assignSubjects: (id: string, subjectIds: string[]) =>
    api.post(`/classes/${id}/subjects`, { subjectIds }),
};

// ==========================================
// SUBJECT SERVICES
// ==========================================
export const subjectService = {
  getAll: (params?: Record<string, any>) =>
    api.get('/subjects', { params }),

  getById: (id: string) =>
    api.get(`/subjects/${id}`),

  create: (data: SubjectFormData) =>
    api.post('/subjects', data),

  update: (id: string, data: Partial<SubjectFormData>) =>
    api.put(`/subjects/${id}`, data),

  delete: (id: string) =>
    api.delete(`/subjects/${id}`),
};

// ==========================================
// ASSESSMENT SERVICES
// ==========================================
export const assessmentService = {
  getStudentAssessments: (studentId: string, params?: Record<string, any>) =>
    api.get(`/assessments/student/${studentId}`, { params }),

  getClassResults: (classStreamId: string, params: Record<string, any>) =>
    api.get(`/assessments/class/${classStreamId}/results`, { params }),

  create: (data: AssessmentFormData) =>
    api.post('/assessments', data),

  bulkCreate: (assessments: AssessmentFormData[]) =>
    api.post('/assessments/bulk', { assessments }),

  update: (id: string, data: Partial<AssessmentFormData>) =>
    api.put(`/assessments/${id}`, data),

  delete: (id: string) =>
    api.delete(`/assessments/${id}`),
};

// ==========================================
// DASHBOARD SERVICES
// ==========================================
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

// ==========================================
// REPORT SERVICES
// ==========================================
export const reportService = {
  downloadStudentCard: async (studentId: string, term: string, academicYear: string) => {
    const response = await api.get(`/reports/student/${studentId}/card`, {
      params: { term, academicYear },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_card_${studentId}_${term}_${academicYear}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadClassReport: async (classStreamId: string, term: string, academicYear: string) => {
    const response = await api.get(`/reports/class/${classStreamId}`, {
      params: { term, academicYear },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `class_report_${classStreamId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getGradingScales: () => api.get('/reports/grading-scales'),

  updateGradingScale: (id: string, data: any) =>
    api.put(`/reports/grading-scales/${id}`, data),
};

// ==========================================
// AUTH SERVICES
// ==========================================
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getMe: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};
