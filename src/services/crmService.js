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

export const mapCounselor = (row = {}) => {
  const firstName = row.first_name || '';
  const lastName = row.last_name || '';
  return {
    id: row.uuid || row.id,
    uuid: row.uuid || row.id,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || row.email || 'Unnamed counsellor',
    email: row.email || '',
    phone: row.phone || '',
    alternatePhone: row.alternate_phone || '',
    qualification: row.qualification || '',
    experienceYears: row.experience_years ?? null,
    designation: row.designation || '',
    ratings: row.ratings ?? null,
    responseRate: row.response_rate ? String(row.response_rate).replace('%', '') : '',
    careerDevelopment: row.career_development || '',
    state: row.state || '',
    notes: row.notes || '',
    profileImg: row.profile_img || '',
    status: row.status !== false,
    createdAt: row.created_at || null,
  };
};

export const counselorService = {
  getAll: async () => {
    const res = await api.get('/counsellor');
    return (res.data?.counsellors || []).map(mapCounselor);
  },
  create: async (data) => {
    const res = await api.post('/counsellor', buildCounselorFormData(data, { keepEmpty: false }), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapCounselor(res.data?.counsellor);
  },
  update: async (id, data) => {
    const formData = buildCounselorFormData(data, { keepEmpty: true });
    if (data.status !== undefined) formData.append('status', String(Boolean(data.status)));
    if (data.removeProfileImg) formData.append('remove_profile_img', 'true');
    const res = await api.put(`/counsellor/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapCounselor(res.data?.counsellor);
  },
  getParagraphs: async (counselorId) => {
    const res = await api.get(`/counsellor/counsellor-table-paragraphs/${counselorId}`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },
  getTables: async (counselorId) => {
    const res = await api.get(`/counsellor/counsellor-tables/${counselorId}`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },
  getContentTables: async ({ courseId, counsellorId } = {}) => {
    if (counsellorId) {
      const res = await api.get(`/counsellor/counsellor-tables/${counsellorId}`);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    }
    if (courseId) {
      const res = await api.get(`/counsellor/counsellor-table/${courseId}`);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    }
    return [];
  },
  /** Creates tables (with their rows) and paragraphs for a counsellor from the content editor state. */
  addContent: async (counselorId, { tables = [], paragraphs = [] }) => {
    const hasText = (value) => String(value ?? '').trim().length > 0;

    for (const [tableIndex, table] of tables.entries()) {
      if (table.persisted) continue;
      const rows = table.rows.filter((row) => Object.values(row.cells || {}).some(hasText));
      if (!rows.length && !hasText(table.title)) continue;

      const res = await api.post('/counsellor/counsellor-table', {
        counsellor_id: counselorId,
        title: table.title?.trim() || `Table ${tableIndex + 1}`,
        sort_order: Number.isFinite(Number(table.sortOrder)) ? Number(table.sortOrder) : tableIndex,
      });
      const tableId = res.data?.data?.id;
      if (!tableId) throw new Error('Table was not created');

      for (const [rowIndex, row] of rows.entries()) {
        const content = Object.fromEntries(
          table.columns.map((col) => [col, String(row.cells?.[col] ?? '').trim()])
        );
        await api.post('/counsellor/counsellor-rows', {
          table_id: tableId,
          label: content[table.columns[0]] || Object.values(content).find(hasText) || `Row ${rowIndex + 1}`,
          content,
          sort_order: rowIndex,
        });
      }
    }

    for (const [index, paragraph] of paragraphs.entries()) {
      if (paragraph.persisted || !hasText(paragraph.content)) continue;
      await api.post('/counsellor/counsellor-paragraphs', {
        counsellor_id: counselorId,
        title: paragraph.title?.trim() || `Paragraph ${index + 1}`,
        content: paragraph.content.trim(),
        sort_order: Number.isFinite(Number(paragraph.sortOrder)) ? Number(paragraph.sortOrder) : index,
      });
    }
  },
};

function buildCounselorFormData(data, { keepEmpty }) {
  const formData = new FormData();
  const fields = {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email?.toLowerCase(),
    phone: data.phone,
    alternate_phone: data.alternatePhone,
    qualification: data.qualification,
    experience_years: data.experienceYears,
    designation: data.designation,
    ratings: data.ratings,
    response_rate: data.responseRate,
    career_development: data.careerDevelopment,
    state: data.state,
    notes: data.notes,
  };
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;
    const text = value === null ? '' : String(value).trim();
    if (text || keepEmpty) formData.append(key, text);
  });
  if (data.profileImg instanceof File) {
    formData.append('profile_img', data.profileImg);
  }
  return formData;
}

export const applicationService = {
  getAll: (params) => api.get('/crm/applications', { params }),
  create: (data) => api.post('/crm/applications', data),
  update: (id, data) => api.put(`/crm/applications/${id}`, data),
};

export const admissionService = {
  getAll: (params) => api.get('/crm/admissions', { params }),
};
