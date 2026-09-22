import { Eye, Pencil, Trash2 } from 'lucide-react';
import ActionMenu from './ActionMenu';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '../../utils/educationConstants';

export default function FeeStructureTable({ structures = [], onView, onEdit, onDelete }) {
  return (
    <>
      <div className="card hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Add Fees</th>
              <th className="px-4 py-3">University</th>
              <th className="px-4 py-3">Fee Type</th>
              <th className="px-4 py-3">Periods</th>
              <th className="px-4 py-3">Total Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {structures.map((f) => (
              <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <button type="button" className="text-left font-medium hover:text-brand-600" onClick={() => onView?.(f)}>
                    {f.courseName}
                  </button>
                  <p className="text-xs text-slate-500">{f.specializationName || '—'}</p>
                  {f.sessionName ? <p className="text-xs text-slate-400">Session: {f.sessionName}</p> : null}
                  <p className="font-mono text-xs text-slate-400">{f.courseCode}</p>
                </td>
                <td className="px-4 py-3">
                  <button type="button" className="text-left font-medium hover:text-brand-600" onClick={() => onAddFees?.(f)}>
                    Add Fees
                  </button>
                </td>
                <td className="px-4 py-3">
                  <p>{f.universityName}</p>
                  <p className="text-xs text-slate-400">{f.universityCode}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={f.feeType} /></td>
                <td className="px-4 py-3">{f.items?.length || 0}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(f.totalFee)}</td>
                <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <ActionMenu
                      items={[
                        { label: 'View breakdown', icon: <Eye className="h-4 w-4" />, onClick: () => onView?.(f) },
                        { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => onEdit?.(f) },
                        { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => onDelete?.(f) },
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
        {structures.map((f) => (
          <div key={f.id} className="card space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{f.courseName}</p>
                <p className="text-xs text-slate-500">{f.universityName}</p>
              </div>
              <StatusBadge status={f.status} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <StatusBadge status={f.feeType} />
              <p className="font-semibold">{formatCurrency(f.totalFee)}</p>
            </div>
            <div className="flex justify-end">
              <ActionMenu
                items={[
                  { label: 'View breakdown', onClick: () => onView?.(f) },
                  { label: 'Edit', onClick: () => onEdit?.(f) },
                  { label: 'Delete', danger: true, onClick: () => onDelete?.(f) },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
