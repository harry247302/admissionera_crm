import Badge from '../common/Badge';

export default function LeadStatusBadge({ status }) {
  return <Badge status={status} />;
}

export function PriorityBadge({ priority }) {
  return <Badge status={priority} type="priority" />;
}
