import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { counselorService } from '../../services/crmService';

const fail = (err, fallback) => err.response?.data?.message || err.message || fallback;

export const fetchCounselors = createAsyncThunk(
  'counselors/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await counselorService.getAll();
    } catch (err) {
      return rejectWithValue(fail(err, 'Failed to fetch counsellors'));
    }
  },
  {
    condition: (options, { getState }) => {
      const { loading, loaded } = getState().counselors;
      if (loading) return false;
      return Boolean(options?.force) || !loaded;
    },
  }
);

export const createCounselor = createAsyncThunk('counselors/create', async (data, { rejectWithValue }) => {
  try {
    return await counselorService.create(data);
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to create counsellor'));
  }
});

export const updateCounselor = createAsyncThunk('counselors/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await counselorService.update(id, data);
  } catch (err) {
    return rejectWithValue(fail(err, 'Failed to update counsellor'));
  }
});

const counselorSlice = createSlice({
  name: 'counselors',
  initialState: { items: [], loading: false, loaded: false, saving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCounselors.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCounselors.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.items = action.payload || [];
      })
      .addCase(fetchCounselors.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createCounselor.pending, (state) => { state.saving = true; })
      .addCase(createCounselor.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload?.id) state.items.unshift(action.payload);
      })
      .addCase(createCounselor.rejected, (state) => { state.saving = false; })

      .addCase(updateCounselor.pending, (state) => { state.saving = true; })
      .addCase(updateCounselor.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.items.findIndex((c) => c.id === action.payload?.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateCounselor.rejected, (state) => { state.saving = false; });
  },
});

export default counselorSlice.reducer;
