import StatusBadge from './StatusBadge';
import { formatCurrency, formatLabel } from '../../utils/educationConstants';

export default function FeeBreakdown({ structure, compact = false }) {
  if (!structure) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
        No fee structure has been configured for this course yet.
      </div>
    );
  }

  const items = [...(structure.items || [])].sort((a, b) => a.periodNumber - b.periodNumber);
  const periodLabel = (item) => (item.periodType === 'year' || structure.feeType === 'YEAR'
    ? `Year ${item.periodNumber}`
    : `Semester ${item.periodNumber}`);

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{structure.courseName} · {structure.universityName}</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={structure.feeType} />
              <StatusBadge status={structure.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Course Fee</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(structure.totalFee)}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3">{structure.feeType === 'YEAR' ? 'Year' : 'Semester'}</th>
              <th className="px-3 py-3">Tuition</th>
              <th className="px-3 py-3">Admission</th>
              <th className="px-3 py-3">Examination</th>
              <th className="px-3 py-3">Registration</th>
              <th className="px-3 py-3">Other</th>
              <th className="px-3 py-3">Nature</th>
              <th className="px-3 py-3">Refund</th>
              <th className="px-3 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id || item.periodNumber} className="border-t border-slate-100">
                <td className="px-3 py-3 font-medium">{periodLabel(item)}</td>
                <td className="px-3 py-3">{formatCurrency(item.tuitionFee)}</td>
                <td className="px-3 py-3">{formatCurrency(item.admissionFee)}</td>
                <td className="px-3 py-3">{formatCurrency(item.examFee)}</td>
                <td className="px-3 py-3">{formatCurrency(item.registrationFee)}</td>
                <td className="px-3 py-3">{formatCurrency(item.otherFee)}</td>
                <td className="px-3 py-3"><StatusBadge status={item.feeNature || 'RECURRING'} /></td>
                <td className="px-3 py-3 text-slate-600">{item.isRefundable ? 'Refundable' : 'Non-refundable'}</td>
                <td className="px-3 py-3 font-semibold">{formatCurrency(item.totalFee)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td className="px-3 py-3 font-semibold" colSpan={8}>Total Course Fee</td>
              <td className="px-3 py-3 font-bold">{formatCurrency(structure.totalFee)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {compact && (
        <p className="text-right text-sm text-slate-500">
          {formatLabel(structure.feeType)} structure · {items.length} {structure.feeType === 'YEAR' ? 'years' : 'semesters'}
        </p>
      )}
    </div>
  );
}
