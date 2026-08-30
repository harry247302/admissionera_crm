import { calcItemTotal, calcStructureTotal, emptyFeeItem, toNumber } from '../../../utils/educationConstants';

export const WIZARD_STEPS = [
  { key: 'course', label: 'Course Details' },
  { key: 'specialization', label: 'Specialization' },
  { key: 'fees', label: 'Fee Structure' },
  { key: 'review', label: 'Review' },
];

export const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const emptySpecialization = () => ({
  clientId: crypto.randomUUID(),
  name: '',
  code: '',
  description: '',
  status: 'ACTIVE',
  savedUuid: '',
});

export const getYearCount = (duration, durationUnit) => {
  const value = Number(duration) || 0;
  if (durationUnit === 'YEARS') return Math.max(1, Math.ceil(value || 1));
  if (durationUnit === 'SEMESTERS') return Math.max(1, Math.ceil((value || 2) / 2));
  if (durationUnit === 'MONTHS') return Math.max(1, Math.ceil((value || 12) / 12));
  return Math.max(1, Math.ceil(value || 1));
};

export const getSemesterCount = (duration, durationUnit) => {
  const value = Number(duration) || 0;
  if (durationUnit === 'SEMESTERS') return Math.max(1, Math.ceil(value || 1));
  if (durationUnit === 'YEARS') return Math.max(1, Math.ceil((value || 3) * 2));
  if (durationUnit === 'MONTHS') return Math.max(1, Math.ceil((value || 12) / 6));
  return Math.max(1, Math.ceil(value || 2));
};

export const buildYearlyFees = (count) =>
  Array.from({ length: count }, (_, i) => ({
    ...emptyFeeItem(i + 1, 'year'),
    tuitionFee: '',
    otherFee: '',
    admissionFee: '',
    examFee: '',
    registrationFee: '',
  }));

export const buildSemesterFees = (count) =>
  Array.from({ length: count }, (_, i) => ({
    ...emptyFeeItem(i + 1, 'semester'),
    tuitionFee: '',
    otherFee: '',
    admissionFee: '',
    examFee: '',
    registrationFee: '',
  }));

export const initialFeesState = (currency = 'INR') => ({
  activeType: 'YEAR',
  currency,
  duration: 3,
  durationUnit: 'YEARS',
  yearly: buildYearlyFees(3),
  semester: buildSemesterFees(6),
  oneTime: { tuitionFee: '', otherFee: '', admissionFee: '', examFee: '', registrationFee: '' },
});

export const calcSimpleRowTotal = (row = {}) =>
  toNumber(row.tuitionFee) + toNumber(row.otherFee);

export const calcFeesGrandTotal = (fees) => {
  if (fees.activeType === 'YEAR') {
    return fees.yearly.reduce((sum, row) => sum + calcSimpleRowTotal(row), 0);
  }
  if (fees.activeType === 'SEMESTER') {
    return fees.semester.reduce((sum, row) => sum + calcSimpleRowTotal(row), 0);
  }
  return calcSimpleRowTotal(fees.oneTime);
};

export const feeTypeLabel = (type) => {
  if (type === 'YEAR') return 'Yearly';
  if (type === 'SEMESTER') return 'Semester Wise';
  if (type === 'ONE_TIME') return 'One-Time';
  return type;
};

export const buildFeeStructurePayload = (fees, courseId, universityId) => {
  if (fees.activeType === 'ONE_TIME') {
    const item = {
      periodNumber: 1,
      periodType: 'one_time',
      tuitionFee: toNumber(fees.oneTime.tuitionFee),
      otherFee: toNumber(fees.oneTime.otherFee),
      admissionFee: toNumber(fees.oneTime.admissionFee),
      examFee: toNumber(fees.oneTime.examFee),
      registrationFee: toNumber(fees.oneTime.registrationFee),
      feeNature: 'ONE_TIME',
      isRefundable: false,
    };
    item.totalFee = calcItemTotal(item);
    return {
      universityId: Number(universityId),
      courseId: Number(courseId),
      feeType: 'ONE_TIME',
      status: 'ACTIVE',
      items: [item],
    };
  }

  const items = (fees.activeType === 'YEAR' ? fees.yearly : fees.semester).map((row, index) => {
    const item = {
      periodNumber: index + 1,
      periodType: fees.activeType === 'YEAR' ? 'year' : 'semester',
      tuitionFee: toNumber(row.tuitionFee),
      otherFee: toNumber(row.otherFee),
      admissionFee: toNumber(row.admissionFee),
      examFee: toNumber(row.examFee),
      registrationFee: toNumber(row.registrationFee),
      feeNature: 'RECURRING',
      isRefundable: false,
    };
    item.totalFee = calcItemTotal(item);
    return item;
  });

  return {
    universityId: Number(universityId),
    courseId: Number(courseId),
    feeType: fees.activeType,
    status: 'ACTIVE',
    items,
  };
};

export const STEP1_FIELDS = [
  'universityId', 'name', 'code', 'degree', 'level', 'status',
  'department', 'faculty', 'studyMode', 'attendanceMode', 'language', 'currency',
  'description', 'overview', 'eligibility', 'curriculum', 'careerOpportunities',
];
