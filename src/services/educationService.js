import api from './api';
import { INITIAL_EDUCATION_DATA } from '../data/educationMockData';
import { calcItemTotal, calcStructureTotal, PAGE_SIZE } from '../utils/educationConstants';

const USE_MOCK = import.meta.env.VITE_EDUCATION_API !== 'true';
const STORAGE_KEY = 'admissionera_education_v1';
const MOCK_DELAY = 280;

const delay = (ms = MOCK_DELAY) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = (value) => JSON.parse(JSON.stringify(value));

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.universities && parsed?.courses && parsed?.specializations && parsed?.feeStructures && parsed?.feeItems) {
        return parsed;
      }
    }
  } catch {
    /* fall through to seed data */
  }
  const seeded = clone(INITIAL_EDUCATION_DATA);
  saveDb(seeded);
  return seeded;
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function nowIso() {
  return new Date().toISOString();
}

function matchesSearch(haystack, search) {
  if (!search) return true;
  const q = String(search).trim().toLowerCase();
  if (!q) return true;
  return haystack.some((value) => String(value || '').toLowerCase().includes(q));
}

function paginate(list, { page = 1, limit = PAGE_SIZE, sortBy, sortDir = 'asc' } = {}) {
  const sorted = [...list];
  if (sortBy) {
    sorted.sort((a, b) => {
      const av = a[sortBy] ?? '';
      const bv = b[sortBy] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'desc' ? bv - av : av - bv;
      }
      return sortDir === 'desc'
        ? String(bv).localeCompare(String(av), undefined, { numeric: true, sensitivity: 'base' })
        : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
    });
  }
  const total = sorted.length;
  const currentPage = Number(page) || 1;
  const pageSize = Number(limit) || PAGE_SIZE;
  const start = (currentPage - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    pagination: {
      total,
      page: currentPage,
      limit: pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

function universityById(db, id) {
  return db.universities.find((u) => u.id === Number(id));
}

function courseById(db, id) {
  return db.courses.find((c) => c.id === Number(id));
}

function hydrateCourse(db, course) {
  const university = universityById(db, course.universityId);
  return {
    ...course,
    universityName: university?.name || '—',
    universityCode: university?.code || '',
    universityType: university?.type || '',
    universityLocation: university?.location || '',
  };
}

function hydrateSpecialization(db, spec) {
  const university = universityById(db, spec.universityId);
  const course = courseById(db, spec.courseId);
  return {
    ...spec,
    universityName: university?.name || '—',
    universityCode: university?.code || '',
    courseName: course?.name || '—',
    courseCode: course?.code || '',
  };
}

function hydrateFeeStructure(db, structure) {
  const university = universityById(db, structure.universityId);
  const course = courseById(db, structure.courseId);
  const items = db.feeItems
    .filter((item) => item.feeStructureId === structure.id)
    .sort((a, b) => a.periodNumber - b.periodNumber);
  return {
    ...structure,
    universityName: university?.name || '—',
    universityCode: university?.code || '',
    courseName: course?.name || '—',
    courseCode: course?.code || '',
    items,
  };
}

function mockError(message, status = 400) {
  const err = new Error(message);
  err.response = { data: { message }, status };
  throw err;
}

function assertCourseUniversity(db, universityId, courseId) {
  const course = courseById(db, courseId);
  if (!course) mockError('Selected course was not found');
  if (Number(course.universityId) !== Number(universityId)) {
    mockError('Selected course does not belong to the selected university');
  }
  return course;
}

function deactivateOtherFeeStructures(db, courseId, keepId) {
  db.feeStructures.forEach((fs) => {
    if (fs.courseId === Number(courseId) && fs.id !== keepId && fs.status === 'ACTIVE') {
      fs.status = 'INACTIVE';
      fs.updatedAt = nowIso();
    }
  });
}

function validateFeeItems(feeType, items) {
  if (!Array.isArray(items) || items.length === 0) {
    mockError('Add at least one semester or year before saving the fee structure');
  }
  const periodType = feeType === 'YEAR' ? 'year' : 'semester';
  items.forEach((item, index) => {
    const total = calcItemTotal(item);
    if (total <= 0) {
      mockError(`${periodType === 'year' ? 'Year' : 'Semester'} ${item.periodNumber || index + 1} must have a fee greater than zero`);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Mock implementations                                                       */
/* -------------------------------------------------------------------------- */

const mockUniversityService = {
  async getAll(params = {}) {
    await delay();
    const db = loadDb();
    let list = db.universities;
    if (params.status) list = list.filter((u) => u.status === params.status);
    if (params.type) list = list.filter((u) => u.type === params.type);
    if (params.search) {
      list = list.filter((u) => matchesSearch([u.name, u.code, u.location, u.type], params.search));
    }
    const { items, pagination } = paginate(list, params);
    return { data: { universities: items, pagination } };
  },
  async getOptions() {
    await delay(80);
    const db = loadDb();
    return {
      data: {
        universities: db.universities.map((u) => ({
          id: u.id, name: u.name, code: u.code, status: u.status, type: u.type,
        })),
      },
    };
  },
  async getById(id) {
    await delay();
    const db = loadDb();
    const university = universityById(db, id);
    if (!university) mockError('University not found', 404);
    const courses = db.courses.filter((c) => c.universityId === university.id).map((c) => hydrateCourse(db, c));
    return { data: { university: { ...university, courses, courseCount: courses.length } } };
  },
  async create(payload) {
    await delay();
    if (!payload.name?.trim()) mockError('University name is required');
    if (!payload.code?.trim()) mockError('University code is required');
    if (!payload.type) mockError('University type is required');
    const db = loadDb();
    const code = payload.code.trim().toUpperCase();
    if (db.universities.some((u) => u.code.toLowerCase() === code.toLowerCase())) {
      mockError('A university with this code already exists');
    }
    const university = {
      id: nextId(db.universities),
      name: payload.name.trim(),
      code,
      type: payload.type,
      location: payload.location?.trim() || '',
      website: payload.website?.trim() || '',
      description: payload.description?.trim() || '',
      status: payload.status || 'ACTIVE',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.universities.unshift(university);
    saveDb(db);
    return { data: { university } };
  },
  async update(id, payload) {
    await delay();
    const db = loadDb();
    const idx = db.universities.findIndex((u) => u.id === Number(id));
    if (idx === -1) mockError('University not found', 404);
    const code = (payload.code || db.universities[idx].code).trim().toUpperCase();
    if (db.universities.some((u) => u.id !== Number(id) && u.code.toLowerCase() === code.toLowerCase())) {
      mockError('A university with this code already exists');
    }
    db.universities[idx] = {
      ...db.universities[idx],
      ...payload,
      code,
      name: payload.name?.trim() || db.universities[idx].name,
      updatedAt: nowIso(),
    };
    saveDb(db);
    return { data: { university: db.universities[idx] } };
  },
  async delete(id) {
    await delay();
    const db = loadDb();
    const university = universityById(db, id);
    if (!university) mockError('University not found', 404);
    const courseIds = db.courses.filter((c) => c.universityId === university.id).map((c) => c.id);
    db.universities = db.universities.filter((u) => u.id !== university.id);
    db.courses = db.courses.filter((c) => c.universityId !== university.id);
    db.specializations = db.specializations.filter((s) => s.universityId !== university.id);
    const feeIds = db.feeStructures.filter((f) => f.universityId === university.id).map((f) => f.id);
    db.feeStructures = db.feeStructures.filter((f) => f.universityId !== university.id);
    db.feeItems = db.feeItems.filter((i) => !feeIds.includes(i.feeStructureId));
    saveDb(db);
    return { data: { id: university.id, removedCourses: courseIds.length } };
  },
};

const mockCourseService = {
  async getAll(params = {}) {
    await delay();
    const db = loadDb();
    let list = db.courses.map((c) => hydrateCourse(db, c));
    if (params.status) list = list.filter((c) => c.status === params.status);
    if (params.level) list = list.filter((c) => c.level === params.level);
    if (params.universityId) list = list.filter((c) => c.universityId === Number(params.universityId));
    if (params.search) {
      list = list.filter((c) => matchesSearch([c.name, c.code, c.universityName, c.level], params.search));
    }
    const { items, pagination } = paginate(list, params);
    return { data: { courses: items, pagination } };
  },
  async getOptions(params = {}) {
    await delay(80);
    const db = loadDb();
    let list = db.courses;
    if (params.universityId) list = list.filter((c) => c.universityId === Number(params.universityId));
    if (params.status) list = list.filter((c) => c.status === params.status);
    return {
      data: {
        courses: list.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          universityId: c.universityId,
          status: c.status,
          numberOfSemesters: c.numberOfSemesters,
          numberOfYears: c.numberOfYears,
        })),
      },
    };
  },
  async getById(id) {
    await delay();
    const db = loadDb();
    const course = courseById(db, id);
    if (!course) mockError('Course not found', 404);
    const specializations = db.specializations
      .filter((s) => s.courseId === course.id)
      .map((s) => hydrateSpecialization(db, s));
    const feeStructures = db.feeStructures
      .filter((f) => f.courseId === course.id)
      .map((f) => hydrateFeeStructure(db, f));
    const activeFee = feeStructures.find((f) => f.status === 'ACTIVE') || null;
    return {
      data: {
        course: {
          ...hydrateCourse(db, course),
          specializations,
          feeStructures,
          activeFeeStructure: activeFee,
          stats: {
            specializationCount: specializations.length,
            activeSpecializations: specializations.filter((s) => s.status === 'ACTIVE').length,
            feeStructureCount: feeStructures.length,
            totalFee: activeFee?.totalFee || 0,
          },
        },
      },
    };
  },
  async create(payload) {
    await delay();
    if (!payload.universityId) mockError('University is required');
    if (!payload.name?.trim()) mockError('Course name is required');
    if (!payload.code?.trim()) mockError('Course code is required');
    if (!payload.level) mockError('Course level is required');
    const db = loadDb();
    if (!universityById(db, payload.universityId)) mockError('Selected university was not found');
    const course = {
      id: nextId(db.courses),
      universityId: Number(payload.universityId),
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      level: payload.level,
      duration: Number(payload.duration) || 0,
      durationUnit: payload.durationUnit || 'YEARS',
      numberOfSemesters: Number(payload.numberOfSemesters) || 0,
      numberOfYears: Number(payload.numberOfYears) || 0,
      description: payload.description?.trim() || '',
      eligibility: payload.eligibility?.trim() || '',
      status: payload.status || 'ACTIVE',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.courses.unshift(course);
    saveDb(db);
    return { data: { course: hydrateCourse(db, course) } };
  },
  async update(id, payload) {
    await delay();
    const db = loadDb();
    const idx = db.courses.findIndex((c) => c.id === Number(id));
    if (idx === -1) mockError('Course not found', 404);
    if (payload.universityId && !universityById(db, payload.universityId)) mockError('Selected university was not found');
    const nextUniversityId = payload.universityId ? Number(payload.universityId) : db.courses[idx].universityId;
    db.courses[idx] = {
      ...db.courses[idx],
      ...payload,
      universityId: nextUniversityId,
      name: payload.name?.trim() || db.courses[idx].name,
      code: payload.code ? payload.code.trim().toUpperCase() : db.courses[idx].code,
      duration: payload.duration != null ? Number(payload.duration) : db.courses[idx].duration,
      numberOfSemesters: payload.numberOfSemesters != null ? Number(payload.numberOfSemesters) : db.courses[idx].numberOfSemesters,
      numberOfYears: payload.numberOfYears != null ? Number(payload.numberOfYears) : db.courses[idx].numberOfYears,
      updatedAt: nowIso(),
    };
    db.specializations.forEach((s) => {
      if (s.courseId === Number(id)) s.universityId = nextUniversityId;
    });
    db.feeStructures.forEach((f) => {
      if (f.courseId === Number(id)) f.universityId = nextUniversityId;
    });
    saveDb(db);
    return { data: { course: hydrateCourse(db, db.courses[idx]) } };
  },
  async delete(id) {
    await delay();
    const db = loadDb();
    const course = courseById(db, id);
    if (!course) mockError('Course not found', 404);
    db.courses = db.courses.filter((c) => c.id !== course.id);
    db.specializations = db.specializations.filter((s) => s.courseId !== course.id);
    const feeIds = db.feeStructures.filter((f) => f.courseId === course.id).map((f) => f.id);
    db.feeStructures = db.feeStructures.filter((f) => f.courseId !== course.id);
    db.feeItems = db.feeItems.filter((i) => !feeIds.includes(i.feeStructureId));
    saveDb(db);
    return { data: { id: course.id } };
  },
};

const mockSpecializationService = {
  async getAll(params = {}) {
    await delay();
    const db = loadDb();
    let list = db.specializations.map((s) => hydrateSpecialization(db, s));
    if (params.status) list = list.filter((s) => s.status === params.status);
    if (params.universityId) list = list.filter((s) => s.universityId === Number(params.universityId));
    if (params.courseId) list = list.filter((s) => s.courseId === Number(params.courseId));
    if (params.search) {
      list = list.filter((s) => matchesSearch([s.name, s.code, s.courseName, s.universityName], params.search));
    }
    const { items, pagination } = paginate(list, params);
    return { data: { specializations: items, pagination } };
  },
  async getById(id) {
    await delay();
    const db = loadDb();
    const spec = db.specializations.find((s) => s.id === Number(id));
    if (!spec) mockError('Specialization not found', 404);
    return { data: { specialization: hydrateSpecialization(db, spec) } };
  },
  async create(payload) {
    await delay();
    if (!payload.universityId) mockError('University is required');
    if (!payload.courseId) mockError('Course is required');
    if (!payload.name?.trim()) mockError('Specialization name is required');
    if (!payload.code?.trim()) mockError('Specialization code is required');
    const db = loadDb();
    const course = assertCourseUniversity(db, payload.universityId, payload.courseId);
    const spec = {
      id: nextId(db.specializations),
      universityId: course.universityId,
      courseId: course.id,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      description: payload.description?.trim() || '',
      eligibility: payload.eligibility?.trim() || '',
      status: payload.status || 'ACTIVE',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.specializations.unshift(spec);
    saveDb(db);
    return { data: { specialization: hydrateSpecialization(db, spec) } };
  },
  async update(id, payload) {
    await delay();
    const db = loadDb();
    const idx = db.specializations.findIndex((s) => s.id === Number(id));
    if (idx === -1) mockError('Specialization not found', 404);
    const courseId = payload.courseId ? Number(payload.courseId) : db.specializations[idx].courseId;
    const universityId = payload.universityId ? Number(payload.universityId) : db.specializations[idx].universityId;
    const course = assertCourseUniversity(db, universityId, courseId);
    db.specializations[idx] = {
      ...db.specializations[idx],
      ...payload,
      universityId: course.universityId,
      courseId: course.id,
      name: payload.name?.trim() || db.specializations[idx].name,
      code: payload.code ? payload.code.trim().toUpperCase() : db.specializations[idx].code,
      updatedAt: nowIso(),
    };
    saveDb(db);
    return { data: { specialization: hydrateSpecialization(db, db.specializations[idx]) } };
  },
  async delete(id) {
    await delay();
    const db = loadDb();
    const spec = db.specializations.find((s) => s.id === Number(id));
    if (!spec) mockError('Specialization not found', 404);
    db.specializations = db.specializations.filter((s) => s.id !== spec.id);
    saveDb(db);
    return { data: { id: spec.id } };
  },
};

const mockFeeService = {
  async getAll(params = {}) {
    await delay();
    const db = loadDb();
    let list = db.feeStructures.map((f) => hydrateFeeStructure(db, f));
    if (params.status) list = list.filter((f) => f.status === params.status);
    if (params.feeType) list = list.filter((f) => f.feeType === params.feeType);
    if (params.universityId) list = list.filter((f) => f.universityId === Number(params.universityId));
    if (params.courseId) list = list.filter((f) => f.courseId === Number(params.courseId));
    if (params.search) {
      list = list.filter((f) => matchesSearch([f.courseName, f.courseCode, f.universityName], params.search));
    }
    const { items, pagination } = paginate(list, params);
    return { data: { feeStructures: items, pagination } };
  },
  async getById(id) {
    await delay();
    const db = loadDb();
    const structure = db.feeStructures.find((f) => f.id === Number(id));
    if (!structure) mockError('Fee structure not found', 404);
    return { data: { feeStructure: hydrateFeeStructure(db, structure) } };
  },
  async create(payload) {
    await delay();
    if (!payload.universityId) mockError('University is required');
    if (!payload.courseId) mockError('Course is required');
    if (!payload.feeType) mockError('Fee type is required');
    validateFeeItems(payload.feeType, payload.items);
    const db = loadDb();
    const course = assertCourseUniversity(db, payload.universityId, payload.courseId);
    const status = payload.status || 'ACTIVE';
    const structure = {
      id: nextId(db.feeStructures),
      universityId: course.universityId,
      courseId: course.id,
      feeType: payload.feeType,
      status,
      totalFee: calcStructureTotal(payload.items),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    if (status === 'ACTIVE') deactivateOtherFeeStructures(db, course.id, structure.id);
    db.feeStructures.unshift(structure);
    payload.items.forEach((item, index) => {
      db.feeItems.push({
        id: nextId(db.feeItems),
        feeStructureId: structure.id,
        periodNumber: Number(item.periodNumber) || index + 1,
        periodType: payload.feeType === 'YEAR' ? 'year' : 'semester',
        tuitionFee: Number(item.tuitionFee) || 0,
        admissionFee: Number(item.admissionFee) || 0,
        examFee: Number(item.examFee) || 0,
        registrationFee: Number(item.registrationFee) || 0,
        otherFee: Number(item.otherFee) || 0,
        totalFee: calcItemTotal(item),
        feeNature: item.feeNature || 'RECURRING',
        isRefundable: Boolean(item.isRefundable),
      });
    });
    saveDb(db);
    return { data: { feeStructure: hydrateFeeStructure(db, structure) } };
  },
  async update(id, payload) {
    await delay();
    const db = loadDb();
    const idx = db.feeStructures.findIndex((f) => f.id === Number(id));
    if (idx === -1) mockError('Fee structure not found', 404);
    const universityId = payload.universityId || db.feeStructures[idx].universityId;
    const courseId = payload.courseId || db.feeStructures[idx].courseId;
    const feeType = payload.feeType || db.feeStructures[idx].feeType;
    if (payload.items) validateFeeItems(feeType, payload.items);
    const course = assertCourseUniversity(db, universityId, courseId);
    const status = payload.status || db.feeStructures[idx].status;
    db.feeStructures[idx] = {
      ...db.feeStructures[idx],
      universityId: course.universityId,
      courseId: course.id,
      feeType,
      status,
      totalFee: payload.items ? calcStructureTotal(payload.items) : db.feeStructures[idx].totalFee,
      updatedAt: nowIso(),
    };
    if (status === 'ACTIVE') deactivateOtherFeeStructures(db, course.id, db.feeStructures[idx].id);
    if (payload.items) {
      db.feeItems = db.feeItems.filter((i) => i.feeStructureId !== db.feeStructures[idx].id);
      payload.items.forEach((item, index) => {
        db.feeItems.push({
          id: nextId(db.feeItems),
          feeStructureId: db.feeStructures[idx].id,
          periodNumber: Number(item.periodNumber) || index + 1,
          periodType: feeType === 'YEAR' ? 'year' : 'semester',
          tuitionFee: Number(item.tuitionFee) || 0,
          admissionFee: Number(item.admissionFee) || 0,
          examFee: Number(item.examFee) || 0,
          registrationFee: Number(item.registrationFee) || 0,
          otherFee: Number(item.otherFee) || 0,
          totalFee: calcItemTotal(item),
          feeNature: item.feeNature || 'RECURRING',
          isRefundable: Boolean(item.isRefundable),
        });
      });
    }
    saveDb(db);
    return { data: { feeStructure: hydrateFeeStructure(db, db.feeStructures[idx]) } };
  },
  async delete(id) {
    await delay();
    const db = loadDb();
    const structure = db.feeStructures.find((f) => f.id === Number(id));
    if (!structure) mockError('Fee structure not found', 404);
    db.feeStructures = db.feeStructures.filter((f) => f.id !== structure.id);
    db.feeItems = db.feeItems.filter((i) => i.feeStructureId !== structure.id);
    saveDb(db);
    return { data: { id: structure.id } };
  },
};

const mockDashboardService = {
  async get() {
    await delay();
    const db = loadDb();
    const activeCourses = db.courses.filter((c) => c.status === 'ACTIVE');
    const coursesByUniversity = db.universities.map((u) => ({
      name: u.code,
      fullName: u.name,
      count: db.courses.filter((c) => c.universityId === u.id).length,
    })).filter((d) => d.count > 0);

    const coursesByLevel = ['CERTIFICATE', 'DIPLOMA', 'UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORATE'].map((level) => ({
      name: level.replace(/_/g, ' '),
      count: db.courses.filter((c) => c.level === level).length,
    })).filter((d) => d.count > 0);

    const universitiesByType = ['GOVERNMENT', 'PRIVATE', 'DEEMED', 'CENTRAL', 'STATE', 'OTHER'].map((type) => ({
      name: type.replace(/_/g, ' '),
      value: db.universities.filter((u) => u.type === type).length,
    })).filter((d) => d.value > 0);

    const feeDistribution = db.universities.map((u) => {
      const total = db.feeStructures
        .filter((f) => f.universityId === u.id && f.status === 'ACTIVE')
        .reduce((sum, f) => sum + Number(f.totalFee || 0), 0);
      return { name: u.code, fullName: u.name, total };
    }).filter((d) => d.total > 0);

    return {
      data: {
        dashboard: {
          stats: {
            totalUniversities: db.universities.length,
            totalCourses: db.courses.length,
            totalSpecializations: db.specializations.length,
            totalActiveCourses: activeCourses.length,
            totalFeeStructures: db.feeStructures.length,
            activeFeeStructures: db.feeStructures.filter((f) => f.status === 'ACTIVE').length,
          },
          coursesByUniversity,
          coursesByLevel,
          universitiesByType,
          feeDistribution,
        },
      },
    };
  },
};

const mapUniversity = (row = {}) => ({
  id: row.id,
  name: row.name,
  code: row.code || row.short_name || '',
  type: row.type || '',
  location: row.location || '',
  website: row.website || '',
  description: row.description || '',
  status: row.status || 'ACTIVE',
  createdAt: row.createdAt || row.created_at,
  updatedAt: row.updatedAt || row.updated_at,
});

const mapCourse = (row = {}) => ({
  id: row.id,
  universityId: row.universityId || row.university_id,
  universityName: row.universityName || row.university_name || '',
  name: row.name,
  code: row.code || row.degree || '',
  degree: row.degree || row.level || '',
  level: row.level || row.degree || '',
  duration: row.duration || '',
  durationUnit: row.durationUnit || 'YEARS',
  description: row.description || '',
  eligibility: row.eligibility || '',
  status: row.status || 'ACTIVE',
  createdAt: row.createdAt || row.created_at,
  updatedAt: row.updatedAt || row.updated_at,
});

const unwrapList = (payload, key) => {
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const liveUniversityService = {
  getAll: async (params) => {
    const res = await api.get('/academic/universities', { params });
    const universities = unwrapList(res.data, 'universities').map(mapUniversity);
    return {
      data: {
        universities,
        pagination: res.data.pagination || {
          total: universities.length,
          page: 1,
          limit: universities.length,
          pages: 1,
        },
      },
    };
  },
  getOptions: async () => {
    const res = await api.get('/academic/universities', { params: { limit: 500 } });
    const universities = unwrapList(res.data, 'universities').map(mapUniversity);
    return { data: { universities } };
  },
  getById: async (id) => {
    const res = await api.get('/academic/universities', { params: { limit: 500 } });
    const universities = unwrapList(res.data, 'universities').map(mapUniversity);
    const university = universities.find((u) => String(u.id) === String(id));
    if (!university) {
      const err = new Error('University not found');
      err.response = { data: { message: 'University not found' }, status: 404 };
      throw err;
    }
    return { data: { university } };
  },
  create: async (data) => {
    const res = await api.post('/academic/universities', {
      name: data.name,
      short_name: data.code || data.short_name,
      description: data.description,
      website: data.website,
      location: data.location,
    });
    const university = mapUniversity(res.data.university || res.data.data);
    return { data: { university } };
  },
  update: (id, data) => api.put(`/academic/universities/${id}`, data),
  delete: (id) => api.delete(`/academic/universities/${id}`),
};

const liveCourseService = {
  getAll: async (params) => {
    const res = await api.get('/academic/courses', {
      params: {
        ...params,
        universityId: params.universityId || params.university_id,
      },
    });
    const courses = unwrapList(res.data, 'courses').map(mapCourse);
    return {
      data: {
        courses,
        pagination: res.data.pagination || {
          total: courses.length,
          page: 1,
          limit: courses.length,
          pages: 1,
        },
      },
    };
  },
  getOptions: async (params) => {
    const res = await api.get('/academic/courses', { params: { ...params, limit: 500 } });
    const courses = unwrapList(res.data, 'courses').map(mapCourse);
    return { data: { courses } };
  },
  getById: async (id) => {
    const res = await api.get('/academic/courses', { params: { limit: 500 } });
    const courses = unwrapList(res.data, 'courses').map(mapCourse);
    const course = courses.find((c) => String(c.id) === String(id));
    if (!course) {
      const err = new Error('Course not found');
      err.response = { data: { message: 'Course not found' }, status: 404 };
      throw err;
    }
    return { data: { course } };
  },
  create: async (data) => {
    const res = await api.post('/academic/courses', {
      university_id: data.universityId || data.university_id,
      name: data.name,
      degree: data.degree || data.level || data.code,
      duration: data.durationUnit ? `${data.duration} ${data.durationUnit}` : data.duration,
      description: data.description,
    });
    const course = mapCourse(res.data.course || res.data.data);
    return { data: { course } };
  },
  update: (id, data) => api.put(`/academic/courses/${id}`, data),
  delete: (id) => api.delete(`/academic/courses/${id}`),
};

const liveSpecializationService = {
  getAll: (params) => api.get('/education/specializations', { params }),
  getById: (id) => api.get(`/education/specializations/${id}`),
  create: (data) => api.post('/education/specializations', data),
  update: (id, data) => api.put(`/education/specializations/${id}`, data),
  delete: (id) => api.delete(`/education/specializations/${id}`),
};

const liveFeeService = {
  getAll: (params) => api.get('/education/fees', { params }),
  getById: (id) => api.get(`/education/fees/${id}`),
  create: (data) => api.post('/education/fees', data),
  update: (id, data) => api.put(`/education/fees/${id}`, data),
  delete: (id) => api.delete(`/education/fees/${id}`),
};

const liveDashboardService = {
  get: () => api.get('/education/dashboard'),
};

export const universityService = liveUniversityService;
export const courseService = liveCourseService;
export const specializationService = USE_MOCK ? mockSpecializationService : liveSpecializationService;
export const feeStructureService = USE_MOCK ? mockFeeService : liveFeeService;
export const educationDashboardService = USE_MOCK ? mockDashboardService : liveDashboardService;
