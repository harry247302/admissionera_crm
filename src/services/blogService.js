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

  // POST https://backend.admissionera.com/api/blogs/create-table
  createTable: async ({ blog_id, title, sort_order = 0, counsellor_id = null }) => {
    const res = await api.post('/blogs/create-table', {
      blog_id,
      title: title || null,
      sort_order: Number(sort_order) || 0,
      counsellor_id: counsellor_id || null,
    });
    return res.data;
  },

  // POST https://backend.admissionera.com/api/blogs/create-rows
  createRow: async ({ table_id, label, content = {}, sort_order = 0 }) => {
    const res = await api.post('/blogs/create-rows', {
      table_id,
      label,
      content,
      sort_order: Number(sort_order) || 0,
    });
    return res.data;
  },

  // POST https://backend.admissionera.com/api/blogs/add-paragraph
  addParagraph: async ({ blog_id, title, content, sort_order = 0, counsellor_id = null }) => {
    const res = await api.post('/blogs/add-paragraph', {
      blog_id,
      title: title || null,
      content,
      sort_order: Number(sort_order) || 0,
      counsellor_id: counsellor_id || null,
    });
    return res.data;
  },

  // GET https://backend.admissionera.com/api/blogs/get-content-tables
  getContentTables: async (blogId) => {
    try {
      const res = await api.get(`/blogs/get-content-tables/${blogId}`);
      const data = res.data?.data ?? res.data?.tables ?? res.data;
      return Array.isArray(data) ? data : [];
    } catch (err) {
      try {
        const fallbackRes = await api.get('/blogs/get-content-tables', {
          params: { blog_id: blogId },
        });
        const data = fallbackRes.data?.data ?? fallbackRes.data?.tables ?? fallbackRes.data;
        return Array.isArray(data) ? data : [];
      } catch {
        throw err;
      }
    }
  },

  // GET https://backend.admissionera.com/api/blogs/fetch-paragraph/:id
  getParagraphs: async (blogId) => {
    try {
      const res = await api.get(`/blogs/fetch-paragraph/${blogId}`);
      const data = res.data?.data ?? res.data?.paragraphs ?? res.data;
      return Array.isArray(data) ? data : [];
    } catch (err) {
      // Fallback in case route without leading slash is mounted as /blogsfetch-paragraph/:id
      try {
        const fallbackRes = await api.get('/blogs/fetch-paragraph/' + blogId);
        const data = fallbackRes.data?.data ?? fallbackRes.data?.paragraphs ?? fallbackRes.data;
        return Array.isArray(data) ? data : [];
      } catch {
        throw err;
      }
    }
  },

  /**
   * Save content tables and their nested rows for a blog, matching the course wizard architecture.
   */
  saveContentTables: async (blogId, tables = [], { counsellor_id } = {}) => {
    const hasText = (val) => String(val ?? '').trim().length > 0;
    const results = [];

    for (const [tableIndex, table] of tables.entries()) {
      if (table.persisted) continue;
      const rows = (table.rows || []).filter((row) =>
        Object.values(row.cells || {}).some(hasText)
      );
      if (!rows.length && !hasText(table.title)) continue;

      const createdTableRes = await api.post('/blogs/create-table', {
        blog_id: blogId,
        title: table.title?.trim() || `Table ${tableIndex + 1}`,
        sort_order: Number.isFinite(Number(table.sortOrder))
          ? Number(table.sortOrder)
          : tableIndex,
        counsellor_id: counsellor_id || null,
      });

      const tableData = createdTableRes.data?.data || createdTableRes.data;
      const tableId = tableData?.id || tableData?.uuid;
      if (!tableId) continue;

      const createdRows = [];
      for (const [rowIndex, row] of rows.entries()) {
        const content = {};
        (table.columns || []).forEach((col) => {
          content[col] = String(row.cells?.[col] ?? '').trim();
        });

        const label =
          content[table.columns?.[0]]?.trim() ||
          Object.values(content).find(hasText) ||
          `Row ${rowIndex + 1}`;

        const createdRowRes = await api.post('/blogs/create-rows', {
          table_id: tableId,
          label: String(label),
          content,
          sort_order: Number.isFinite(Number(row.sortOrder))
            ? Number(row.sortOrder)
            : rowIndex,
        });
        createdRows.push(createdRowRes.data?.data || createdRowRes.data);
      }

      results.push({
        ...tableData,
        rows: createdRows,
      });
    }

    return results;
  },

  /**
   * Save content paragraphs for a blog, matching the course wizard architecture.
   */
  saveContentParagraphs: async (blogId, paragraphs = [], { counsellor_id } = {}) => {
    const results = [];
    for (const [index, paragraph] of paragraphs.entries()) {
      if (paragraph.persisted) continue;
      const content = String(paragraph.content || '').trim();
      if (!content) continue;

      const res = await api.post('/blogs/add-paragraph', {
        blog_id: blogId,
        title: paragraph.title?.trim() || `Paragraph ${index + 1}`,
        content,
        sort_order: Number.isFinite(Number(paragraph.sortOrder))
          ? Number(paragraph.sortOrder)
          : index,
        counsellor_id: counsellor_id || null,
      });
      results.push(res.data?.data || res.data);
    }
    return results;
  },
};

export default blogService;
