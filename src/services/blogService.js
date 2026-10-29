import api from './api';

export const blogService = {
  // GET https://backend.admissionera.com/api/blogs/get
  getAll: async () => {
    const res = await api.get('/blogs/get');
    return res.data;
  },

  // POST https://backend.admissionera.com/api/blogs/create
  create: async (blogData) => {
    const res = await api.post('/blogs/create', blogData);
    return res.data;
  },

  // PUT https://backend.admissionera.com/api/blogs/update/:uuid
  update: async (uuid, blogData) => {
    const res = await api.put(`/blogs/update/${uuid}`, blogData);
    return res.data;
  },

  // DELETE https://backend.admissionera.com/api/blogs/delete/:uuid
  delete: async (uuid) => {
    const res = await api.delete(`/blogs/delete/${uuid}`);
    return res.data;
  },
};

export default blogService;

