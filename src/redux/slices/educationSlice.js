import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  universityService,
  courseService,
  specializationService,
  feeStructureService,
  educationDashboardService,
} from '../../services/educationService';

const fail = (err, fallback) => err.response?.data?.message || err.message || fallback;

export const fetchEducationDashboard = createAsyncThunk('education/dashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await educationDashboardService.get();
    return res.data.dashboard;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to load education dashboard'));
  }
});

export const fetchUniversities = createAsyncThunk('education/fetchUniversities', async (params, { rejectWithValue }) => {
  try {
    const res = await universityService.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to fetch universities'));
  }
});

export const fetchUniversityOptions = createAsyncThunk('education/universityOptions', async (_, { rejectWithValue }) => {
  try {
    const res = await universityService.getOptions();
    return res.data.universities;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to load universities'));
  }
});

export const fetchUniversityById = createAsyncThunk('education/universityById', async (id, { rejectWithValue }) => {
  try {
    const res = await universityService.getById(id);
    return res.data.university;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to fetch university'));
  }
});

export const createUniversity = createAsyncThunk('education/createUniversity', async (data, { rejectWithValue }) => {
  try {
    const res = await universityService.create(data);
    return res.data.university;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to create university'));
  }
});

export const updateUniversity = createAsyncThunk('education/updateUniversity', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await universityService.update(id, data);
    return res.data.university;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to update university'));
  }
});

export const deleteUniversity = createAsyncThunk('education/deleteUniversity', async (id, { rejectWithValue }) => {
  try {
    await universityService.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to delete university'));
  }
});

export const fetchCourses = createAsyncThunk('education/fetchCourses', async (params, { rejectWithValue }) => {
  try {
    const res = await courseService.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to fetch courses'));
  }
});

export const fetchCourseOptions = createAsyncThunk('education/courseOptions', async (params, { rejectWithValue }) => {
  try {
    const res = await courseService.getOptions(params);
    return res.data.courses;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to load courses'));
  }
});

export const fetchCourseById = createAsyncThunk('education/courseById', async (id, { rejectWithValue }) => {
  try {
    const res = await courseService.getById(id);
    return res.data.course;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to fetch course'));
  }
});

export const createCourse = createAsyncThunk('education/createCourse', async (data, { rejectWithValue }) => {
  try {
    const res = await courseService.create(data);
    return res.data.course;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to create course'));
  }
});

export const updateCourse = createAsyncThunk('education/updateCourse', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await courseService.update(id, data);
    return res.data.course;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to update course'));
  }
});

export const deleteCourse = createAsyncThunk('education/deleteCourse', async (id, { rejectWithValue }) => {
  try {
    await courseService.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to delete course'));
  }
});

export const fetchSpecializations = createAsyncThunk('education/fetchSpecializations', async (params, { rejectWithValue }) => {
  try {
    const res = await specializationService.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to fetch specializations'));
  }
});

export const createSpecialization = createAsyncThunk('education/createSpecialization', async (data, { rejectWithValue }) => {
  try {
    const res = await specializationService.create(data);
    return res.data.specialization;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to create specialization'));
  }
});

export const updateSpecialization = createAsyncThunk('education/updateSpecialization', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await specializationService.update(id, data);
    return res.data.specialization;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to update specialization'));
  }
});

export const deleteSpecialization = createAsyncThunk('education/deleteSpecialization', async (id, { rejectWithValue }) => {
  try {
    await specializationService.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to delete specialization'));
  }
});

export const fetchFeeStructures = createAsyncThunk('education/fetchFees', async (params, { rejectWithValue }) => {
  try {
    const res = await feeStructureService.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to fetch fee structures'));
  }
});

export const fetchFeeStructureById = createAsyncThunk('education/feeById', async (id, { rejectWithValue }) => {
  try {
    const res = await feeStructureService.getById(id);
    return res.data.feeStructure;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to fetch fee structure'));
  }
});

export const createFeeStructure = createAsyncThunk('education/createFee', async (data, { rejectWithValue }) => {
  try {
    const res = await feeStructureService.create(data);
    return res.data.feeStructure;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to create fee structure'));
  }
});

export const updateFeeStructure = createAsyncThunk('education/updateFee', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await feeStructureService.update(id, data);
    return res.data.feeStructure;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to update fee structure'));
  }
});

export const deleteFeeStructure = createAsyncThunk('education/deleteFee', async (id, { rejectWithValue }) => {
  try {
    await feeStructureService.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to delete fee structure'));
  }
});

const emptyPage = { total: 0, page: 1, limit: 10, pages: 1 };

const educationSlice = createSlice({
  name: 'education',
  initialState: {
    dashboard: null,
    universities: [],
    universityOptions: [],
    universityPagination: emptyPage,
    currentUniversity: null,
    courses: [],
    courseOptions: [],
    coursePagination: emptyPage,
    currentCourse: null,
    specializations: [],
    specializationPagination: emptyPage,
    feeStructures: [],
    feePagination: emptyPage,
    currentFeeStructure: null,
    universityFilters: {},
    courseFilters: {},
    specializationFilters: {},
    feeFilters: {},
    loading: false,
    detailLoading: false,
    saving: false,
    error: null,
  },
  reducers: {
    setUniversityFilters: (state, action) => { state.universityFilters = action.payload; },
    setCourseFilters: (state, action) => { state.courseFilters = action.payload; },
    setSpecializationFilters: (state, action) => { state.specializationFilters = action.payload; },
    setFeeFilters: (state, action) => { state.feeFilters = action.payload; },
    clearCurrentUniversity: (state) => { state.currentUniversity = null; },
    clearCurrentCourse: (state) => { state.currentCourse = null; },
    clearCurrentFee: (state) => { state.currentFeeStructure = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEducationDashboard.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEducationDashboard.fulfilled, (state, action) => { state.loading = false; state.dashboard = action.payload; })
      .addCase(fetchEducationDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchUniversities.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUniversities.fulfilled, (state, action) => {
        state.loading = false;
        state.universities = action.payload.universities || [];
        state.universityPagination = action.payload.pagination || emptyPage;
      })
      .addCase(fetchUniversities.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.universities = []; })
      .addCase(fetchUniversityOptions.fulfilled, (state, action) => { state.universityOptions = action.payload || []; })
      .addCase(fetchUniversityById.pending, (state) => { state.detailLoading = true; })
      .addCase(fetchUniversityById.fulfilled, (state, action) => { state.detailLoading = false; state.currentUniversity = action.payload; })
      .addCase(fetchUniversityById.rejected, (state, action) => { state.detailLoading = false; state.error = action.payload; })
      .addCase(createUniversity.pending, (state) => { state.saving = true; })
      .addCase(createUniversity.fulfilled, (state, action) => { state.saving = false; state.universities.unshift(action.payload); })
      .addCase(createUniversity.rejected, (state) => { state.saving = false; })
      .addCase(updateUniversity.fulfilled, (state, action) => {
        const idx = state.universities.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.universities[idx] = { ...state.universities[idx], ...action.payload };
        if (state.currentUniversity?.id === action.payload.id) {
          state.currentUniversity = { ...state.currentUniversity, ...action.payload };
        }
      })
      .addCase(deleteUniversity.fulfilled, (state, action) => {
        state.universities = state.universities.filter((u) => u.id !== action.payload);
      })

      .addCase(fetchCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.courses || [];
        state.coursePagination = action.payload.pagination || emptyPage;
      })
      .addCase(fetchCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.courses = []; })
      .addCase(fetchCourseOptions.fulfilled, (state, action) => { state.courseOptions = action.payload || []; })
      .addCase(fetchCourseById.pending, (state) => { state.detailLoading = true; })
      .addCase(fetchCourseById.fulfilled, (state, action) => { state.detailLoading = false; state.currentCourse = action.payload; })
      .addCase(fetchCourseById.rejected, (state, action) => { state.detailLoading = false; state.error = action.payload; })
      .addCase(createCourse.pending, (state) => { state.saving = true; })
      .addCase(createCourse.fulfilled, (state, action) => { state.saving = false; state.courses.unshift(action.payload); })
      .addCase(createCourse.rejected, (state) => { state.saving = false; })
      .addCase(updateCourse.fulfilled, (state, action) => {
        const idx = state.courses.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.courses[idx] = action.payload;
        if (state.currentCourse?.id === action.payload.id) {
          state.currentCourse = { ...state.currentCourse, ...action.payload };
        }
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.courses = state.courses.filter((c) => c.id !== action.payload);
      })

      .addCase(fetchSpecializations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSpecializations.fulfilled, (state, action) => {
        state.loading = false;
        state.specializations = action.payload.specializations || [];
        state.specializationPagination = action.payload.pagination || emptyPage;
      })
      .addCase(fetchSpecializations.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.specializations = []; })
      .addCase(createSpecialization.pending, (state) => { state.saving = true; })
      .addCase(createSpecialization.fulfilled, (state, action) => { state.saving = false; state.specializations.unshift(action.payload); })
      .addCase(createSpecialization.rejected, (state) => { state.saving = false; })
      .addCase(updateSpecialization.fulfilled, (state, action) => {
        const idx = state.specializations.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.specializations[idx] = action.payload;
      })
      .addCase(deleteSpecialization.fulfilled, (state, action) => {
        state.specializations = state.specializations.filter((s) => s.id !== action.payload);
      })

      .addCase(fetchFeeStructures.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFeeStructures.fulfilled, (state, action) => {
        state.loading = false;
        state.feeStructures = action.payload.feeStructures || [];
        state.feePagination = action.payload.pagination || emptyPage;
      })
      .addCase(fetchFeeStructures.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.feeStructures = []; })
      .addCase(fetchFeeStructureById.fulfilled, (state, action) => { state.currentFeeStructure = action.payload; })
      .addCase(createFeeStructure.pending, (state) => { state.saving = true; })
      .addCase(createFeeStructure.fulfilled, (state, action) => { state.saving = false; state.feeStructures.unshift(action.payload); })
      .addCase(createFeeStructure.rejected, (state) => { state.saving = false; })
      .addCase(updateFeeStructure.fulfilled, (state, action) => {
        const idx = state.feeStructures.findIndex((f) => f.id === action.payload.id);
        if (idx !== -1) state.feeStructures[idx] = action.payload;
        state.currentFeeStructure = action.payload;
      })
      .addCase(deleteFeeStructure.fulfilled, (state, action) => {
        state.feeStructures = state.feeStructures.filter((f) => f.id !== action.payload);
      });
  },
});

export const {
  setUniversityFilters,
  setCourseFilters,
  setSpecializationFilters,
  setFeeFilters,
  clearCurrentUniversity,
  clearCurrentCourse,
  clearCurrentFee,
} = educationSlice.actions;

export default educationSlice.reducer;
