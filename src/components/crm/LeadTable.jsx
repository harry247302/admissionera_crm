import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import LeadStatusBadge, { PriorityBadge } from './LeadStatusBadge';
import { formatDate, formatDateTime } from '../../utils/crmConstants';

export default function LeadTable({
  leads = [], selectedIds = [], onSelect, onSelectAll, onEdit, onDelete,
  canDelete, showBulkSelect = true,
}) {
  const allSelected = leads.length > 0 && selectedIds.length === leads.length;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              {showBulkSelect && (
                <th className="px-3 py-3">
                  <input type="checkbox" checked={allSelected} onChange={(e) => onSelectAll?.(e.target.checked)} />
                </th>
              )}
              <th className="px-3 py-3">Lead ID</th>
              <th className="px-3 py-3">Student Name</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Course</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Counselor</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3">Next Follow-up</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                {showBulkSelect && (
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(lead.id)}
                      onChange={() => onSelect?.(lead.id)}
                    />
                  </td>
                )}
                <td className="px-3 py-3 font-mono text-xs">{lead.leadCode}</td>
                <td className="px-3 py-3 font-medium">{lead.fullName}</td>
                <td className="px-3 py-3">{lead.phone}</td>
                <td className="px-3 py-3">{lead.email || '—'}</td>
                <td className="px-3 py-3">{lead.course || '—'}</td>
                <td className="px-3 py-3">{lead.leadSource?.replace(/_/g, ' ')}</td>
                <td className="px-3 py-3">{lead.counselorName || '—'}</td>
                <td className="px-3 py-3"><LeadStatusBadge status={lead.status} /></td>
                <td className="px-3 py-3"><PriorityBadge priority={lead.priority} /></td>
                <td className="px-3 py-3">{formatDateTime(lead.nextFollowupAt)}</td>
                <td className="px-3 py-3">{formatDate(lead.createdAt)}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    <Link to={`/crm/leads/${lead.id}`} className="rounded p-1 hover:bg-slate-200" title="View">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button onClick={() => onEdit?.(lead)} className="rounded p-1 hover:bg-slate-200" title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                    {canDelete && (
                      <button onClick={() => onDelete?.(lead)} className="rounded p-1 hover:bg-red-100 text-red-600" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {leads.map((lead) => (
          <div key={lead.id} className="card space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{lead.fullName}</p>
                <p className="text-xs text-slate-500">{lead.leadCode}</p>
              </div>
              <LeadStatusBadge status={lead.status} />
            </div>
            <p className="text-sm text-slate-600">{lead.phone} · {lead.course || 'No course'}</p>
            <div className="flex items-center justify-between">
              <PriorityBadge priority={lead.priority} />
              <Link to={`/crm/leads/${lead.id}`} className="btn-secondary text-xs py-1 px-2">
                View <MoreHorizontal className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
