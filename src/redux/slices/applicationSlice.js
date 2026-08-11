import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { applicationService, admissionService } from '../../services/crmService';

export const fetchApplications = createAsyncThunk('applications/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await applicationService.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch applications');
  }
});

export const createApplication = createAsyncThunk('applications/create', async (data, { rejectWithValue }) => {
  try {
    const res = await applicationService.create(data);
    return res.data.application;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create application');
  }
});

export const updateApplication = createAsyncThunk('applications/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await applicationService.update(id, data);
    return res.data.application;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update application');
  }
});

export const fetchAdmissions = createAsyncThunk('admissions/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await admissionService.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch admissions');
  }
});

const applicationSlice = createSlice({
  name: 'applications',
  initialState: {
    applications: [],
    admissions: [],
    pagination: {},
    admissionsPagination: {},
    loading: false,
    admissionsLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.pending, (state) => { state.loading = true; })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = action.payload.applications || [];
        state.pagination = action.payload.pagination || {};
      })
      .addCase(fetchApplications.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createApplication.fulfilled, (state, action) => { state.applications.unshift(action.payload); })
      .addCase(updateApplication.fulfilled, (state, action) => {
        const idx = state.applications.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.applications[idx] = action.payload;
      })
      .addCase(fetchAdmissions.pending, (state) => { state.admissionsLoading = true; })
      .addCase(fetchAdmissions.fulfilled, (state, action) => {
        state.admissionsLoading = false;
        state.admissions = action.payload.admissions || [];
        state.admissionsPagination = action.payload.pagination || {};
      })
      .addCase(fetchAdmissions.rejected, (state, action) => { state.admissionsLoading = false; state.error = action.payload; });
  },
});

export default applicationSlice.reducer;
