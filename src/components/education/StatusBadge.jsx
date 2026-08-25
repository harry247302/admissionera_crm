import Badge from '../common/Badge';
import { formatLabel } from '../../utils/educationConstants';

const extraVariants = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-slate-100 text-slate-600',
  SEMESTER: 'bg-indigo-100 text-indigo-800',
  YEAR: 'bg-cyan-100 text-cyan-800',
  GOVERNMENT: 'bg-emerald-100 text-emerald-800',
  PRIVATE: 'bg-blue-100 text-blue-800',
  DEEMED: 'bg-violet-100 text-violet-800',
  CENTRAL: 'bg-brand-100 text-brand-800',
  STATE: 'bg-amber-100 text-amber-800',
  OTHER: 'bg-slate-100 text-slate-600',
  CERTIFICATE: 'bg-slate-100 text-slate-700',
  DIPLOMA: 'bg-teal-100 text-teal-800',
  UNDERGRADUATE: 'bg-blue-100 text-blue-800',
  POSTGRADUATE: 'bg-indigo-100 text-indigo-800',
  DOCTORATE: 'bg-purple-100 text-purple-800',
  RECURRING: 'bg-blue-100 text-blue-800',
  ONE_TIME: 'bg-amber-100 text-amber-800',
};

export default function StatusBadge({ status }) {
  const cls = extraVariants[status];
  if (cls) {
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
        {formatLabel(status)}
      </span>
    );
  }
  return <Badge status={status} />;
}
