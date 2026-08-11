import { formatDateTime } from '../../utils/crmConstants';

const activityIcons = {
  LEAD_CREATED: '🆕',
  COUNSELOR_ASSIGNED: '👤',
  STATUS_CHANGED: '🔄',
  NOTE_ADDED: '📝',
  FOLLOWUP_SCHEDULED: '📅',
  APPLICATION_STARTED: '📋',
  APPLICATION_SUBMITTED: '✅',
  ADMISSION_CONFIRMED: '🎓',
  CALL_COMPLETED: '📞',
  WHATSAPP_SENT: '💬',
  EMAIL_SENT: '📧',
};

export default function LeadActivityTimeline({ activities = [] }) {
  if (!activities.length) {
    return <p className="py-8 text-center text-sm text-slate-500">No activities yet</p>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg">
            {activityIcons[activity.activityType] || '📌'}
          </div>
          <div className="flex-1 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-900">
                {activity.activityType?.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-400">{formatDateTime(activity.createdAt)}</span>
            </div>
            {activity.description && (
              <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
            )}
            {activity.performedByName && (
              <p className="mt-1 text-xs text-slate-400">by {activity.performedByName}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
