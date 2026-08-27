import { ArrowDown, ArrowUp, Eye, Pencil, Trash2 } from 'lucide-react';
import ActionMenu from './ActionMenu';
import StatusBadge from './StatusBadge';
import { formatLabel } from '../../utils/educationConstants';

export default function CourseTable({
  courses = [],
  onView,
  onEdit,
  onDelete,
  sortBy,
  sortDir,
  onSort,
}) {
  const SortHeader = ({ field, children }) => {
    const active = sortBy === field;
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-700"
        onClick={() => onSort?.(field)}
      >
        {children}
        {active && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    );
  };

  const durationLabel = (course) => {
    if (!course.duration) return '—';
    return `${course.duration} ${formatLabel(course.durationUnit).toLowerCase()}`;
  };

  return (
    <>
      <div className="card hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-4 py-3"><SortHeader field="name">Course</SortHeader></th>
              <th className="px-4 py-3"><SortHeader field="universityName">University</SortHeader></th>
              <th className="px-4 py-3"><SortHeader field="level">Level</SortHeader></th>
              <th className="px-4 py-3"><SortHeader field="duration">Duration</SortHeader></th>
              <th className="px-4 py-3">Semesters</th>
              <th className="px-4 py-3"><SortHeader field="status">Status</SortHeader></th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, index) => (
              <tr key={c.id || c.uuid || `${c.name}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <button type="button" className="text-left font-medium text-slate-900 hover:text-brand-600" onClick={() => onView?.(c)}>
                    {c.name}
                  </button>
                  <p className="font-mono text-xs text-slate-400">{c.code}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-700">{c.universityName}</p>
                  <p className="text-xs text-slate-400">{c.universityCode}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={c.level} /></td>
                <td className="px-4 py-3 text-slate-600">{durationLabel(c)}</td>
                <td className="px-4 py-3">{c.numberOfSemesters || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <ActionMenu
                      items={[
                        { label: 'View details', icon: <Eye className="h-4 w-4" />, onClick: () => onView?.(c) },
                        { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => onEdit?.(c) },
                        { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => onDelete?.(c) },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {courses.map((c, index) => (
          <div key={c.id || c.uuid || `${c.name}-${index}`} className="card space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-slate-500">{c.code} · {c.universityName}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <StatusBadge status={c.level} />
              <span>{durationLabel(c)}</span>
              <span>{c.numberOfSemesters ? `${c.numberOfSemesters} semesters` : ''}</span>
            </div>
            <div className="flex justify-end">
              <ActionMenu
                items={[
                  { label: 'View details', onClick: () => onView?.(c) },
                  { label: 'Edit', onClick: () => onEdit?.(c) },
                  { label: 'Delete', danger: true, onClick: () => onDelete?.(c) },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
