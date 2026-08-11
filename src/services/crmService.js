import api from './api';

export const crmService = {
  getDashboard: () => api.get('/crm/dashboard'),
  getReports: (params) => api.get('/crm/reports', { params }),
};

export const leadService = {
  getAll: (params) => api.get('/crm/leads', { params }),
  getById: (id) => api.get(`/crm/leads/${id}`),
  create: (data) => api.post('/crm/leads', data),
  update: (id, data) => api.put(`/crm/leads/${id}`, data),
  delete: (id) => api.delete(`/crm/leads/${id}`),
  bulkUpdate: (ids, data) => api.post('/crm/leads/bulk', { ids, data }),
  getActivities: (id) => api.get(`/crm/leads/${id}/activities`),
  getNotes: (id) => api.get(`/crm/leads/${id}/notes`),
  addNote: (id, note) => api.post(`/crm/leads/${id}/notes`, { note }),
  convert: (id, data) => api.post(`/crm/leads/${id}/convert`, data),
};

export const followupService = {
  getAll: (params) => api.get('/crm/followups', { params }),
  create: (data) => api.post('/crm/followups', data),
  update: (id, data) => api.put(`/crm/followups/${id}`, data),
};

export const taskService = {
  getAll: (params) => api.get('/crm/tasks', { params }),
  create: (data) => api.post('/crm/tasks', data),
  update: (id, data) => api.put(`/crm/tasks/${id}`, data),
};

export const counselorService = {
  getAll: () => api.get('/crm/counselors'),
  getById: (id) => api.get(`/crm/counselors/${id}`),
};

export const applicationService = {
  getAll: (params) => api.get('/crm/applications', { params }),
  create: (data) => api.post('/crm/applications', data),
  update: (id, data) => api.put(`/crm/applications/${id}`, data),
};

export const admissionService = {
  getAll: (params) => api.get('/crm/admissions', { params }),
};
