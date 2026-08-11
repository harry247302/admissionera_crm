import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { crmService } from '../../services/crmService';

export const fetchDashboard = createAsyncThunk('crm/fetchDashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await crmService.getDashboard();
    return res.data.dashboard;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load dashboard');
  }
});

export const fetchReports = createAsyncThunk('crm/fetchReports', async (params, { rejectWithValue }) => {
  try {
    const res = await crmService.getReports(params);
    return res.data.reports;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load reports');
  }
});

const crmSlice = createSlice({
  name: 'crm',
  initialState: {
    dashboard: null,
    reports: null,
    loading: false,
    reportsLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboard.fulfilled, (state, action) => { state.loading = false; state.dashboard = action.payload; })
      .addCase(fetchDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchReports.pending, (state) => { state.reportsLoading = true; })
      .addCase(fetchReports.fulfilled, (state, action) => { state.reportsLoading = false; state.reports = action.payload; })
      .addCase(fetchReports.rejected, (state, action) => { state.reportsLoading = false; state.error = action.payload; });
  },
});

export default crmSlice.reducer;
