import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { followupService } from '../../services/crmService';

export const fetchFollowups = createAsyncThunk('followups/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await followupService.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch follow-ups');
  }
});

export const createFollowup = createAsyncThunk('followups/create', async (data, { rejectWithValue }) => {
  try {
    const res = await followupService.create(data);
    return res.data.followup;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to schedule follow-up');
  }
});

export const updateFollowup = createAsyncThunk('followups/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await followupService.update(id, data);
    return res.data.followup;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update follow-up');
  }
});

const followupSlice = createSlice({
  name: 'followups',
  initialState: { items: [], pagination: {}, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFollowups.pending, (state) => { state.loading = true; })
      .addCase(fetchFollowups.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.followups || [];
        state.pagination = action.payload.pagination || {};
      })
      .addCase(fetchFollowups.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createFollowup.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateFollowup.fulfilled, (state, action) => {
        const idx = state.items.findIndex((f) => f.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export default followupSlice.reducer;
