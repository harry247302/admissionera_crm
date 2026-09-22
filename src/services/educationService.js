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
    mockError('Add at least one fee period before saving the fee structure');
  }
  if (feeType === 'ONE_TIME') {
    const total = calcItemTotal(items[0]);
    if (total <= 0) mockError('One-time fee must be greater than zero');
    return;
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
    if (!payload.name?.trim()) mockError('Specialization name is required');
    const db = loadDb();
    const slug = String(payload.slug || payload.name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-');
    const spec = {
      id: nextId(db.specializations),
      uuid: `mock-${nextId(db.specializations)}`,
      name: payload.name.trim(),
      slug,
      code: payload.code?.trim().toUpperCase() || '',
      shortName: payload.shortName?.trim() || '',
      description: payload.description?.trim() || '',
      overview: payload.overview?.trim() || '',
      eligibility: payload.eligibility?.trim() || '',
      admissionRequirements: payload.admissionRequirements?.trim() || '',
      careerOpportunities: payload.careerOpportunities?.trim() || '',
      duration: payload.duration ?? '',
      durationUnit: payload.durationUnit || '',
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
    const idx = db.specializations.findIndex(
      (s) => String(s.id) === String(id) || String(s.uuid) === String(id)
    );
    if (idx === -1) mockError('Specialization not found', 404);
    db.specializations[idx] = {
      ...db.specializations[idx],
      ...payload,
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
  async getCatalog(params = {}) {
    const res = await mockSpecializationService.getAll(params);
    return {
      data: {
        specializations: (res.data.specializations || []).map((item) => ({
          uuid: String(item.id),
          name: item.name,
          code: item.code,
          slug: item.code?.toLowerCase(),
        })),
      },
    };
  },
  async getUniversitySpecializations(_universityUuid) {
    return { data: { specializations: [] } };
  },
  async assignToUniversity() {
    await delay();
    return { data: { success: true } };
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
      const periodType = payload.feeType === 'ONE_TIME'
        ? 'one_time'
        : payload.feeType === 'YEAR'
          ? 'year'
          : 'semester';
      db.feeItems.push({
        id: nextId(db.feeItems),
        feeStructureId: structure.id,
        periodNumber: Number(item.periodNumber) || index + 1,
        periodType,
        tuitionFee: Number(item.tuitionFee) || 0,
        admissionFee: Number(item.admissionFee) || 0,
        examFee: Number(item.examFee) || 0,
        registrationFee: Number(item.registrationFee) || 0,
        otherFee: Number(item.otherFee) || 0,
        totalFee: calcItemTotal(item),
        feeNature: item.feeNature || (payload.feeType === 'ONE_TIME' ? 'ONE_TIME' : 'RECURRING'),
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

const mapUniversity = (row = {}) => {
  const fromTextArray = (value) => {
    if (Array.isArray(value)) return value[0] || value.join('\n') || '';
    return value || '';
  };

  return {
    id: row.uuid || row.id,
    uuid: row.uuid || row.id,
    name: row.name,
    code: row.code || row.short_name || '',
    short_name: row.short_name || row.code || '',
    type: row.type || '',
    location: row.location || '',
    website: row.website || '',
    description: row.description || '',
    logo: row.logo || '',
    banner: row.banner || '',
    ratings: row.ratings ?? '',
    world_rank: row.world_rank ?? row.worldRank ?? '',
    grade: row.grade || '',
    features: fromTextArray(row.features),
    admission_process: fromTextArray(row.admission_process || row.admissionProcess),
    career: fromTextArray(row.career),
    status: row.status || (row.is_active === false ? 'INACTIVE' : 'ACTIVE'),
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at,
  };
};

const buildUniversityFormData = (data = {}) => {
  const formData = new FormData();
  formData.append('name', data.name || '');
  formData.append('short_name', data.code || data.short_name || '');
  if (data.type) formData.append('type', data.type);
  if (data.description != null) formData.append('description', data.description);
  if (data.website != null) formData.append('website', data.website);
  if (data.location != null) formData.append('location', data.location);
  if (data.ratings !== '' && data.ratings != null) formData.append('ratings', String(data.ratings));
  if (data.world_rank !== '' && data.world_rank != null) {
    formData.append('world_rank', String(data.world_rank));
  }
  if (data.grade != null) formData.append('grade', data.grade);
  if (data.features != null) formData.append('features', data.features);
  if (data.admission_process != null) formData.append('admission_process', data.admission_process);
  if (data.career != null) formData.append('career', data.career);
  if (data.status) formData.append('status', data.status);

  if (data.logo instanceof File) {
    formData.append('logo', data.logo);
  } else if (data.existingLogo) {
    formData.append('logo', data.existingLogo);
  }

  if (data.banner instanceof File) {
    formData.append('banner', data.banner);
  } else if (data.existingBanner) {
    formData.append('banner', data.existingBanner);
  }

  return formData;
};

const mapCourseFee = (fee = {}) => ({
  uuid: fee.uuid,
  feeStructureType: fee.feeStructureType || fee.fee_structure_type || '',
  totalPeriods: fee.totalPeriods ?? fee.total_periods ?? null,
  periodNumber: fee.periodNumber ?? fee.period_number ?? null,
  periodLabel: fee.periodLabel || fee.period_label || '',
  amount: Number(fee.amount ?? 0),
  currency: fee.currency || 'INR',
});

const mapCourseSpecialization = (spec = {}) => {
  const fees = (spec.fees || []).map(mapCourseFee);
  return {
    uuid: spec.uuid,
    name: spec.name || '',
    code: spec.code || '',
    description: spec.description || '',
    fees,
    feeCurrency: fees[0]?.currency || 'INR',
    feeStructureType: fees[0]?.feeStructureType || '',
    totalFee: fees.reduce((sum, f) => sum + f.amount, 0),
  };
};

const mapCourse = (row = {}) => {
  const specializations = (row.specializations || []).map(mapCourseSpecialization);
  const withFees = specializations.filter((s) => s.fees.length);

  return {
    id: row.id || row.uuid,
    uuid: row.uuid,
    universityId: row.universityId || row.university_id,
    universityUuid: row.universityUuid || row.university_uuid,
    universityName: row.universityName || row.university_name || '',
    universityCode: row.universityCode || row.university_code || '',
    name: row.name,
    code: row.code || row.degree || '',
    degree: row.degree || row.level || '',
    level: row.level || row.degree || '',
    description: row.description || '',
    overview: row.overview || '',
    eligibility: row.eligibility || '',
    curriculum: row.curriculum || '',
    careerOpportunities: row.careerOpportunities || row.career_opportunities || '',
    currency: row.currency || 'USD',
    department: row.department || '',
    faculty: row.faculty || '',
    studyMode: row.studyMode || row.study_mode || '',
    attendanceMode: row.attendanceMode || row.attendance_mode || '',
    language: row.language || '',
    status: row.status || (row.is_active === false ? 'INACTIVE' : 'ACTIVE'),
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at,
    specializations,
    specializationCount: specializations.length,
    totalFee: specializations.reduce((sum, s) => sum + s.totalFee, 0),
    feeCurrency: withFees[0]?.feeCurrency || row.currency || 'INR',
    feeStructureType: withFees[0]?.feeStructureType || '',
  };
};

const toCoursePayload = (data) => ({
  name: data.name,
  code: data.code,
  degree: data.degree || data.level || data.code,
  level: data.level,
  currency: data.currency || 'USD',
  department: data.department,
  study_mode: data.studyMode || data.study_mode,
  attendance_mode: data.attendanceMode || data.attendance_mode,
  language: data.language,
  status: data.status,
  is_active: data.status ? data.status === 'ACTIVE' : undefined,
});

const mapSpecialization = (row = {}) => ({
  id: row.id || row.uuid,
  uuid: row.uuid,
  name: row.name,
  slug: row.slug || '',
  code: row.code || '',
  shortName: row.shortName || row.short_name || '',
  description: row.description || '',
  overview: row.overview || '',
  eligibility: row.eligibility || '',
  admissionRequirements: row.admissionRequirements || row.admission_requirements || '',
  careerOpportunities: row.careerOpportunities || row.career_opportunities || '',
  duration: row.duration ?? '',
  durationUnit: row.durationUnit || row.duration_unit || '',
  status: row.is_active === false ? 'INACTIVE' : (row.status || 'ACTIVE'),
  createdAt: row.createdAt || row.created_at,
  updatedAt: row.updatedAt || row.updated_at,
});

const toSpecializationPayload = (data) => ({
  name: data.name,
  slug: data.slug,
  code: data.code || null,
  short_name: data.shortName || data.short_name || null,
  description: data.description || null,
  overview: data.overview || null,
  eligibility: data.eligibility || null,
  admission_requirements: data.admissionRequirements || data.admission_requirements || null,
  career_opportunities: data.careerOpportunities || data.career_opportunities || null,
  duration: data.duration === '' || data.duration == null ? null : Number(data.duration),
  duration_unit: data.durationUnit || data.duration_unit || null,
  status: data.status,
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
    const university = universities.find(
      (u) => String(u.id) === String(id) || String(u.uuid) === String(id)
    );
    if (!university) {
      const err = new Error('University not found');
      err.response = { data: { message: 'University not found' }, status: 404 };
      throw err;
    }

    const universityKey = university.uuid || university.id;

    const [coursesRes, approvalsRes, faqsRes] = await Promise.allSettled([
      api.get('/academic/courses', { params: { universityId: universityKey, limit: 200 } }),
      api.get(`/academic/university-approvals/${universityKey}`),
      api.get(`/academic/university-faqs/${universityKey}`),
    ]);

    const courses =
      coursesRes.status === 'fulfilled'
        ? unwrapList(coursesRes.value.data, 'courses').map(mapCourse)
        : [];
    const approvals =
      approvalsRes.status === 'fulfilled'
        ? (approvalsRes.value.data?.data || [])
        : [];
    const faqs =
      faqsRes.status === 'fulfilled'
        ? (faqsRes.value.data?.data || [])
        : [];

    return {
      data: {
        university: {
          ...university,
          courses,
          courseCount: courses.length,
          approvals,
          faqs,
        },
      },
    };
  },
  create: async (data) => {
    const formData = buildUniversityFormData(data);
    const res = await api.post('/academic/universities', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const university = mapUniversity(res.data.university || res.data.data);
    return { data: { university } };
  },
  update: async (id, data) => {
    const formData = buildUniversityFormData(data);
    const res = await api.put(`/academic/universities/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const university = mapUniversity(res.data.university || res.data.data);
    return { data: { university } };
  },
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
    const res = await api.post('/academic/courses', toCoursePayload(data));
    const course = mapCourse(res.data.course || res.data.data);
    const courseId = course?.uuid || course?.id;

    if (courseId) {
      if (Array.isArray(data.contentTables) && data.contentTables.length) {
        await saveCourseContentTables(courseId, data.contentTables);
      }
      if (Array.isArray(data.contentParagraphs) && data.contentParagraphs.length) {
        await saveCourseContentParagraphs(courseId, data.contentParagraphs);
      }
    }

    return { data: { course } };
  },
  update: async (id, data) => {
    const res = await api.put(`/academic/courses/${id}`, toCoursePayload(data));
    const course = mapCourse(res.data.course || res.data.data);
    const courseId = course?.uuid || course?.id || id;

    if (courseId) {
      if (Array.isArray(data.contentTables) && data.contentTables.length) {
        await saveCourseContentTables(courseId, data.contentTables);
      }
      if (Array.isArray(data.contentParagraphs) && data.contentParagraphs.length) {
        await saveCourseContentParagraphs(courseId, data.contentParagraphs);
      }
    }

    return { data: { course } };
  },
  delete: (id) => api.delete(`/academic/courses/${id}`),
};

const saveCourseContentTables = async (courseId, tables = []) => {
  await api.delete(`/academic/course-tables/by-course/${courseId}`);

  for (const [tableIndex, table] of tables.entries()) {
    const hasContent = table.rows?.some((row) =>
      Object.values(row.cells || {}).some((cell) => String(cell || '').trim())
    );
    if (!hasContent && !String(table.title || '').trim()) continue;

    const createdTable = await api.post('/academic/course-tables', {
      course_id: courseId,
      title: table.title || `Table ${tableIndex + 1}`,
      sort_order: Number.isFinite(Number(table.sortOrder))
        ? Number(table.sortOrder)
        : tableIndex,
    });
    const tableId = createdTable.data?.data?.id;
    if (!tableId) continue;

    for (const [rowIndex, row] of (table.rows || []).entries()) {
      const content = {};
      (table.columns || []).forEach((col) => {
        content[col] = row.cells?.[col] ?? '';
      });
      const label =
        content[table.columns?.[0]]?.trim()
        || Object.values(content).find((v) => String(v).trim())
        || `Row ${rowIndex + 1}`;

      await api.post('/academic/course-table-rows', {
        table_id: tableId,
        label: String(label),
        content,
        sort_order: Number.isFinite(Number(row.sortOrder))
          ? Number(row.sortOrder)
          : rowIndex,
      });
    }
  }
};

const saveCourseContentParagraphs = async (courseId, paragraphs = []) => {
  for (const [index, paragraph] of paragraphs.entries()) {
    if (paragraph.persisted) continue;

    const content = String(paragraph.content || '').trim();
    if (!content) continue;

    await api.post('/academic/course-table-paragraphs', {
      course_id: courseId,
      title: paragraph.title || `Paragraph ${index + 1}`,
      content,
      sort_order: Number.isFinite(Number(paragraph.sortOrder))
        ? Number(paragraph.sortOrder)
        : index,
    });
  }
};

export const courseContentTableService = {
  getByCourse: async (courseId) => {
    const res = await api.get(`/academic/course-tables/${courseId}`);
    return { data: res.data?.data || [] };
  },
  getParagraphsByCourse: async (courseId) => {
    const res = await api.get(`/academic/course-table-paragraphs/${courseId}`);
    return { data: res.data?.data || [] };
  },
  createTable: (data) => api.post('/academic/course-tables', data),
  createRow: (data) => api.post('/academic/course-table-rows', data),
  createParagraph: (data) => api.post('/academic/course-table-paragraphs', data),
  deleteByCourse: (courseId) => api.delete(`/academic/course-tables/by-course/${courseId}`),
  saveMany: saveCourseContentTables,
  saveParagraphs: saveCourseContentParagraphs,
};

const liveSpecializationService = {
  getAll: async (params = {}) => {
    const res = await api.get('/academic/specializations', {
      params: { search: params.search || undefined },
    });
    let specializations = unwrapList(res.data, 'specializations').map(mapSpecialization);
    if (params.status) {
      specializations = specializations.filter((item) => item.status === params.status);
    }
    const { items, pagination } = paginate(specializations, params);
    return { data: { specializations: items, pagination } };
  },
  getById: async (id) => {
    const res = await api.get('/academic/specializations');
    const specializations = unwrapList(res.data, 'specializations').map(mapSpecialization);
    const specialization = specializations.find(
      (item) => String(item.uuid) === String(id) || String(item.id) === String(id)
    );
    if (!specialization) {
      const err = new Error('Specialization not found');
      err.response = { data: { message: 'Specialization not found' }, status: 404 };
      throw err;
    }
    return { data: { specialization } };
  },
  create: async (data) => {
    const res = await api.post('/academic/specializations', toSpecializationPayload(data));
    const specialization = mapSpecialization(res.data.specialization || res.data.data);
    const specializationId = specialization?.uuid || specialization?.id;

    if (specializationId) {
      if (Array.isArray(data.contentTables) && data.contentTables.length) {
        await saveSpecializationContentTables(specializationId, data.contentTables);
      }
      if (Array.isArray(data.contentParagraphs) && data.contentParagraphs.length) {
        await saveSpecializationContentParagraphs(specializationId, data.contentParagraphs);
      }
    }

    return { data: { specialization } };
  },
  update: async (id, data) => {
    const res = await api.put(`/academic/specializations/${id}`, toSpecializationPayload(data));
    const specialization = mapSpecialization(res.data.specialization || res.data.data);
    const specializationId = specialization?.uuid || specialization?.id || id;

    if (specializationId) {
      if (Array.isArray(data.contentTables) && data.contentTables.length) {
        await saveSpecializationContentTables(specializationId, data.contentTables);
      }
      if (Array.isArray(data.contentParagraphs) && data.contentParagraphs.length) {
        await saveSpecializationContentParagraphs(specializationId, data.contentParagraphs);
      }
    }

    return { data: { specialization } };
  },
  delete: (id) => api.delete(`/academic/specializations/${id}`),
  getCatalog: async (params) => {
    const res = await api.get('/academic/specializations', { params });
    const specializations = unwrapList(res.data, 'specializations').map(mapSpecialization);
    return { data: { specializations } };
  },
  getUniversitySpecializations: async (universityUuid) => {
    const res = await api.get('/academic/university-specializations', {
      params: { university_uuid: universityUuid },
    });
    const specializations = unwrapList(res.data, 'specializations');
    return { data: { specializations } };
  },
  assignToUniversity: (data) =>
    api.post('/academic/university-specializations', data),
};

const saveSpecializationContentTables = async (specializationId, tables = []) => {
  await api.delete(`/academic/specialization-tables/by-specialization/${specializationId}`);

  for (const [tableIndex, table] of tables.entries()) {
    const hasContent = table.rows?.some((row) =>
      Object.values(row.cells || {}).some((cell) => String(cell || '').trim())
    );
    if (!hasContent && !String(table.title || '').trim()) continue;

    const createdTable = await api.post('/academic/specialization-tables', {
      specialization_uuid: specializationId,
      title: table.title || `Table ${tableIndex + 1}`,
      sort_order: Number.isFinite(Number(table.sortOrder))
        ? Number(table.sortOrder)
        : tableIndex,
    });
    const tableId = createdTable.data?.data?.id;
    if (!tableId) continue;

    for (const [rowIndex, row] of (table.rows || []).entries()) {
      const content = {};
      (table.columns || []).forEach((col) => {
        content[col] = row.cells?.[col] ?? '';
      });
      const label =
        content[table.columns?.[0]]?.trim()
        || Object.values(content).find((v) => String(v).trim())
        || `Row ${rowIndex + 1}`;

      await api.post('/academic/specialization-table-rows', {
        table_id: tableId,
        label: String(label),
        content,
        sort_order: Number.isFinite(Number(row.sortOrder))
          ? Number(row.sortOrder)
          : rowIndex,
      });
    }
  }
};

const saveSpecializationContentParagraphs = async (specializationId, paragraphs = []) => {
  await api.delete(`/academic/specialization-table-paragraphs/by-specialization/${specializationId}`);

  for (const [index, paragraph] of paragraphs.entries()) {
    const content = String(paragraph.content || '').trim();
    if (!content) continue;

    await api.post('/academic/specialization-table-paragraphs', {
      specialization_uuid: specializationId,
      title: paragraph.title || `Paragraph ${index + 1}`,
      content,
      sort_order: Number.isFinite(Number(paragraph.sortOrder))
        ? Number(paragraph.sortOrder)
        : index,
    });
  }
};

export const specializationContentTableService = {
  getBySpecialization: async (specializationId) => {
    const res = await api.get(`/academic/specialization-tables/${specializationId}`);
    return { data: res.data?.data || [] };
  },
  getParagraphsBySpecialization: async (specializationId) => {
    const res = await api.get(`/academic/specialization-table-paragraphs/${specializationId}`);
    return { data: res.data?.data || [] };
  },
  createTable: (data) => api.post('/academic/specialization-tables', data),
  createRow: (data) => api.post('/academic/specialization-table-rows', data),
  createParagraph: (data) => api.post('/academic/specialization-table-paragraphs', data),
  deleteBySpecialization: (specializationId) =>
    api.delete(`/academic/specialization-tables/by-specialization/${specializationId}`),
  saveMany: saveSpecializationContentTables,
  saveParagraphs: saveSpecializationContentParagraphs,
};

/** Always uses live academic APIs (not mock) */
export const academicSpecializationService = {
  getCatalog: liveSpecializationService.getCatalog,
  getUniversitySpecializations: liveSpecializationService.getUniversitySpecializations,
  assignToUniversity: liveSpecializationService.assignToUniversity,
  create: liveSpecializationService.create,
};

export const academicCourseService = {
  getUniversityCourses: async (params) => {
    const res = await api.get('/academic/university-courses', { params });
    return { data: res.data?.data || [] };
  },
  linkUniversityCourse: (data) => api.post('/academic/university-courses', data),
  createCourseSpecializations: (data) => api.post('/academic/courses-specilizations', data),
};

const FEE_TYPE_TO_STRUCTURE = {
  YEAR: 'yearly',
  SEMESTER: 'semester',
  ONE_TIME: 'one_time',
};

export const toCourseFeePayload = ({
  universityId,
  courseId,
  specializationId,
  sessionId,
  feeType,
  totalPeriods,
  periodNumber,
  periodLabel,
  amount,
  currency = 'INR',
  perSemesterFee,
  perYearFee,
  totalSem,
  totalYears,
}) => ({
  university_id: universityId,
  course_id: courseId,
  specialization_id: specializationId,
  session_id: sessionId || null,
  fee_structure_type: FEE_TYPE_TO_STRUCTURE[feeType] || String(feeType || '').toLowerCase(),
  total_periods: Number(totalPeriods),
  period_number: Number(periodNumber),
  period_label: periodLabel,
  amount: Number(amount),
  currency,
  per_semester_fee: perSemesterFee === '' || perSemesterFee == null ? null : Number(perSemesterFee),
  per_year_fee: perYearFee === '' || perYearFee == null ? null : Number(perYearFee),
  total_sem: totalSem === '' || totalSem == null ? null : Number(totalSem),
  total_years: totalYears === '' || totalYears == null ? null : Number(totalYears),
});

export const STRUCTURE_TO_FEE_TYPE = {
  yearly: 'YEAR',
  semester: 'SEMESTER',
  one_time: 'ONE_TIME',
};

const FEE_TYPE_PERIOD = {
  YEAR: 'year',
  SEMESTER: 'semester',
  ONE_TIME: 'one_time',
};

const mapFeeRowToItem = (fee = {}) => {
  const feeType = STRUCTURE_TO_FEE_TYPE[fee.fee_structure_type] || 'SEMESTER';
  const amount = Number(fee.amount || 0);
  return {
    id: fee.id,
    uuid: fee.uuid,
    savedUuid: fee.uuid,
    periodNumber: Number(fee.period_number || 0),
    periodLabel: fee.period_label || '',
    periodType: FEE_TYPE_PERIOD[feeType] || 'semester',
    tuitionFee: amount,
    admissionFee: 0,
    examFee: 0,
    registrationFee: 0,
    otherFee: 0,
    totalFee: amount,
    feeNature: feeType === 'ONE_TIME' ? 'ONE_TIME' : 'RECURRING',
    isRefundable: false,
    currency: fee.currency || 'INR',
  };
};

const structureKey = (fee = {}) => [
  fee.university_id || '',
  fee.course_id || '',
  fee.specialization_id || '',
  fee.session_id || '',
  fee.fee_structure_type || '',
].join('::');

/** Group flat course_fees period rows into fee-structure cards for the UI. */
export const groupCourseFeesIntoStructures = (rows = []) => {
  const groups = new Map();

  rows.forEach((fee) => {
    const key = structureKey(fee);
    if (!groups.has(key)) {
      const feeType = STRUCTURE_TO_FEE_TYPE[fee.fee_structure_type] || 'SEMESTER';
      groups.set(key, {
        id: key,
        key,
        universityId: fee.university_numeric_id || fee.university_id,
        universityUuid: fee.university_id,
        universityName: fee.university_name || '',
        universityCode: '',
        courseId: fee.course_id,
        courseName: fee.course_name || '',
        courseCode: '',
        specializationId: fee.specialization_id,
        specializationName: fee.specialization_name || '',
        sessionId: fee.session_id || '',
        sessionName: fee.session_name || '',
        perSemesterFee: fee.per_seme_fees ?? fee.per_semester_fee ?? '',
        perYearFee: fee.per_year_fees ?? fee.per_year_fee ?? '',
        totalSem: fee.total_sem ?? '',
        totalYears: fee.total_years ?? '',
        feeType,
        feeStructureType: fee.fee_structure_type,
        totalPeriods: Number(fee.total_periods || 0),
        currency: fee.currency || 'INR',
        status: 'ACTIVE',
        items: [],
      });
    }
    groups.get(key).items.push(mapFeeRowToItem(fee));
  });

  return Array.from(groups.values()).map((structure) => {
    const items = structure.items.sort((a, b) => a.periodNumber - b.periodNumber);
    return {
      ...structure,
      items,
      totalFee: items.reduce((sum, item) => sum + Number(item.totalFee || 0), 0),
    };
  });
};

const filterFeeStructures = (structures, params = {}) => {
  let list = [...structures];
  const search = String(params.search || '').trim().toLowerCase();
  if (search) {
    list = list.filter((s) =>
      [s.courseName, s.universityName, s.specializationName]
        .join(' ')
        .toLowerCase()
        .includes(search));
  }
  if (params.universityId) {
    list = list.filter((s) =>
      String(s.universityId) === String(params.universityId)
      || String(s.universityUuid) === String(params.universityId));
  }
  if (params.courseId) {
    list = list.filter((s) => String(s.courseId) === String(params.courseId));
  }
  if (params.feeType) {
    list = list.filter((s) => s.feeType === params.feeType);
  }
  if (params.status) {
    list = list.filter((s) => s.status === params.status);
  }
  return list;
};

/** PUT /academic/courses-fees/:uuid is a partial update, so only send
 *  the keys that were actually provided. */
const toCourseFeeUpdatePayload = (data = {}) => {
  const payload = {};
  if (data.universityId != null) payload.university_id = data.universityId;
  if (data.courseId != null) payload.course_id = data.courseId;
  if (data.specializationId != null) payload.specialization_id = data.specializationId;
  if (data.sessionId !== undefined) payload.session_id = data.sessionId || null;
  if (data.feeType != null) {
    payload.fee_structure_type =
      FEE_TYPE_TO_STRUCTURE[data.feeType] || String(data.feeType).toLowerCase();
  }
  if (data.totalPeriods != null) payload.total_periods = Number(data.totalPeriods);
  if (data.periodNumber != null) payload.period_number = Number(data.periodNumber);
  if (data.periodLabel != null) payload.period_label = data.periodLabel;
  if (data.amount != null) payload.amount = Number(data.amount);
  if (data.currency != null) payload.currency = data.currency;
  if (data.perSemesterFee !== undefined) {
    payload.per_semester_fee =
      data.perSemesterFee === '' || data.perSemesterFee == null ? null : Number(data.perSemesterFee);
  }
  if (data.perYearFee !== undefined) {
    payload.per_year_fee =
      data.perYearFee === '' || data.perYearFee == null ? null : Number(data.perYearFee);
  }
  if (data.totalSem !== undefined) {
    payload.total_sem = data.totalSem === '' || data.totalSem == null ? null : Number(data.totalSem);
  }
  if (data.totalYears !== undefined) {
    payload.total_years =
      data.totalYears === '' || data.totalYears == null ? null : Number(data.totalYears);
  }
  return payload;
};

/** POST /academic/courses-fees creates one fee row per period, so a full
 *  structure is sent as a sequence of requests keyed to one specialization. */
export const academicCourseFeeService = {
  create: async (data) => {
    const res = await api.post('/academic/courses-fees', toCourseFeePayload(data));
    return res.data?.data || res.data;
  },
  createMany: async (rows) => {
    const created = [];
    for (const row of rows) {
      created.push(await academicCourseFeeService.create(row));
    }
    return created;
  },
  getAll: async (params = {}) => {
    const res = await api.get('/academic/course-fees', {
      params: {
        page: params.page || 1,
        limit: params.limit || 500,
        university_id: params.universityId || params.university_id,
        course_id: params.courseId || params.course_id,
        specialization_id: params.specializationId || params.specialization_id,
      },
    });
    return res.data?.fees || res.data?.data || [];
  },
  getBySpecialization: async (specializationId) => {
    const res = await api.get('/academic/course-fees', {
      params: { specialization_id: specializationId, limit: 500 },
    });
    const fees = (res.data?.fees || res.data?.data || []).map((fee) => ({
      uuid: fee.uuid,
      feeStructureType: fee.fee_structure_type,
      totalPeriods: fee.total_periods,
      periodNumber: fee.period_number,
      periodLabel: fee.period_label,
      amount: Number(fee.amount || 0),
      currency: fee.currency || 'INR',
    }));
    return { fees, totalFee: fees.reduce((sum, fee) => sum + fee.amount, 0) };
  },
  update: async (uuid, data) => {
    const res = await api.put(`/academic/courses-fees/${uuid}`, toCourseFeeUpdatePayload(data));
    return res.data?.data || res.data;
  },
  remove: async (uuid) => {
    const res = await api.delete(`/academic/courses-fees/${uuid}`);
    return res.data?.data || res.data;
  },
};

const liveFeeService = {
  getAll: async (params = {}) => {
    const rows = await academicCourseFeeService.getAll({ ...params, limit: 500 });
    let structures = groupCourseFeesIntoStructures(rows);
    structures = filterFeeStructures(structures, params);

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 10);
    const total = structures.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;

    return {
      data: {
        feeStructures: structures.slice(start, start + limit),
        pagination: { total, page, limit, pages },
      },
    };
  },
  getById: async (id) => {
    const rows = await academicCourseFeeService.getAll({ limit: 500 });
    const structures = groupCourseFeesIntoStructures(rows);
    const feeStructure = structures.find((s) => String(s.id) === String(id));
    if (!feeStructure) {
      const err = new Error('Fee structure not found');
      err.response = { data: { message: 'Fee structure not found' }, status: 404 };
      throw err;
    }
    return { data: { feeStructure } };
  },
  create: async (data) => {
    // Periods are created directly via academicCourseFeeService in the form.
    return { data: { feeStructure: data } };
  },
  update: async (id, data) => ({ data: { feeStructure: { id, ...data } } }),
  delete: async (id) => {
    const { data } = await liveFeeService.getById(id);
    const items = data.feeStructure?.items || [];
    for (const item of items) {
      if (item.uuid) await academicCourseFeeService.remove(item.uuid);
    }
    return { data: { id } };
  },
};

const liveDashboardService = {
  get: () => api.get('/education/dashboard'),
};

const liveUniversityApprovalService = {
  getByUniversity: async (universityId) => {
    const res = await api.get(`/academic/university-approvals/${universityId}`);
    return { data: res.data?.data || [] };
  },
  create: async (data) => {
    const formData = new FormData();
    formData.append('university_id', data.university_id);
    formData.append('approval_name', data.approval_name);
    if (data.approval_description != null) {
      formData.append('approval_description', data.approval_description);
    }
    formData.append('display_order', String(data.display_order ?? 0));
    formData.append('is_active', String(data.is_active ?? true));

    if (data.approval_logo instanceof File) {
      formData.append('approval_logo', data.approval_logo);
    }

    const res = await api.post('/academic/university-approvals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: res.data?.data || res.data };
  },
};

export const sessionService = {
  getAll: async () => {
    const res = await api.get('/session');
    return {
      data: {
        sessions: res.data?.sessions || res.data?.data || [],
      },
    };
  },
  create: (data) => api.post('/session/create', {
    name: data.name,
    start_date: data.start_date,
    expiry_date: data.expiry_date,
  }),
};

export const universityService = liveUniversityService;
export const courseService = liveCourseService;
export const specializationService = liveSpecializationService;
export const feeStructureService = USE_MOCK ? mockFeeService : liveFeeService;
export const educationDashboardService = USE_MOCK ? mockDashboardService : liveDashboardService;
export const universityApprovalService = liveUniversityApprovalService;
export const universityFaqService = {
  getByUniversity: async (universityId) => {
    const res = await api.get(`/academic/university-faqs/${universityId}`);
    return { data: res.data?.data || [] };
  },
  create: async (data) => {
    const res = await api.post('/academic/university-faqs', {
      university_id: data.university_id,
      question: data.question,
      answer: data.answer,
      display: Number(data.display) || 0,
      is_active: data.is_active ?? true,
    });
    return { data: res.data?.data || res.data };
  },
  update: async (id, data) => {
    const res = await api.put(`/academic/university-faqs/${id}`, data);
    return { data: res.data?.data || res.data };
  },
  remove: async (id) => {
    const res = await api.delete(`/academic/university-faqs/${id}`);
    return { data: res.data?.data || res.data };
  },
};

export const courseFaqService = {
  getByCourse: async (courseId) => {
    const res = await api.get(`/academic/courses-faqs/${courseId}`);
    return { data: res.data?.data || [] };
  },
  create: async (data) => {
    const res = await api.post('/academic/courses-faqs', {
      course_uuid: data.course_uuid,
      university_id: data.university_id,
      university_uuid: data.university_uuid,
      question: data.question,
      answer: data.answer,
      display: Number(data.display) || 0,
      is_active: data.is_active ?? true,
    });
    return { data: res.data?.data || res.data };
  },
};

export { toSpecializationPayload };
