import { Plus, Trash2 } from 'lucide-react';

const newRow = (columns = []) => ({
  clientId: crypto.randomUUID(),
  cells: Object.fromEntries(columns.map((col) => [col, ''])),
});

const emptyTable = () => ({
  clientId: crypto.randomUUID(),
  persisted: false,
  title: '',
  columns: ['Column 1', 'Column 2'],
  rows: [newRow(['Column 1', 'Column 2'])],
});

const emptyParagraph = () => ({
  clientId: crypto.randomUUID(),
  persisted: false,
  title: '',
  content: '',
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
      clientId: table.id || crypto.randomUUID(),
      persisted: true,
      title: table.title || `Table ${index + 1}`,
      columns,
      rows: rows.length
        ? rows.map((row) => {
          const content = typeof row.content === 'string'
            ? (() => { try { return JSON.parse(row.content); } catch { return {}; } })()
            : (row.content || {});
          return {
            clientId: row.id || crypto.randomUUID(),
            cells: Object.fromEntries(columns.map((col) => [col, content[col] ?? ''])),
          };
        })
        : [newRow(columns)],
    };
  });

/** Convert API paragraphs into the editor shape. */
export const mapApiParagraphsToEditor = (paragraphs = []) =>
  paragraphs.map((paragraph, index) => ({
    clientId: paragraph.id || crypto.randomUUID(),
    persisted: true,
    title: paragraph.title || '',
    content: paragraph.content || '',
    sortOrder: paragraph.sort_order ?? index,
  }));

export default function CourseContentTablesEditor({
  value = [],
  onChange,
  paragraphs = [],
  onParagraphsChange,
}) {
  const tables = value;

  const setTables = (next) => onChange?.(next);
  const setParagraphs = (next) => onParagraphsChange?.(next);

  const updateTable = (clientId, patch) => {
    setTables(tables.map((table) => (
      table.clientId === clientId ? { ...table, ...patch } : table
    )));
  };

  const addTable = () => setTables([...tables, emptyTable()]);

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

  const addParagraph = () => setParagraphs([...paragraphs, emptyParagraph()]);

  const removeParagraph = (clientId) => {
    setParagraphs(paragraphs.filter((p) => p.clientId !== clientId));
  };

  const updateParagraph = (clientId, patch) => {
    setParagraphs(paragraphs.map((p) => (
      p.clientId === clientId ? { ...p, ...patch } : p
    )));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Content Tables</p>
            <p className="text-xs text-slate-500">Add custom tables like curriculum, subjects, or fee notes.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={addTable}>
            <Plus className="h-4 w-4" /> Add Table
          </button>
        </div>

        {!tables.length && (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No tables yet. Click &quot;Add Table&quot; to create one.
          </div>
        )}

        {tables.map((table, tableIndex) => (
          <div key={table.clientId} className="space-y-3 rounded-xl border border-slate-200 p-4">
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

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Content Paragraphs</p>
            <p className="text-xs text-slate-500">Add text blocks like overview notes, eligibility details, or highlights.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={addParagraph}>
            <Plus className="h-4 w-4" /> Add Paragraph
          </button>
        </div>

        {!paragraphs.length && (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No paragraphs yet. Click &quot;Add Paragraph&quot; to create one.
          </div>
        )}

        {paragraphs.map((paragraph, index) => (
          <div key={paragraph.clientId} className="space-y-3 rounded-xl border border-slate-200 p-4">
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
              <textarea
                className="input min-h-[120px]"
                placeholder="Write paragraph content..."
                value={paragraph.content}
                onChange={(e) => updateParagraph(paragraph.clientId, { content: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
