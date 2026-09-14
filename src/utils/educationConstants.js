export const UNIVERSITY_TYPES = [
  'GOVERNMENT',
  'PRIVATE',
  'DEEMED',
  'CENTRAL',
  'STATE',
  'OTHER',
];

export const COURSE_LEVELS = [
  'CERTIFICATE',
  'DIPLOMA',
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'DOCTORATE',
];

export const STUDY_MODES = [
  'FULL_TIME',
  'PART_TIME',
  'DISTANCE',
  'ONLINE',
  'HYBRID',
];

export const ATTENDANCE_MODES = [
  'ON_CAMPUS',
  'ONLINE',
  'HYBRID',
];

export const DURATION_UNITS = ['MONTHS', 'YEARS', 'SEMESTERS'];

export const ENTITY_STATUSES = ['ACTIVE', 'INACTIVE'];

export const FEE_TYPES = [
  { value: 'YEAR', label: 'Year Wise' },
  { value: 'SEMESTER', label: 'Semester Wise' },
  { value: 'ONE_TIME', label: 'One-Time' },
];

export const FEE_NATURES = [
  { value: 'RECURRING', label: 'Recurring' },
  { value: 'ONE_TIME', label: 'One-time' },
];

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD'];

export const PAGE_SIZE = 10;

export const formatCurrency = (value) => {
  if (value == null || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return `₹${num.toLocaleString('en-IN')}`;
};

const CURRENCY_SYMBOLS = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$',
};

export const formatMoney = (value, currency = 'INR') => {
  if (value == null || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  return `${symbol}${num.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US')}`;
};

export const formatLabel = (value) => {
  if (!value) return '—';
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const calcItemTotal = (item = {}) =>
  toNumber(item.tuitionFee)
  + toNumber(item.admissionFee)
  + toNumber(item.examFee)
  + toNumber(item.registrationFee)
  + toNumber(item.otherFee);

export const calcStructureTotal = (items = []) =>
  items.reduce((sum, item) => sum + calcItemTotal(item), 0);

export const emptyFeeItem = (periodNumber = 1, periodType = 'semester') => ({
  periodNumber,
  periodType,
  tuitionFee: '',
  admissionFee: '',
  examFee: '',
  registrationFee: '',
  otherFee: '',
  totalFee: 0,
  feeNature: 'RECURRING',
  isRefundable: false,
});
