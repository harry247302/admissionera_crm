export default function Pagination({ page, pages, total, onPageChange, pageSize = 10 }) {
  const safePages = Math.max(1, pages || 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Page {page} of {safePages} · {total || 0} records
      </p>
      <div className="flex gap-2">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <button className="btn-secondary" disabled={page >= safePages || page * pageSize >= (total || 0)} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
