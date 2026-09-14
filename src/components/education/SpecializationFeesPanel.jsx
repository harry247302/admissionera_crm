import { useCallback, useEffect, useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { academicCourseFeeService } from '../../services/educationService';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { formatLabel, formatMoney } from '../../utils/educationConstants';

/** Fees live on course_fees keyed by specialization, so this panel loads
 *  one request per specialization of the course. */
export default function SpecializationFeesPanel({ course, refreshKey = 0, onEditFees }) {
  const specs = course?.specializations || [];
  const [feesBySpec, setFeesBySpec] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const specKeys = specs.map((s) => s.uuid || s.id).filter(Boolean).join(',');

  const load = useCallback(async () => {
    const targets = specs.filter((s) => s.uuid);
    if (!targets.length) {
      setFeesBySpec({});
      return;
    }

    setLoading(true);
    setError('');
    try {
      const entries = await Promise.all(
        targets.map(async (spec) => {
          const { fees, totalFee } = await academicCourseFeeService.getBySpecialization(spec.uuid);
          return [spec.uuid, { fees, totalFee }];
        })
      );
      setFeesBySpec(Object.fromEntries(entries));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load fees');
    } finally {
      setLoading(false);
    }
  }, [specKeys]);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (!specs.length) {
    return (
      <EmptyState
        title="No specializations yet"
        description="Fees are stored per specialization. Add a specialization first, then set its fees."
      />
    );
  }

  if (loading) return <LoadingSpinner message="Loading fees..." />;

  const courseTotal = Object.values(feesBySpec)
    .reduce((sum, entry) => sum + Number(entry.totalFee || 0), 0);

  return (
    <div className="space-y-4">
      {error && (
        <div className="card border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
      )}

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">All specializations</p>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(courseTotal)}</p>
        </div>
        <p className="text-sm text-slate-500">{specs.length} specialization{specs.length === 1 ? '' : 's'}</p>
      </div>

      {specs.map((spec) => {
        const entry = feesBySpec[spec.uuid] || { fees: [], totalFee: 0 };
        const { fees, totalFee } = entry;
        const currency = fees[0]?.currency || 'INR';

        return (
          <div key={spec.uuid || spec.id} className="card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{spec.name}</p>
                {spec.code && <p className="font-mono text-xs text-slate-400">{spec.code}</p>}
                {fees[0]?.feeStructureType && (
                  <p className="mt-1 text-xs text-slate-500">
                    {formatLabel(fees[0].feeStructureType)} · {fees.length} period{fees.length === 1 ? '' : 's'}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                <p className="text-lg font-bold text-slate-900">{formatMoney(totalFee, currency)}</p>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                  onClick={() => onEditFees?.({ course, spec })}
                >
                  <IndianRupee className="h-3 w-3" /> {fees.length ? 'Update fees' : 'Add fees'}
                </button>
              </div>
            </div>

            {fees.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                No fees configured for this specialization yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2">Period</th>
                      <th className="px-3 py-2">Structure</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee) => (
                      <tr key={fee.uuid} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {fee.periodLabel || `Period ${fee.periodNumber}`}
                          {fee.totalPeriods ? (
                            <span className="text-slate-400"> ({fee.periodNumber}/{fee.totalPeriods})</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{formatLabel(fee.feeStructureType)}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {formatMoney(fee.amount, fee.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td className="px-3 py-2 font-semibold" colSpan={2}>Total</td>
                      <td className="px-3 py-2 text-right font-bold">{formatMoney(totalFee, currency)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
