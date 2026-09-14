import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  academicCourseFeeService,
  STRUCTURE_TO_FEE_TYPE,
} from '../../services/educationService';
import { CURRENCIES, FEE_TYPES, formatMoney } from '../../utils/educationConstants';

const toRow = (fee) => ({
  uuid: fee.uuid,
  periodNumber: fee.periodNumber ?? '',
  periodLabel: fee.periodLabel || '',
  amount: fee.amount ?? '',
  currency: fee.currency || 'INR',
  isNew: false,
  removed: false,
});

const newRow = (periodNumber, currency) => ({
  uuid: null,
  periodNumber,
  periodLabel: `Year ${periodNumber}`,
  amount: '',
  currency,
  isNew: true,
  removed: false,
});

const resolveFeeType = (fees) =>
  STRUCTURE_TO_FEE_TYPE[fees.find((f) => f.feeStructureType)?.feeStructureType] || 'YEAR';

export default function SpecializationFeeForm({ course, spec, onSaved, onCancel }) {
  const fees = spec?.fees || [];
  const [rows, setRows] = useState(fees.map(toRow));
  const [feeType, setFeeType] = useState(resolveFeeType(fees));
  const [saving, setSaving] = useState(false);

  // Reload from the API so edits are based on the current stored fees
  useEffect(() => {
    if (!spec?.uuid) return;
    let active = true;

    academicCourseFeeService.getBySpecialization(spec.uuid)
      .then(({ fees: fresh }) => {
        if (!active || !fresh.length) return;
        setRows(fresh.map(toRow));
        setFeeType(resolveFeeType(fresh));
      })
      .catch(() => { /* keep the rows passed in from the table */ });

    return () => { active = false; };
  }, [spec?.uuid]);

  const visibleRows = rows.filter((r) => !r.removed);
  const total = visibleRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const currency = visibleRows[0]?.currency || 'INR';

  const patchRow = (index, patch) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const addRow = () => {
    setRows((prev) => {
      const nextPeriod = prev.filter((r) => !r.removed).length + 1;
      return [...prev, newRow(nextPeriod, currency)];
    });
  };

  const removeRow = (index) =>
    setRows((prev) => prev
      .map((row, i) => (i === index ? { ...row, removed: true } : row))
      .filter((row) => !(row.isNew && row.removed)));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!spec?.uuid) {
      toast.error('This specialization has no id, fees cannot be saved.');
      return;
    }

    const kept = rows.filter((r) => !r.removed);
    if (kept.some((r) => r.amount === '' || Number.isNaN(Number(r.amount)))) {
      toast.error('Every period needs a valid amount.');
      return;
    }

    setSaving(true);
    try {
      const totalPeriods = kept.length;

      for (const [index, row] of kept.entries()) {
        const payload = {
          universityId: course?.universityUuid || course?.universityId,
          courseId: course?.uuid || course?.id,
          specializationId: spec.uuid,
          feeType,
          totalPeriods,
          periodNumber: Number(row.periodNumber) || index + 1,
          periodLabel: row.periodLabel,
          amount: Number(row.amount),
          currency: row.currency,
        };

        if (row.isNew) await academicCourseFeeService.create(payload);
        else await academicCourseFeeService.update(row.uuid, payload);
      }

      for (const row of rows.filter((r) => r.removed && r.uuid)) {
        await academicCourseFeeService.remove(row.uuid);
      }

      toast.success('Fees updated');
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update fees');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
        <p className="font-medium text-slate-900">
          {course?.name}{spec ? ` in ${spec.name}` : ''}
        </p>
        <p className="text-xs text-slate-500">{course?.universityName}</p>
      </div>

      <div className="w-full sm:w-56">
        <label className="label" htmlFor="feeType">Fee structure</label>
        <select
          id="feeType"
          className="input"
          value={feeType}
          onChange={(e) => setFeeType(e.target.value)}
        >
          {FEE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {visibleRows.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No fee periods yet. Add one below.
          </p>
        )}

        {rows.map((row, index) => {
          if (row.removed) return null;

          return (
            <div key={row.uuid || `new-${index}`} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[70px]">
                <label className="label">Period</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={row.periodNumber}
                  onChange={(e) => patchRow(index, { periodNumber: e.target.value })}
                />
              </div>
              <div className="min-w-[140px] flex-1">
                <label className="label">Label</label>
                <input
                  className="input"
                  value={row.periodLabel}
                  placeholder="Year 1"
                  onChange={(e) => patchRow(index, { periodLabel: e.target.value })}
                />
              </div>
              <div className="min-w-[120px] flex-1">
                <label className="label">Amount</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={row.amount}
                  onChange={(e) => patchRow(index, { amount: e.target.value })}
                />
              </div>
              <div className="min-w-[90px]">
                <label className="label">Currency</label>
                <select
                  className="input"
                  value={row.currency}
                  onChange={(e) => patchRow(index, { currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                type="button"
                className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => removeRow(index)}
                aria-label="Remove period"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="btn-secondary" onClick={addRow}>
        <Plus className="h-4 w-4" /> Add period
      </button>

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-500">
          Total: <span className="font-semibold text-slate-900">{formatMoney(total, currency)}</span>
        </p>
        <div className="flex gap-3">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save fees'}
          </button>
        </div>
      </div>
    </form>
  );
}
