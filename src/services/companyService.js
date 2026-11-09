import api from './api';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://backend.admissionera.com/api').replace(/\/+$/, '');

export const companyService = {
  // GET https://backend.admissionera.com/api/companies/get
  getAll: async () => {
    try {
      const res = await api.get('/companies/get');
      return res.data;
    } catch (err) {
      const response = await fetch(`${API_BASE}/companies/get`);
      if (!response.ok) {
        throw new Error(err?.response?.data?.message || err?.message || 'Failed to fetch companies');
      }
      return await response.json();
    }
  },

  // GET https://backend.admissionera.com/api/companies/get/:id
  getById: async (id) => {
    try {
      const res = await api.get(`/companies/get/${encodeURIComponent(id)}`);
      return res.data;
    } catch (err) {
      const response = await fetch(`${API_BASE}/companies/get/${encodeURIComponent(id)}`);
      if (!response.ok) {
        throw new Error(err?.response?.data?.message || err?.message || 'Failed to fetch company details');
      }
      return await response.json();
    }
  },

  // POST https://backend.admissionera.com/api/companies/create
  // Body: { company_name, website, logo }
  create: async ({ company_name, website, logo }) => {
    const payload = {
      company_name: (company_name || '').trim(),
      website: (website || '').trim() || null,
      logo: (logo || '').trim() || null,
    };

    try {
      const res = await api.post('/companies/create', payload);
      return res.data;
    } catch (err) {
      const response = await fetch(`${API_BASE}/companies/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to create company'
        );
      }
      return await response.json();
    }
  },

  // PUT https://backend.admissionera.com/api/companies/update/:id
  // Body: { company_name, website, logo }
  update: async (id, { company_name, website, logo }) => {
    const payload = {
      company_name: (company_name || '').trim(),
      website: (website || '').trim() || null,
      logo: (logo || '').trim() || null,
    };

    try {
      const res = await api.put(`/companies/update/${encodeURIComponent(id)}`, payload);
      return res.data;
    } catch (err) {
      const response = await fetch(`${API_BASE}/companies/update/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to update company'
        );
      }
      return await response.json();
    }
  },

  // DELETE https://backend.admissionera.com/api/companies/delete/:id
  delete: async (id) => {
    try {
      const res = await api.delete(`/companies/delete/${encodeURIComponent(id)}`);
      return res.data;
    } catch (err) {
      const response = await fetch(`${API_BASE}/companies/delete/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to delete company'
        );
      }
      return await response.json();
    }
  },
};

export default companyService;
