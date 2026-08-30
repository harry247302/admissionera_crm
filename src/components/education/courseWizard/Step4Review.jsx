import { Pencil } from 'lucide-react';
import { formatCurrency, formatLabel } from '../../../utils/educationConstants';
import { calcFeesGrandTotal, calcSimpleRowTotal, feeTypeLabel } from './courseWizardUtils';

function ReviewSection({ title, onEdit, children }) {
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        {onEdit && (
          <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="sm:col-span-2 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export default function Step4Review({
  courseData,
  specializations,
  fees,
  universityName,
  onEditStep,
}) {
  const grandTotal = calcFeesGrandTotal(fees);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Review all details before submitting. The course, specializations, and fee structure will be saved together.
      </div>

      <ReviewSection title="Course Details" onEdit={() => onEditStep(0)}>
        <dl className="space-y-2">
          <DetailRow label="University" value={universityName} />
          <DetailRow label="Course Name" value={courseData.name} />
          <DetailRow label="Code" value={courseData.code} />
          <DetailRow label="Degree" value={courseData.degree} />
          <DetailRow label="Level" value={formatLabel(courseData.level)} />
          <DetailRow label="Department" value={courseData.department} />
          <DetailRow label="Faculty" value={courseData.faculty} />
          <DetailRow label="Study Mode" value={courseData.studyMode} />
          <DetailRow label="Attendance" value={courseData.attendanceMode} />
          <DetailRow label="Language" value={courseData.language} />
          <DetailRow label="Currency" value={courseData.currency} />
          <DetailRow label="Status" value={formatLabel(courseData.status)} />
          <DetailRow label="Description" value={courseData.description} />
          <DetailRow label="Overview" value={courseData.overview} />
          <DetailRow label="Eligibility" value={courseData.eligibility} />
          <DetailRow label="Curriculum" value={courseData.curriculum} />
          <DetailRow label="Career Opportunities" value={courseData.careerOpportunities} />
        </dl>
      </ReviewSection>

      <ReviewSection title="Specializations" onEdit={() => onEditStep(1)}>
        {specializations.filter((s) => s.name?.trim()).length === 0 ? (
          <p className="text-sm text-slate-500">No specializations added.</p>
        ) : (
          <ul className="space-y-2">
            {specializations.filter((s) => s.name?.trim()).map((spec, index) => (
              <li key={spec.clientId} className="rounded-lg border border-slate-100 px-3 py-2">
                <p className="font-medium text-slate-900">{index + 1}. {spec.name}</p>
                <p className="text-xs text-slate-500">{[spec.code, spec.description].filter(Boolean).join(' · ') || formatLabel(spec.status)}</p>
              </li>
            ))}
          </ul>
        )}
      </ReviewSection>

      <ReviewSection title="Fee Structure" onEdit={() => onEditStep(2)}>
        <p className="text-sm font-medium text-slate-900">Fee Type: {feeTypeLabel(fees.activeType)}</p>
        <div className="space-y-1">
          {fees.activeType === 'YEAR' && fees.yearly.map((row, index) => (
            <p key={`year-${index}`} className="text-sm text-slate-600">
              Year {index + 1} → {formatCurrency(calcSimpleRowTotal(row))}
            </p>
          ))}
          {fees.activeType === 'SEMESTER' && fees.semester.map((row, index) => (
            <p key={`sem-${index}`} className="text-sm text-slate-600">
              Semester {index + 1} → {formatCurrency(calcSimpleRowTotal(row))}
            </p>
          ))}
          {fees.activeType === 'ONE_TIME' && (
            <p className="text-sm text-slate-600">
              One-Time Fee → {formatCurrency(calcSimpleRowTotal(fees.oneTime))}
            </p>
          )}
        </div>
        <div className="mt-3 rounded-lg bg-brand-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-brand-700">Total Course Fee</p>
          <p className="text-xl font-bold text-brand-900">{formatCurrency(grandTotal)}</p>
        </div>
      </ReviewSection>
    </div>
  );
}
