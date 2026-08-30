import { Plus, Trash2 } from 'lucide-react';
import FormField from '../FormField';
import {
  FEE_TYPES, DURATION_UNITS, formatCurrency, formatLabel,
} from '../../../utils/educationConstants';
import {
  buildSemesterFees, buildYearlyFees, calcFeesGrandTotal, calcSimpleRowTotal,
  getSemesterCount, getYearCount,
} from './courseWizardUtils';

function CurrencyInput({ value, onChange }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
      <input
        type="number"
        min="0"
        step="1"
        className="input pl-7"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FeeTable({ rows, periodLabel, onUpdate, onRemove, onAdd, errors = {} }) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3">{periodLabel}</th>
              <th className="px-3 py-3">Tuition Fee</th>
              <th className="px-3 py-3">Other Fee</th>
              <th className="px-3 py-3">Total</th>
              <th className="px-3 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${periodLabel}-${index}`} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{periodLabel} {index + 1}</td>
                <td className="px-3 py-2">
                  <CurrencyInput
                    value={row.tuitionFee}
                    onChange={(v) => onUpdate(index, { tuitionFee: v })}
                  />
                </td>
                <td className="px-3 py-2">
                  <CurrencyInput
                    value={row.otherFee}
                    onChange={(v) => onUpdate(index, { otherFee: v })}
                  />
                </td>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {formatCurrency(calcSimpleRowTotal(row))}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    disabled={rows.length <= 1}
                    onClick={() => onRemove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}
      <button type="button" className="btn-secondary" onClick={onAdd}>
        <Plus className="h-4 w-4" /> Add {periodLabel}
      </button>
    </div>
  );
}

export default function Step3FeeStructure({
  fees,
  onChange,
  errors = {},
}) {
  const duration = fees.duration;
  const durationUnit = fees.durationUnit;

  const setActiveType = (type) => {
    onChange({ ...fees, activeType: type });
  };

  const syncPeriodCounts = () => {
    const yearCount = getYearCount(duration, durationUnit);
    const semesterCount = getSemesterCount(duration, durationUnit);
    onChange({
      ...fees,
      yearly: buildYearlyFees(yearCount).map((row, i) => fees.yearly[i] || row),
      semester: buildSemesterFees(semesterCount).map((row, i) => fees.semester[i] || row),
    });
  };

  const updateDuration = (patch) => {
    onChange({ ...fees, ...patch });
  };

  const updateYearly = (index, patch) => {
    onChange({
      ...fees,
      yearly: fees.yearly.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  const updateSemester = (index, patch) => {
    onChange({
      ...fees,
      semester: fees.semester.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  const grandTotal = calcFeesGrandTotal(fees);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Choose a fee structure type. Period counts are based on the course duration from Step 1. Switching types preserves previously entered values.
      </div>

      <FormField label="Fee Structure Type *">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {FEE_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setActiveType(type.value)}
              className={`rounded-lg border px-3 py-3 text-sm font-medium ${
                fees.activeType === type.value
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Duration (for fee periods)">
          <input
            type="number"
            min="0.5"
            step="0.5"
            className="input"
            value={duration}
            onChange={(e) => updateDuration({ duration: e.target.value })}
          />
        </FormField>
        <FormField label="Duration Unit">
          <select
            className="input"
            value={durationUnit}
            onChange={(e) => updateDuration({ durationUnit: e.target.value })}
          >
            {DURATION_UNITS.map((unit) => (
              <option key={unit} value={unit}>{formatLabel(unit)}</option>
            ))}
          </select>
        </FormField>
        <div className="flex items-end">
          <button type="button" className="btn-secondary w-full" onClick={syncPeriodCounts}>
            Sync periods from duration
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {getYearCount(duration, durationUnit)} years · {getSemesterCount(duration, durationUnit)} semesters configured for fee entry
      </p>

      {fees.activeType === 'YEAR' && (
        <FeeTable
          rows={fees.yearly}
          periodLabel="Year"
          onUpdate={updateYearly}
          onRemove={(index) => onChange({
            ...fees,
            yearly: fees.yearly.filter((_, i) => i !== index).map((row, i) => ({ ...row, periodNumber: i + 1 })),
          })}
          onAdd={() => onChange({
            ...fees,
            yearly: [...fees.yearly, { tuitionFee: '', otherFee: '', periodNumber: fees.yearly.length + 1 }],
          })}
          errors={errors}
        />
      )}

      {fees.activeType === 'SEMESTER' && (
        <FeeTable
          rows={fees.semester}
          periodLabel="Semester"
          onUpdate={updateSemester}
          onRemove={(index) => onChange({
            ...fees,
            semester: fees.semester.filter((_, i) => i !== index).map((row, i) => ({ ...row, periodNumber: i + 1 })),
          })}
          onAdd={() => onChange({
            ...fees,
            semester: [...fees.semester, { tuitionFee: '', otherFee: '', periodNumber: fees.semester.length + 1 }],
          })}
          errors={errors}
        />
      )}

      {fees.activeType === 'ONE_TIME' && (
        <div className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Tuition Fee *" error={errors.oneTimeTuition}>
            <CurrencyInput
              value={fees.oneTime.tuitionFee}
              onChange={(v) => onChange({ ...fees, oneTime: { ...fees.oneTime, tuitionFee: v } })}
            />
          </FormField>
          <FormField label="Other Fee">
            <CurrencyInput
              value={fees.oneTime.otherFee}
              onChange={(v) => onChange({ ...fees, oneTime: { ...fees.oneTime, otherFee: v } })}
            />
          </FormField>
          <div className="sm:col-span-2 rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Fee</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(calcSimpleRowTotal(fees.oneTime))}</p>
          </div>
        </div>
      )}

      {errors.general && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.general}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Course Fee</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(grandTotal)}</p>
        </div>
        <p className="text-xs text-slate-500">Currency: {fees.currency || 'INR'}</p>
      </div>
    </div>
  );
}
