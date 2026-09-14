import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Check, ChevronDown, ChevronRight, Loader2, Plus, Save, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import FormField from './FormField';
import UniversitySelect from './UniversitySelect';
import CourseSelect from './CourseSelect';
import {
  CURRENCIES,
  ENTITY_STATUSES,
  FEE_NATURES,
  FEE_TYPES,
  calcItemTotal,
  calcStructureTotal,
  emptyFeeItem,
  formatLabel,
  formatMoney,
} from '../../utils/educationConstants';
import {
  academicCourseFeeService,
  specializationService,
} from '../../services/educationService';

const periodLabelFor = (type, number) => {
  if (type === 'YEAR') return `Year ${number}`;
  if (type === 'ONE_TIME') return 'One-time payment';
  return `Semester ${number}`;
};

const periodNounFor = (type) => {
  if (type === 'YEAR') return 'Year';
  if (type === 'ONE_TIME') return 'Payment';
  return 'Semester';
};

function CurrencyInput({ value, onChange, placeholder = '0', symbol = '₹', disabled }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{symbol}</span>
      <input
        type="number"
        min="0"
        step="1"
        className="input pl-7 disabled:bg-slate-50 disabled:text-slate-500"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
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
  const [specializationId, setSpecializationId] = useState(defaultValues?.specializationId || '');
  const [currency, setCurrency] = useState(defaultValues?.currency || 'INR');
  const [feeType, setFeeType] = useState(defaultValues?.feeType || 'SEMESTER');
  const [status, setStatus] = useState(defaultValues?.status || 'ACTIVE');
  const [totalPeriods, setTotalPeriods] = useState(defaultValues?.totalPeriods || 3);
  const [savingIndex, setSavingIndex] = useState(null);
  const [catalogSpecializations, setCatalogSpecializations] = useState([]);
  const [items, setItems] = useState(() => {
    if (defaultValues?.items?.length) {
      return defaultValues.items.map((item) => ({
        ...emptyFeeItem(item.periodNumber, item.periodType),
        ...item,
      }));
    }
    return [emptyFeeItem(1, 'semester')];
  });
  const [expanded, setExpanded] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedUniversity = useMemo(
    () => universities.find((u) => String(u.id) === String(universityId) || String(u.uuid) === String(universityId)),
    [universities, universityId]
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === String(courseId) || String(c.uuid) === String(courseId)),
    [courses, courseId]
  );

  const courseSpecializations = selectedCourse?.specializations || [];
  const specializations = useMemo(() => {
    if (courseSpecializations.length) return courseSpecializations;
    return catalogSpecializations;
  }, [courseSpecializations, catalogSpecializations]);

  const periodNoun = periodNounFor(feeType);
  const savedItems = items.filter((item) => item.savedUuid);
  const hasSaved = savedItems.length > 0;

  useEffect(() => {
    onUniversityChange?.(universityId);
  }, [universityId, onUniversityChange]);

  useEffect(() => {
    let active = true;
    specializationService.getAll({ limit: 500 })
      .then((res) => {
        if (!active) return;
        setCatalogSpecializations(res.data?.specializations || []);
      })
      .catch(() => {
        if (active) setCatalogSpecializations([]);
      });
    return () => { active = false; };
  }, []);

  const currencySymbol = useMemo(
    () => formatMoney(0, currency).replace(/[\d.,]/g, ''),
    [currency]
  );

  const totals = useMemo(() => ({
    grand: calcStructureTotal(items),
    saved: calcStructureTotal(savedItems),
    rows: items.map((item) => calcItemTotal(item)),
  }), [items, savedItems]);

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removePeriod = (index) => {
    setItems((prev) => prev
      .filter((_, i) => i !== index)
      .map((item, i) => (item.savedUuid ? item : { ...item, periodNumber: i + 1 })));
  };

  const handleFeeTypeChange = (nextType) => {
    if (hasSaved) {
      toast.error(`Fee type can't change after a ${periodNoun.toLowerCase()} is saved`);
      return;
    }
    setFeeType(nextType);
    const periodType = nextType === 'YEAR' ? 'year' : nextType === 'ONE_TIME' ? 'one_time' : 'semester';
    setItems([emptyFeeItem(1, periodType)]);
    setExpanded({});
  };

  const handleUniversityChange = (val) => {
    setUniversityId(val);
    setCourseId('');
    setSpecializationId('');
  };

  const handleCourseChange = (val) => {
    setCourseId(val);
    setSpecializationId('');
  };

  /** The API persists a single period per request, so a row is validated and
   *  posted on its own rather than as part of a whole-structure submit. */
  const validatePeriod = (index) => {
    const next = {};
    if (!universityId) next.universityId = 'Select a university';
    if (!courseId) next.courseId = 'Select a course';
    if (!specializationId) next.specializationId = 'Select a specialization';
    if (!feeType) next.feeType = 'Select a fee type';
    if (!(Number(totalPeriods) > 0)) next.totalPeriods = 'Enter how many periods this course has';
    if (calcItemTotal(items[index]) <= 0) {
      next.items = `${periodLabelFor(feeType, items[index].periodNumber)} must have a total greater than zero`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const savePeriod = async (index) => {
    if (items[index].savedUuid) return true;
    if (!validatePeriod(index)) return false;

    const universityRef = selectedUniversity?.uuid || selectedUniversity?.id || universityId;
    const courseRef = selectedCourse?.uuid || selectedCourse?.id || courseId;

    if (!universityRef || !courseRef || !specializationId) {
      const message = 'University, course, and specialization are required';
      toast.error(message);
      setErrors((prev) => ({ ...prev, items: message }));
      return false;
    }

    const item = items[index];
    setSavingIndex(index);
    try {
      const created = await academicCourseFeeService.create({
        universityId: universityRef,
        courseId: courseRef,
        specializationId,
        feeType,
        totalPeriods: Number(totalPeriods),
        periodNumber: item.periodNumber,
        periodLabel: periodLabelFor(feeType, item.periodNumber),
        amount: calcItemTotal(item),
        currency,
      });
      updateItem(index, {
        savedUuid: created?.uuid || true,
        totalFee: calcItemTotal(item),
      });
      toast.success(`${periodLabelFor(feeType, item.periodNumber)} saved`);
      return true;
    } catch (err) {
      const message = err?.response?.data?.message
        || err?.message
        || `Failed to save ${periodNoun.toLowerCase()}`;
      toast.error(message);
      setErrors((prev) => ({ ...prev, items: message }));
      return false;
    } finally {
      setSavingIndex(null);
    }
  };

  /** Saves the current period first, then opens a fresh row for the next one. */
  const handleAddPeriod = async () => {
    const lastIndex = items.length - 1;
    const ok = await savePeriod(lastIndex);
    if (!ok) return;

    const periodType = feeType === 'YEAR' ? 'year' : feeType === 'ONE_TIME' ? 'one_time' : 'semester';
    setItems((prev) => [...prev, emptyFeeItem(prev.length + 1, periodType)]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lastIndex = items.length - 1;

    if (!items[lastIndex].savedUuid && calcItemTotal(items[lastIndex]) > 0) {
      const ok = await savePeriod(lastIndex);
      if (!ok) return;
    }

    if (!items.some((item) => item.savedUuid)) {
      setErrors((prev) => ({ ...prev, items: `Save at least one ${periodNoun.toLowerCase()} first` }));
      return;
    }

    onSubmit?.({
      universityId: selectedUniversity?.uuid || selectedUniversity?.id || universityId,
      courseId: selectedCourse?.uuid || selectedCourse?.id || courseId,
      specializationId,
      feeType,
      currency,
      status,
      totalPeriods: Number(totalPeriods),
      items,
      created: items.filter((item) => item.savedUuid),
    });
  };

  const lockHeader = hasSaved || Boolean(defaultValues?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="University *" error={errors.universityId}>
          <UniversitySelect
            universities={universities}
            value={universityId}
            onChange={handleUniversityChange}
            error={Boolean(errors.universityId)}
            disabled={lockHeader}
          />
        </FormField>
        <FormField label="Course *" error={errors.courseId}>
          <CourseSelect
            courses={courses}
            universityId={universityId}
            value={courseId}
            onChange={handleCourseChange}
            error={Boolean(errors.courseId)}
            disabled={lockHeader}
            includeUnlinked
          />
        </FormField>
        <FormField
          label="Specialization *"
          error={errors.specializationId}
          hint={
            courseId && !specializations.length
              ? 'No specializations available yet — create one first'
              : (!courseSpecializations.length && catalogSpecializations.length
                ? 'Showing catalog specializations (none linked to this course yet)'
                : undefined)
          }
        >
          <select
            className="input"
            value={specializationId}
            onChange={(e) => setSpecializationId(e.target.value)}
            disabled={lockHeader || !specializations.length}
          >
            <option value="">
              {specializations.length ? 'Select specialization' : 'No specializations available'}
            </option>
            {specializations.map((s) => (
              <option key={s.uuid || s.id} value={s.uuid || s.id}>
                {s.name}{s.code ? ` (${s.code})` : ''}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Currency">
          <select
            className="input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={lockHeader}
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Fee Type *" error={errors.feeType}>
          <div className="grid grid-cols-2 gap-2">
            {FEE_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleFeeTypeChange(type.value)}
                disabled={Boolean(defaultValues?.id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
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
        <FormField
          label={`Total ${periodNoun}s *`}
          error={errors.totalPeriods}
          hint={`How many ${periodNoun.toLowerCase()}s this course is billed over`}
        >
          <input
            type="number"
            min="1"
            className="input disabled:bg-slate-50"
            value={totalPeriods}
            disabled={lockHeader}
            onChange={(e) => setTotalPeriods(e.target.value)}
          />
        </FormField>
        <FormField label="Status">
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </select>
        </FormField>
      </div>

      <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
        Each {periodNoun.toLowerCase()} is saved to the database on its own. Fill in the fees below and
        click <strong>Save &amp; Add {periodNoun}</strong> to store it and start the next one.
        {hasSaved && ` The university, course and specialization are locked once the first ${periodNoun.toLowerCase()} is saved.`}
      </p>

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
              <th className="px-3 py-3 w-24 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const rowOpen = expanded[index];
              const isSaved = Boolean(item.savedUuid);
              const isSaving = savingIndex === index;

              return (
                <Fragment key={item.savedUuid || `period-${index}`}>
                  <tr className={`border-t border-slate-100 ${isSaved ? 'bg-emerald-50/40' : ''}`}>
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
                      {periodLabelFor(feeType, item.periodNumber || index + 1)}
                    </td>
                    <td className="px-3 py-2">
                      <CurrencyInput symbol={currencySymbol} disabled={isSaved} value={item.tuitionFee} onChange={(v) => updateItem(index, { tuitionFee: v })} />
                    </td>
                    <td className="px-3 py-2">
                      <CurrencyInput symbol={currencySymbol} disabled={isSaved} value={item.otherFee} onChange={(v) => updateItem(index, { otherFee: v })} />
                    </td>
                    {showAdvanced && (
                      <>
                        <td className="px-3 py-2">
                          <CurrencyInput symbol={currencySymbol} disabled={isSaved} value={item.admissionFee} onChange={(v) => updateItem(index, { admissionFee: v })} />
                        </td>
                        <td className="px-3 py-2">
                          <CurrencyInput symbol={currencySymbol} disabled={isSaved} value={item.examFee} onChange={(v) => updateItem(index, { examFee: v })} />
                        </td>
                        <td className="px-3 py-2">
                          <CurrencyInput symbol={currencySymbol} disabled={isSaved} value={item.registrationFee} onChange={(v) => updateItem(index, { registrationFee: v })} />
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2 font-semibold text-slate-900">{formatMoney(totals.rows[index], currency)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {isSaved ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                            <Check className="h-3 w-3" /> Saved
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="rounded p-1 text-brand-600 hover:bg-brand-50 disabled:opacity-40"
                              onClick={() => savePeriod(index)}
                              disabled={isSaving}
                              aria-label={`Save ${periodNoun.toLowerCase()}`}
                              title={`Save this ${periodNoun.toLowerCase()}`}
                            >
                              {isSaving
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Save className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                              disabled={items.length <= 1 || isSaving}
                              onClick={() => removePeriod(index)}
                              aria-label="Remove period"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
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
                                <CurrencyInput symbol={currencySymbol} disabled={isSaved} value={item.admissionFee} onChange={(v) => updateItem(index, { admissionFee: v })} />
                              </FormField>
                              <FormField label="Examination Fee">
                                <CurrencyInput symbol={currencySymbol} disabled={isSaved} value={item.examFee} onChange={(v) => updateItem(index, { examFee: v })} />
                              </FormField>
                              <FormField label="Registration Fee">
                                <CurrencyInput symbol={currencySymbol} disabled={isSaved} value={item.registrationFee} onChange={(v) => updateItem(index, { registrationFee: v })} />
                              </FormField>
                            </>
                          )}
                          <FormField label="Fee nature">
                            <select className="input" disabled={isSaved} value={item.feeNature || 'RECURRING'} onChange={(e) => updateItem(index, { feeNature: e.target.value })}>
                              {FEE_NATURES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                            </select>
                          </FormField>
                          <FormField label="Refund policy">
                            <select
                              className="input"
                              disabled={isSaved}
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

      <button
        type="button"
        className="btn-secondary"
        onClick={handleAddPeriod}
        disabled={savingIndex !== null}
      >
        {savingIndex !== null
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Plus className="h-4 w-4" />}
        Save &amp; Add {periodNoun}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Saved so far</p>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(totals.saved, currency)}</p>
          <p className="text-xs text-slate-500">
            {savedItems.length} of {totalPeriods || '—'} {periodNoun.toLowerCase()}s saved
          </p>
        </div>
        <p className="text-xs text-slate-500">Each period total is calculated from tuition, admission, examination, registration and other fees.</p>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={loading || savingIndex !== null}>
          {(loading || savingIndex !== null) ? 'Saving...' : 'Done'}
        </button>
      </div>
    </form>
  );
}
