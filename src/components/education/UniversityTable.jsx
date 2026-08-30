import { Eye, Pencil, Trash2 } from 'lucide-react';
import ActionMenu from './ActionMenu';
import StatusBadge from './StatusBadge';
import { formatDate } from '../../utils/crmConstants';
import { formatLabel } from '../../utils/educationConstants';

export default function UniversityTable({ universities = [], onView, onEdit, onDelete, onAssignSpecializations }) {
  return (
    <>
      <div className="card hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">University</th>
              {/* <th>Assign Specialization</th> */}
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {universities.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <button type="button" className="text-left font-medium text-slate-900 hover:text-brand-600" onClick={() => onView?.(u)}>
                    {u.name}
                  </button>
                  {u.website && <p className="text-xs text-slate-400 truncate max-w-xs">{u.website}</p>}
                </td>
                {/* <td className="px-4 py-3">
                  <button
                    type="button"
                    className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                    onClick={() => onAssignSpecializations?.(u)}
                  >
                    Assign Specializations
                  </button>
                </td> */}
                <td className="px-4 py-3 font-mono text-xs">{u.code}</td>
                <td className="px-4 py-3"><StatusBadge status={u.type} /></td>
                <td className="px-4 py-3 text-slate-600">{u.location || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <ActionMenu
                      items={[
                        { label: 'View details', icon: <Eye className="h-4 w-4" />, onClick: () => onView?.(u) },
                        { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => onEdit?.(u) },
                        { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => onDelete?.(u) },
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
        {universities.map((u) => (
          <div key={u.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{u.name}</p>
                <p className="text-xs text-slate-500">{u.code} · {formatLabel(u.type)}</p>
              </div>
              <StatusBadge status={u.status} />
            </div>
            <p className="text-sm text-slate-600">{u.location || 'No location'}</p>
            <button
              type="button"
              className="btn-secondary w-full text-sm"
              onClick={() => onAssignSpecializations?.(u)}
            >
              Assign Specializations
            </button>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Created {formatDate(u.createdAt)}</span>
              <ActionMenu
                items={[
                  { label: 'View details', onClick: () => onView?.(u) },
                  { label: 'Edit', onClick: () => onEdit?.(u) },
                  { label: 'Delete', danger: true, onClick: () => onDelete?.(u) },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
