const variants = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-cyan-100 text-cyan-800',
  INTERESTED: 'bg-emerald-100 text-emerald-800',
  FOLLOW_UP: 'bg-amber-100 text-amber-800',
  APPLICATION_STARTED: 'bg-indigo-100 text-indigo-800',
  APPLICATION_SUBMITTED: 'bg-violet-100 text-violet-800',
  ADMISSION_CONFIRMED: 'bg-green-100 text-green-800',
  NOT_INTERESTED: 'bg-slate-100 text-slate-600',
  LOST: 'bg-red-100 text-red-800',
  DRAFT: 'bg-slate-100 text-slate-600',
  STARTED: 'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-indigo-100 text-indigo-800',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-green-100 text-green-800',
  MISSED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
};

const priorityVariants = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function Badge({ status, type = 'status' }) {
  const cls = type === 'priority'
    ? priorityVariants[status] || 'bg-slate-100 text-slate-600'
    : variants[status] || 'bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
