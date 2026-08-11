import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { counselorService } from '../../services/crmService';

export const fetchCounselors = createAsyncThunk('counselors/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await counselorService.getAll();
    return res.data.counselors;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch counselors');
  }
});

export const fetchCounselorById = createAsyncThunk('counselors/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await counselorService.getById(id);
    return res.data.counselor;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch counselor');
  }
});

const counselorSlice = createSlice({
  name: 'counselors',
  initialState: { items: [], current: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCounselors.pending, (state) => { state.loading = true; })
      .addCase(fetchCounselors.fulfilled, (state, action) => { state.loading = false; state.items = action.payload || []; })
      .addCase(fetchCounselors.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchCounselorById.fulfilled, (state, action) => { state.current = action.payload; });
  },
});

export default counselorSlice.reducer;
