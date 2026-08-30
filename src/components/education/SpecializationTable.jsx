import { Pencil, Trash2 } from 'lucide-react';
import ActionMenu from './ActionMenu';
import StatusBadge from './StatusBadge';
import { formatLabel } from '../../utils/educationConstants';

export default function SpecializationTable({ specializations = [], onEdit, onDelete }) {
  const formatDuration = (item) => {
    if (!item.duration) return '—';
    const unit = item.durationUnit || item.duration_unit;
    return unit ? `${item.duration} ${formatLabel(unit)}` : String(item.duration);
  };

  return (
    <>
      <div className="card hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Specialization</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Short Name</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {specializations.map((s) => (
              <tr key={s.uuid || s.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="font-mono text-xs text-slate-400">{s.code || '—'}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.slug || '—'}</td>
                <td className="px-4 py-3">{s.shortName || s.short_name || '—'}</td>
                <td className="px-4 py-3">{formatDuration(s)}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <ActionMenu
                      items={[
                        { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => onEdit?.(s) },
                        { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => onDelete?.(s) },
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
        {specializations.map((s) => (
          <div key={s.uuid || s.id} className="card space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-slate-500">{s.slug} · {s.code || 'No code'}</p>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="flex justify-end">
              <ActionMenu
                items={[
                  { label: 'Edit', onClick: () => onEdit?.(s) },
                  { label: 'Delete', danger: true, onClick: () => onDelete?.(s) },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
