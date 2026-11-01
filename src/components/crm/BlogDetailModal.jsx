import {
  Calendar,
  Globe,
  Tag,
  User,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  Table as TableIcon,
  AlignLeft,
} from 'lucide-react';
import Modal from '../common/Modal';

function formatDisplayDate(dateStr) {
  if (!dateStr) return 'Not set';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? 'Invalid date'
    : d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

export default function BlogDetailModal({
  open,
  onClose,
  blog,
  onEdit,
  onDelete,
  counselorMap = {},
}) {
  if (!blog) return null;

  const authorName = blog.author_id
    ? counselorMap[blog.author_id] || `Author (${blog.author_id.slice(0, 8)}...)`
    : 'System / Editorial Team';

  const statusBadges = {
    published: {
      label: 'Published',
      icon: CheckCircle2,
      style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    draft: {
      label: 'Draft',
      icon: Clock,
      style: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    archived: {
      label: 'Archived',
      icon: Archive,
      style: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  };

  const statusInfo = statusBadges[blog.status] || statusBadges.draft;
  const StatusIcon = statusInfo.icon;

  const hasTables = Array.isArray(blog.contentTables) && blog.contentTables.length > 0;
  const hasParagraphs = Array.isArray(blog.contentParagraphs) && blog.contentParagraphs.length > 0;

  return (
    <Modal open={open} onClose={onClose} title="Blog Article Details" size="xl">
      <div className="space-y-6">
        {/* Banner Image */}
        {blog.featured_image && (
          <div className="relative overflow-hidden rounded-xl bg-slate-100 max-h-72">
            <img
              src={blog.featured_image}
              alt={blog.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Title, Category & Status */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusInfo.style}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </span>
            {blog.category && (
              <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {blog.category}
              </span>
            )}
            <span className="font-mono text-xs text-slate-400">UUID: {blog.uuid}</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900">{blog.title}</h2>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
              /blogs/{blog.slug}
            </span>
          </div>
        </div>

        {/* Metadata info grid */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-xs">
            <User className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-slate-400">Author</p>
              <p className="font-medium text-slate-700">{authorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-slate-400">Published Date</p>
              <p className="font-medium text-slate-700">{formatDisplayDate(blog.published_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-slate-400">Created At</p>
              <p className="font-medium text-slate-700">{formatDisplayDate(blog.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Excerpt */}
        {blog.excerpt && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Excerpt / Overview
            </h3>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line bg-white rounded-lg border border-slate-100 p-3.5">
              {blog.excerpt}
            </p>
          </div>
        )}

        {/* Content Paragraphs */}
        {hasParagraphs && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <AlignLeft className="h-4 w-4 text-brand-600" /> Content Paragraphs (
              {blog.contentParagraphs.length})
            </h3>
            <div className="space-y-3">
              {blog.contentParagraphs.map((para, pIdx) => (
                <div
                  key={para.clientId || para.id || pIdx}
                  className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {para.title || `Section ${pIdx + 1}`}
                    </h4>
                    {Number.isFinite(Number(para.sortOrder ?? para.sort_order)) && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 font-mono">
                        Order: {para.sortOrder ?? para.sort_order}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {para.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Tables */}
        {hasTables && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <TableIcon className="h-4 w-4 text-brand-600" /> Content Tables (
              {blog.contentTables.length})
            </h3>
            <div className="space-y-4">
              {blog.contentTables.map((tbl, tIdx) => (
                <div
                  key={tbl.clientId || tbl.id || tIdx}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-white"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/75 px-4 py-2.5">
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {tbl.title || `Table ${tIdx + 1}`}
                    </h4>
                    {Number.isFinite(Number(tbl.sortOrder ?? tbl.sort_order)) && (
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600 font-mono">
                        Order: {tbl.sortOrder ?? tbl.sort_order}
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                        <tr>
                          {(tbl.columns || []).map((col) => (
                            <th key={col} className="px-3 py-2 font-semibold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(tbl.rows || []).map((row, rIdx) => (
                          <tr key={row.clientId || row.id || rIdx} className="hover:bg-slate-50/50">
                            {(tbl.columns || []).map((col) => {
                              const cell =
                                row.cells?.[col] ??
                                (typeof row.content === 'object' ? row.content?.[col] : '') ??
                                '';
                              return (
                                <td key={col} className="px-3 py-2 text-slate-700">
                                  {cell || '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {Array.isArray(blog.tags) && blog.tags.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Tag className="h-3.5 w-3.5" /> Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {blog.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SEO Meta Box */}
        {(blog.meta_title ||
          blog.meta_description ||
          (Array.isArray(blog.meta_keywords) && blog.meta_keywords.length > 0)) && (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700">
              <Globe className="h-3.5 w-3.5" /> Search Engine Preview (SEO)
            </h3>
            <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer">
                {blog.meta_title || blog.title}
              </p>
              <p className="text-xs text-emerald-700 font-mono">
                https://admissionera.com/blogs/{blog.slug}
              </p>
              <p className="text-xs text-slate-600 line-clamp-2">
                {blog.meta_description ||
                  blog.excerpt ||
                  'No meta description configured for this blog article.'}
              </p>
            </div>
            {Array.isArray(blog.meta_keywords) && blog.meta_keywords.length > 0 && (
              <div className="pt-1">
                <span className="text-xs text-slate-500 font-medium">Keywords: </span>
                <span className="text-xs text-slate-600">
                  {blog.meta_keywords.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(blog);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" /> Delete Article
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(blog);
              }}
              className="btn-primary flex items-center gap-1.5"
            >
              <Edit2 className="h-4 w-4" /> Edit Blog
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
