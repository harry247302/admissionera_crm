export const LEAD_STATUSES = [
  'NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP',
  'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'ADMISSION_CONFIRMED',
  'NOT_INTERESTED', 'LOST',
];

export const LEAD_SOURCES = [
  'WEBSITE', 'GOOGLE_ADS', 'FACEBOOK', 'INSTAGRAM',
  'WHATSAPP', 'ORGANIC', 'REFERRAL', 'WALK_IN', 'OTHER',
];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const FOLLOWUP_TYPES = [
  'CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'COUNSELLING_SESSION', 'DEMO', 'OTHER',
];

export const FOLLOWUP_STATUSES = ['PENDING', 'COMPLETED', 'MISSED', 'CANCELLED'];

export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export const APPLICATION_STATUSES = [
  'DRAFT', 'STARTED', 'SUBMITTED', 'UNDER_REVIEW',
  'APPROVED', 'REJECTED', 'WITHDRAWN',
];

export const CRM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  COUNSELOR: 'counselor',
  SALES: 'sales',
};

export const canManageCRM = (role) =>
  ['admin', 'super_admin', 'manager', 'counselor', 'sales', 'user'].includes(role);

export const canAssignLeads = (role) =>
  ['admin', 'super_admin', 'manager'].includes(role);

export const canDeleteLeads = (role) =>
  ['admin', 'super_admin', 'manager'].includes(role);

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const exportToCSV = (data, filename) => {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
