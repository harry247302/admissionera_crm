import {
  ArrowDown, ArrowUp, Eye, IndianRupee, Pencil, Trash2,
} from 'lucide-react';
import ActionMenu from './ActionMenu';
import StatusBadge from './StatusBadge';
import { formatLabel, formatMoney } from '../../utils/educationConstants';

/** Flatten courses so every specialization becomes its own standalone row. */
const flattenCourses = (courses) =>
  courses.flatMap((course, index) => {
    const base = course.uuid || course.id || `${course.name}-${index}`;
    const specs = course.specializations || [];

    if (!specs.length) {
      return [{
        key: `${base}-none`,
        course,
        spec: null,
        title: course.name,
      }];
    }

    return specs.map((spec, specIndex) => ({
      key: `${base}-${spec.uuid || specIndex}`,
      course,
      spec,
      title: `${course.name} in ${spec.name}`,
    }));
  });

function FeeBreakdown({ fees = [] }) {
  if (!fees.length) return <span className="text-xs text-slate-400">No fees</span>;

  return (
    <div className="space-y-0.5">
      {fees.map((fee) => (
        <div key={fee.uuid} className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-slate-500">
            {/* {fee.periodLabel || `Period ${fee.periodNumber}`}
            {fee.totalPeriods ? (
              <span className="text-slate-400"> ({fee.periodNumber}/{fee.totalPeriods})</span>
            ) : null} */}
          </span>
          {/* <span className="font-medium text-slate-700">
            {formatMoney(fee.amount, fee.currency)}
          </span> */}
        </div>
      ))}
    </div>
  );
}

export default function CourseTable({
  courses = [],
  onView,
  onEdit,
  onDelete,
  onEditFees,
  onViewFAQs,
  sortBy,
  sortDir,
  onSort,
}) {
  const rows = flattenCourses(courses);

  const SortHeader = ({ field, children }) => {
    const active = sortBy === field;
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-700"
        onClick={() => onSort?.(field)}
      >
        {children}
        {active && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    );
  };

  const actionItems = (c) => [
    { label: 'View details', icon: <Eye className="h-4 w-4" />, onClick: () => onView?.(c) },
    { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => onEdit?.(c) },
    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => onDelete?.(c) },
  ];

  const feeLabel = (total, currency) => (total ? formatMoney(total, currency) : '—');

  return (
    <>
      <div className="card hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-4 py-3"><SortHeader field="name">Course</SortHeader></th>
              <th className="px-4 py-3"><SortHeader field="universityName">University</SortHeader></th>
              <th className="px-4 py-3">FAQs</th>
              <th className="px-4 py-3"><SortHeader field="level">Level</SortHeader></th>
              <th className="px-4 py-3">Specialization</th>
              {/* <th className="px-4 py-3">Fee Breakdown</th> */}
              <th className="px-4 py-3">Total Fee</th>
              <th className="px-4 py-3"><SortHeader field="status">Status</SortHeader></th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, course, spec, title }) => (
              <tr key={key} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="align-top px-4 py-3">
                  <button
                    type="button"
                    className="text-left font-medium text-slate-900 hover:text-brand-600"
                    onClick={() => onView?.(course)}
                  >
                    {title}
                  </button>
                  <p className="font-mono text-xs text-slate-400">
                    {course.code}
                    {course.degree && course.degree !== course.code ? ` · ${course.degree}` : ''}
                  </p>
                </td>
              
                <td className="align-top px-4 py-3">
                  <p className="text-slate-700">{course.universityName || '—'}</p>
                  <p className="text-xs text-slate-400">{course.universityCode}</p>
                </td>
                <td className="align-top px-4 py-3">
                  <button
                    type="button"
                    className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                    onClick={() => onViewFAQs?.(course)}
                  >
                    View FAQs
                  </button>
                </td>
                <td className="align-top px-4 py-3"><StatusBadge status={course.level} /></td>
                <td className="align-top px-4 py-3">
                  {spec ? (
                    <>
                      <p className="font-medium text-slate-800">{spec.name}</p>
                      {spec.code && <p className="font-mono text-xs text-slate-400">{spec.code}</p>}
                    </>
                  ) : (
                    <span className="text-slate-400">No specialization</span>
                  )}
                </td>
                {/* <td className="align-top px-4 py-3">
                  <FeeBreakdown fees={spec?.fees} />
                </td> */}
                <td className="align-top px-4 py-3">
                  {/* <p className="font-medium text-slate-800">
                    {feeLabel(spec?.totalFee, spec?.feeCurrency || course.feeCurrency)}
                  </p> */}
                  {/* {spec?.feeStructureType && (
                    <p className="text-xs text-slate-400">{formatLabel(spec.feeStructureType)}</p>
                  )} */}
                  {spec && (
                    <button
                      type="button"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                      onClick={() => onEditFees?.({ course, spec })}
                    >
                      <IndianRupee className="h-3 w-3" /> Update fees
                    </button>
                  )}
                </td>
                <td className="align-top px-4 py-3"><StatusBadge status={course.status} /></td>
                <td className="align-top px-4 py-3">
                  <div className="flex justify-end">
                    <ActionMenu items={actionItems(course)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {rows.map(({ key, course, spec, title }) => (
          <div key={key} className="card space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-xs text-slate-500">{course.code} · {course.universityName}</p>
              </div>
              <StatusBadge status={course.status} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <StatusBadge status={course.level} />
              <span className="font-medium text-slate-700">
                {feeLabel(spec?.totalFee, spec?.feeCurrency || course.feeCurrency)}
              </span>
            </div>

            <FeeBreakdown fees={spec?.fees} />

            <div className="flex items-center justify-between gap-2">
              {spec ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600"
                  onClick={() => onEditFees?.({ course, spec })}
                >
                  <IndianRupee className="h-3 w-3" /> Update fees
                </button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700"
                  onClick={() => onViewFAQs?.(course)}
                >
                  View FAQs
                </button>
                <ActionMenu items={actionItems(course)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
