import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';
import { counselorService } from '../../../services/crmService';
import { blogService } from '../../../services/blogService';
import RichTextEditor from '../../common/RichTextEditor';

const hasParagraphText = (html = '') =>
  String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .length > 0;

const newRow = (columns = []) => ({
  clientId: crypto.randomUUID(),
  cells: Object.fromEntries(columns.map((col) => [col, ''])),
});

const emptyTable = (sortOrder = 0) => ({
  clientId: crypto.randomUUID(),
  persisted: false,
  title: '',
  sortOrder,
  columns: ['Column 1', 'Column 2'],
  rows: [newRow(['Column 1', 'Column 2'])],
});

const emptyParagraph = (sortOrder = 0) => ({
  clientId: crypto.randomUUID(),
  persisted: false,
  title: '',
  content: '',
  sortOrder,
});

export const emptyContentTables = () => [];
export const emptyContentParagraphs = () => [];

/** Convert API tables into the editor shape. */
export const mapApiTablesToEditor = (tables = []) =>
  tables.map((table, index) => {
    const rows = table.rows || [];
    const columnSet = new Set();
    rows.forEach((row) => {
      const content = typeof row.content === 'string'
        ? (() => { try { return JSON.parse(row.content); } catch { return {}; } })()
        : (row.content || {});
      Object.keys(content).forEach((key) => columnSet.add(key));
    });
    const columns = columnSet.size
      ? [...columnSet]
      : ['Column 1', 'Column 2'];

    return {
      clientId: table.id || table.uuid || crypto.randomUUID(),
      persisted: true,
      title: table.title || `Table ${index + 1}`,
      sortOrder: table.sort_order ?? index,
      columns,
      rows: rows.length
        ? rows.map((row, rowIndex) => {
          const content = typeof row.content === 'string'
            ? (() => { try { return JSON.parse(row.content); } catch { return {}; } })()
            : (row.content || {});
          return {
            clientId: row.id || row.uuid || crypto.randomUUID(),
            persisted: true,
            sortOrder: row.sort_order ?? rowIndex,
            cells: Object.fromEntries(columns.map((col) => [col, content[col] ?? ''])),
          };
        })
        : [newRow(columns)],
    };
  });

/** Convert API paragraphs into the editor shape. */
export const mapApiParagraphsToEditor = (paragraphs = []) =>
  paragraphs.map((paragraph, index) => ({
    clientId: paragraph.id || paragraph.uuid || crypto.randomUUID(),
    persisted: true,
    title: paragraph.title || '',
    content: paragraph.content || '',
    sortOrder: paragraph.sort_order ?? index,
  }));

export { blogService };

export default function CourseContentTablesEditor({
  value = [],
  onChange,
  paragraphs = [],
  onParagraphsChange,
  mode = 'all',
  courseId,
  counsellorId,
  blogId,
}) {
  const tables = value;
  const showTables = mode === 'all' || mode === 'tables';
  const showParagraphs = mode === 'all' || mode === 'paragraphs';
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesLoadError, setTablesLoadError] = useState('');
  const [paragraphsLoading, setParagraphsLoading] = useState(false);
  const [paragraphsLoadError, setParagraphsLoadError] = useState('');
  const [savingItem, setSavingItem] = useState(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onParagraphsChangeRef = useRef(onParagraphsChange);
  onParagraphsChangeRef.current = onParagraphsChange;

  // 1. Fetch Content Tables
  // Routes:
  // - Blog: GET https://backend.admissionera.com/api/blogs/get-content-tables
  // - Counselor/Course: GET counsellor-tables / counsellor-table
  useEffect(() => {
    if (!showTables || (!courseId && !counsellorId && !blogId)) return undefined;

    let cancelled = false;
    setTablesLoading(true);
    setTablesLoadError('');

    (async () => {
      try {
        let rows = [];
        if (blogId) {
          rows = await blogService.getContentTables(blogId);
        } else {
          rows = await counselorService.getContentTables({ courseId, counsellorId });
        }
        if (cancelled) return;
        if (Array.isArray(rows) && rows.length > 0) {
          onChangeRef.current?.(mapApiTablesToEditor(rows));
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.response?.status !== 404) {
          setTablesLoadError(err?.response?.data?.message || err?.message || 'Failed to load content tables');
        }
      } finally {
        if (!cancelled) setTablesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, counsellorId, blogId, showTables]);

  // 2. Fetch Content Paragraphs
  // Routes:
  // - Blog: GET https://backend.admissionera.com/api/blogs/fetch-paragraph/:id
  useEffect(() => {
    if (!showParagraphs || !blogId) return undefined;

    let cancelled = false;
    setParagraphsLoading(true);
    setParagraphsLoadError('');

    (async () => {
      try {
        const rows = await blogService.getParagraphs(blogId);
        if (cancelled) return;
        if (Array.isArray(rows) && rows.length > 0) {
          onParagraphsChangeRef.current?.(mapApiParagraphsToEditor(rows));
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.response?.status !== 404) {
          setParagraphsLoadError(err?.response?.data?.message || err?.message || 'Failed to load paragraphs');
        }
      } finally {
        if (!cancelled) setParagraphsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blogId, showParagraphs]);

  const setTables = (next) => onChange?.(next);
  const setParagraphs = (next) => onParagraphsChange?.(next);

  const updateTable = (clientId, patch) => {
    setTables(tables.map((table) => (
      table.clientId === clientId ? { ...table, ...patch } : table
    )));
  };

  const addTable = () => setTables([...tables, emptyTable(tables.length)]);

  const removeTable = (clientId) => {
    setTables(tables.filter((table) => table.clientId !== clientId));
  };

  const addColumn = (table) => {
    const nextName = `Column ${table.columns.length + 1}`;
    const columns = [...table.columns, nextName];
    updateTable(table.clientId, {
      columns,
      rows: table.rows.map((row) => ({
        ...row,
        cells: { ...row.cells, [nextName]: '' },
      })),
    });
  };

  const removeColumn = (table, columnName) => {
    if (table.columns.length <= 1) return;
    const columns = table.columns.filter((col) => col !== columnName);
    updateTable(table.clientId, {
      columns,
      rows: table.rows.map((row) => {
        const cells = { ...row.cells };
        delete cells[columnName];
        return { ...row, cells };
      }),
    });
  };

  const renameColumn = (table, oldName, nextName) => {
    const name = nextName.trim() || oldName;
    if (name === oldName) return;
    if (table.columns.includes(name)) return;

    updateTable(table.clientId, {
      columns: table.columns.map((col) => (col === oldName ? name : col)),
      rows: table.rows.map((row) => {
        const cells = { ...row.cells };
        cells[name] = cells[oldName] ?? '';
        delete cells[oldName];
        return { ...row, cells };
      }),
    });
  };

  const addRow = (table) => {
    updateTable(table.clientId, {
      rows: [...table.rows, newRow(table.columns)],
    });
  };

  const removeRow = (table, rowId) => {
    if (table.rows.length <= 1) return;
    updateTable(table.clientId, {
      rows: table.rows.filter((row) => row.clientId !== rowId),
    });
  };

  const updateCell = (table, rowId, column, cellValue) => {
    updateTable(table.clientId, {
      rows: table.rows.map((row) => (
        row.clientId === rowId
          ? { ...row, cells: { ...row.cells, [column]: cellValue } }
          : row
      )),
    });
  };

  const addParagraph = () => setParagraphs([...paragraphs, emptyParagraph(paragraphs.length)]);

  const removeParagraph = (clientId) => {
    setParagraphs(paragraphs.filter((p) => p.clientId !== clientId));
  };

  const updateParagraph = (clientId, patch) => {
    setParagraphs(paragraphs.map((p) => (
      p.clientId === clientId ? { ...p, ...patch } : p
    )));
  };

  // Direct Table Register/Save handler
  // Routes:
  // - POST https://backend.admissionera.com/api/blogs/create-table
  // - POST https://backend.admissionera.com/api/blogs/create-rows
  const handleRegisterTable = async (table, tableIndex) => {
    if (!blogId) return;
    setSavingItem(`table-${table.clientId}`);
    try {
      const res = await blogService.createTable({
        blog_id: blogId,
        title: table.title?.trim() || `Table ${tableIndex + 1}`,
        sort_order: Number(table.sortOrder) || tableIndex,
      });

      const tableData = res?.data || {};
      const tableId = tableData.id || tableData.uuid;

      if (tableId && table.rows?.length) {
        for (const [rowIndex, row] of table.rows.entries()) {
          const content = {};
          (table.columns || []).forEach((col) => {
            content[col] = String(row.cells?.[col] ?? '').trim();
          });
          const label =
            content[table.columns?.[0]]?.trim() ||
            Object.values(content).find((v) => String(v).trim()) ||
            `Row ${rowIndex + 1}`;

          await blogService.createRow({
            table_id: tableId,
            label,
            content,
            sort_order: Number(row.sortOrder) || rowIndex,
          });
        }
      }

      updateTable(table.clientId, { persisted: true });
      toast.success(`Table "${table.title || `Table ${tableIndex + 1}`}" registered successfully`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to register table');
    } finally {
      setSavingItem(null);
    }
  };

  // Direct Paragraph Register/Save handler
  // Route:
  // - POST https://backend.admissionera.com/api/blogs/add-paragraph
  const handleRegisterParagraph = async (paragraph, index) => {
    if (!blogId) return;
    if (!hasParagraphText(paragraph.content)) {
      toast.error('Paragraph content is required');
      return;
    }
    setSavingItem(`para-${paragraph.clientId}`);
    try {
      await blogService.addParagraph({
        blog_id: blogId,
        title: paragraph.title?.trim() || `Paragraph ${index + 1}`,
        content: paragraph.content.trim(),
        sort_order: Number(paragraph.sortOrder) || index,
      });

      updateParagraph(paragraph.clientId, { persisted: true });
      toast.success(`Paragraph "${paragraph.title || `Paragraph ${index + 1}`}" registered successfully`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to register paragraph');
    } finally {
      setSavingItem(null);
    }
  };

  return (
    <div className="space-y-8">
      {showTables && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Content Tables</p>
              <p className="text-xs text-slate-500">
                Add custom tables like curriculum, subjects, or fee notes.
              </p>
            </div>
            <button type="button" className="btn-secondary" onClick={addTable}>
              <Plus className="h-4 w-4" /> Add Table
            </button>
          </div>

          {tablesLoading ? (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              Loading tables…
            </p>
          ) : null}
          {tablesLoadError ? <p className="text-xs text-red-600">{tablesLoadError}</p> : null}

          {!tables.length && !tablesLoading && (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              No tables yet. Click &quot;Add Table&quot; to create one.
            </div>
          )}

          {tables.map((table, tableIndex) => (
            <div key={table.clientId} className="space-y-3 rounded-xl border border-slate-200 p-4 bg-white">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1">
                  <label className="label">Table title</label>
                  <input
                    className="input"
                    placeholder={`Table ${tableIndex + 1}`}
                    value={table.title}
                    onChange={(e) => updateTable(table.clientId, { title: e.target.value })}
                  />
                </div>
                <div className="w-28">
                  <label className="label">Sort order</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={table.sortOrder ?? tableIndex}
                    onChange={(e) => updateTable(table.clientId, {
                      sortOrder: Number(e.target.value) || 0,
                    })}
                  />
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => addColumn(table)}
                >
                  <Plus className="h-4 w-4" /> Column
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => addRow(table)}
                >
                  <Plus className="h-4 w-4" /> Row
                </button>

                {blogId && (
                  <button
                    type="button"
                    className="btn-secondary text-xs flex items-center gap-1.5 text-brand-700 bg-brand-50 border-brand-200 hover:bg-brand-100"
                    disabled={savingItem === `table-${table.clientId}`}
                    onClick={() => handleRegisterTable(table, tableIndex)}
                    title="Register this table directly to the blog"
                  >
                    <CloudUpload className="h-3.5 w-3.5" />
                    {savingItem === `table-${table.clientId}` ? 'Registering…' : 'Register Table'}
                  </button>
                )}

                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => removeTable(table.clientId)}
                  aria-label="Remove table"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      {table.columns.map((column) => (
                        <th key={column} className="border-b border-slate-200 px-2 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              className="input !py-1.5 text-xs font-semibold"
                              value={column}
                              onChange={(e) => renameColumn(table, column, e.target.value)}
                            />
                            {table.columns.length > 1 && (
                              <button
                                type="button"
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                onClick={() => removeColumn(table, column)}
                                aria-label={`Remove ${column}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="w-10 border-b border-slate-200 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={row.clientId}>
                        {table.columns.map((column) => (
                          <td key={column} className="border-b border-slate-100 px-2 py-2">
                            <input
                              className="input !py-1.5"
                              value={row.cells[column] ?? ''}
                              onChange={(e) => updateCell(table, row.clientId, column, e.target.value)}
                              placeholder={column}
                            />
                          </td>
                        ))}
                        <td className="border-b border-slate-100 px-2 py-2">
                          <button
                            type="button"
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                            onClick={() => removeRow(table, row.clientId)}
                            disabled={table.rows.length <= 1}
                            aria-label="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {showParagraphs && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Content Paragraphs</p>
              <p className="text-xs text-slate-500">
                Add text blocks like overview notes, eligibility details, or highlights.
              </p>
            </div>
            <button type="button" className="btn-secondary" onClick={addParagraph}>
              <Plus className="h-4 w-4" /> Add Paragraph
            </button>
          </div>

          {paragraphsLoading ? (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              Loading paragraphs…
            </p>
          ) : null}
          {paragraphsLoadError ? <p className="text-xs text-red-600">{paragraphsLoadError}</p> : null}

          {!paragraphs.length && !paragraphsLoading && (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              No paragraphs yet. Click &quot;Add Paragraph&quot; to create one.
            </div>
          )}

          {paragraphs.map((paragraph, index) => (
            <div key={paragraph.clientId} className="space-y-3 rounded-xl border border-slate-200 p-4 bg-white">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1">
                  <label className="label">Paragraph title</label>
                  <input
                    className="input"
                    placeholder={`Paragraph ${index + 1}`}
                    value={paragraph.title}
                    onChange={(e) => updateParagraph(paragraph.clientId, { title: e.target.value })}
                  />
                </div>
                <div className="w-28">
                  <label className="label">Sort order</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={paragraph.sortOrder ?? index}
                    onChange={(e) => updateParagraph(paragraph.clientId, {
                      sortOrder: Number(e.target.value) || 0,
                    })}
                  />
                </div>

                {blogId && (
                  <button
                    type="button"
                    className="btn-secondary text-xs flex items-center gap-1.5 text-brand-700 bg-brand-50 border-brand-200 hover:bg-brand-100"
                    disabled={savingItem === `para-${paragraph.clientId}`}
                    onClick={() => handleRegisterParagraph(paragraph, index)}
                    title="Register this paragraph directly to the blog"
                  >
                    <CloudUpload className="h-3.5 w-3.5" />
                    {savingItem === `para-${paragraph.clientId}` ? 'Registering…' : 'Register Paragraph'}
                  </button>
                )}

                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => removeParagraph(paragraph.clientId)}
                  aria-label="Remove paragraph"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="label">Content *</label>
                <RichTextEditor
                  value={paragraph.content || ''}
                  onChange={(html) => updateParagraph(paragraph.clientId, { content: html })}
                  placeholder="Write paragraph content..."
                  minHeight={180}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
