import { Fragment, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import FormField from './FormField';
import UniversitySelect from './UniversitySelect';
import CourseSelect from './CourseSelect';
import {
  ENTITY_STATUSES,
  FEE_NATURES,
  FEE_TYPES,
  calcItemTotal,
  calcStructureTotal,
  emptyFeeItem,
  formatCurrency,
  formatLabel,
  toNumber,
} from '../../utils/educationConstants';

function PeriodLabel({ type, number }) {
  return type === 'YEAR' ? `Year ${number}` : `Semester ${number}`;
}

function CurrencyInput({ value, onChange, placeholder = '0' }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
      <input
        type="number"
        min="0"
        step="1"
        className="input pl-7"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function FeeStructureForm({
  defaultValues,
  universities = [],
  courses = [],
  onUniversityChange,
  onSubmit,
  loading,
  onCancel,
}) {
  const [universityId, setUniversityId] = useState(defaultValues?.universityId || '');
  const [courseId, setCourseId] = useState(defaultValues?.courseId || '');
  const [feeType, setFeeType] = useState(defaultValues?.feeType || 'SEMESTER');
  const [status, setStatus] = useState(defaultValues?.status || 'ACTIVE');
  const [items, setItems] = useState(() => {
    if (defaultValues?.items?.length) {
      return defaultValues.items.map((item) => ({
        ...emptyFeeItem(item.periodNumber, item.periodType),
        ...item,
      }));
    }
    return [emptyFeeItem(1, 'semester'), emptyFeeItem(2, 'semester')];
  });
  const [expanded, setExpanded] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedCourse = courses.find((c) => String(c.id) === String(courseId));

  useEffect(() => {
    onUniversityChange?.(universityId);
  }, [universityId, onUniversityChange]);

  useEffect(() => {
    if (defaultValues?.id) return;
    if (!selectedCourse) return;
    const count = feeType === 'YEAR'
      ? Math.max(1, Number(selectedCourse.numberOfYears) || 1)
      : Math.max(1, Number(selectedCourse.numberOfSemesters) || 1);
    const periodType = feeType === 'YEAR' ? 'year' : 'semester';
    setItems(Array.from({ length: count }, (_, i) => emptyFeeItem(i + 1, periodType)));
  }, [selectedCourse, feeType, defaultValues?.id]);

  const totals = useMemo(() => ({
    grand: calcStructureTotal(items),
    rows: items.map((item) => calcItemTotal(item)),
  }), [items]);

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addPeriod = () => {
    const periodType = feeType === 'YEAR' ? 'year' : 'semester';
    setItems((prev) => [...prev, emptyFeeItem(prev.length + 1, periodType)]);
  };

  const removePeriod = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, periodNumber: i + 1 })));
  };

  const handleFeeTypeChange = (nextType) => {
    setFeeType(nextType);
    const periodType = nextType === 'YEAR' ? 'year' : 'semester';
    const count = selectedCourse
      ? (nextType === 'YEAR' ? Math.max(1, Number(selectedCourse.numberOfYears) || 2) : Math.max(1, Number(selectedCourse.numberOfSemesters) || 2))
      : 2;
    setItems(Array.from({ length: count }, (_, i) => emptyFeeItem(i + 1, periodType)));
    setExpanded({});
  };

  const handleUniversityChange = (val) => {
    setUniversityId(val);
    setCourseId('');
  };

  const validate = () => {
    const next = {};
    if (!universityId) next.universityId = 'Select a university';
    if (!courseId) next.courseId = 'Select a course';
    if (!feeType) next.feeType = 'Select a fee type';
    if (!items.length) next.items = 'Add at least one period';
    const incomplete = items.findIndex((item) => calcItemTotal(item) <= 0);
    if (incomplete !== -1) {
      next.items = `${feeType === 'YEAR' ? 'Year' : 'Semester'} ${items[incomplete].periodNumber} must have a total greater than zero`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      universityId: Number(universityId),
      courseId: Number(courseId),
      feeType,
      status,
      items: items.map((item, index) => ({
        ...item,
        periodNumber: index + 1,
        periodType: feeType === 'YEAR' ? 'year' : 'semester',
        tuitionFee: toNumber(item.tuitionFee),
        admissionFee: toNumber(item.admissionFee),
        examFee: toNumber(item.examFee),
        registrationFee: toNumber(item.registrationFee),
        otherFee: toNumber(item.otherFee),
        totalFee: calcItemTotal(item),
      })),
    });
  };

  const periodNoun = feeType === 'YEAR' ? 'Year' : 'Semester';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="University *" error={errors.universityId}>
          <UniversitySelect
            universities={universities}
            value={universityId}
            onChange={handleUniversityChange}
            error={Boolean(errors.universityId)}
            disabled={Boolean(defaultValues?.id)}
          />
        </FormField>
        <FormField label="Course *" error={errors.courseId}>
          <CourseSelect
            courses={courses}
            universityId={universityId}
            value={courseId}
            onChange={setCourseId}
            error={Boolean(errors.courseId)}
            disabled={Boolean(defaultValues?.id)}
          />
        </FormField>
        <FormField label="Fee Type *" error={errors.feeType}>
          <div className="grid grid-cols-2 gap-2">
            {FEE_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleFeeTypeChange(type.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  feeType === type.value
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Status">
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </select>
        </FormField>
      </div>

      {status === 'ACTIVE' && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          A course can have only one active fee structure. Saving this as active will archive any previous active structure for the selected course.
        </p>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{periodNoun}-wise fees</h3>
        <button type="button" className="text-xs font-medium text-brand-600 hover:text-brand-700" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? 'Hide additional fee fields' : 'Show additional fee fields'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3 w-10" />
              <th className="px-3 py-3">{periodNoun}</th>
              <th className="px-3 py-3">Tuition Fee</th>
              <th className="px-3 py-3">Other Fee</th>
              {showAdvanced && (
                <>
                  <th className="px-3 py-3">Admission</th>
                  <th className="px-3 py-3">Examination</th>
                  <th className="px-3 py-3">Registration</th>
                </>
              )}
              <th className="px-3 py-3">Total</th>
              <th className="px-3 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const rowOpen = expanded[index];
              return (
                <Fragment key={`period-${index}`}>
                  <tr className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100"
                        onClick={() => setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))}
                        aria-label="Toggle extra fields"
                      >
                        {rowOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      <PeriodLabel type={feeType} number={item.periodNumber || index + 1} />
                    </td>
                    <td className="px-3 py-2">
                      <CurrencyInput value={item.tuitionFee} onChange={(v) => updateItem(index, { tuitionFee: v })} />
                    </td>
                    <td className="px-3 py-2">
                      <CurrencyInput value={item.otherFee} onChange={(v) => updateItem(index, { otherFee: v })} />
                    </td>
                    {showAdvanced && (
                      <>
                        <td className="px-3 py-2">
                          <CurrencyInput value={item.admissionFee} onChange={(v) => updateItem(index, { admissionFee: v })} />
                        </td>
                        <td className="px-3 py-2">
                          <CurrencyInput value={item.examFee} onChange={(v) => updateItem(index, { examFee: v })} />
                        </td>
                        <td className="px-3 py-2">
                          <CurrencyInput value={item.registrationFee} onChange={(v) => updateItem(index, { registrationFee: v })} />
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2 font-semibold text-slate-900">{formatCurrency(totals.rows[index])}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        disabled={items.length <= 1}
                        onClick={() => removePeriod(index)}
                        aria-label="Remove period"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  {rowOpen && (
                    <tr className="border-t border-slate-50 bg-slate-50/70">
                      <td />
                      <td colSpan={showAdvanced ? 8 : 5} className="px-3 py-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {!showAdvanced && (
                            <>
                              <FormField label="Admission Fee">
                                <CurrencyInput value={item.admissionFee} onChange={(v) => updateItem(index, { admissionFee: v })} />
                              </FormField>
                              <FormField label="Examination Fee">
                                <CurrencyInput value={item.examFee} onChange={(v) => updateItem(index, { examFee: v })} />
                              </FormField>
                              <FormField label="Registration Fee">
                                <CurrencyInput value={item.registrationFee} onChange={(v) => updateItem(index, { registrationFee: v })} />
                              </FormField>
                            </>
                          )}
                          <FormField label="Fee nature">
                            <select className="input" value={item.feeNature || 'RECURRING'} onChange={(e) => updateItem(index, { feeNature: e.target.value })}>
                              {FEE_NATURES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                            </select>
                          </FormField>
                          <FormField label="Refund policy">
                            <select
                              className="input"
                              value={item.isRefundable ? 'REFUNDABLE' : 'NON_REFUNDABLE'}
                              onChange={(e) => updateItem(index, { isRefundable: e.target.value === 'REFUNDABLE' })}
                            >
                              <option value="NON_REFUNDABLE">Non-refundable</option>
                              <option value="REFUNDABLE">Refundable</option>
                            </select>
                          </FormField>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}

      <button type="button" className="btn-secondary" onClick={addPeriod}>
        <Plus className="h-4 w-4" /> Add {periodNoun}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Course Fee</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totals.grand)}</p>
        </div>
        <p className="text-xs text-slate-500">Automatically calculated from tuition, admission, examination, registration and other fees.</p>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : defaultValues?.id ? 'Update Fee Structure' : 'Save Fee Structure'}
        </button>
      </div>
    </form>
  );
}
