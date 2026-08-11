import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { leadService } from '../../services/crmService';

export const fetchLeads = createAsyncThunk('leads/fetchLeads', async (params, { rejectWithValue }) => {
  try {
    const res = await leadService.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch leads');
  }
});

export const fetchLeadById = createAsyncThunk('leads/fetchLeadById', async (id, { rejectWithValue }) => {
  try {
    const res = await leadService.getById(id);
    return res.data.lead;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch lead');
  }
});

export const createLead = createAsyncThunk('leads/createLead', async (data, { rejectWithValue }) => {
  try {
    const res = await leadService.create(data);
    return res.data.lead;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create lead');
  }
});

export const updateLead = createAsyncThunk('leads/updateLead', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await leadService.update(id, data);
    return res.data.lead;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update lead');
  }
});

export const deleteLead = createAsyncThunk('leads/deleteLead', async (id, { rejectWithValue }) => {
  try {
    await leadService.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete lead');
  }
});

export const bulkUpdateLeads = createAsyncThunk('leads/bulkUpdate', async ({ ids, data }, { rejectWithValue }) => {
  try {
    const res = await leadService.bulkUpdate(ids, data);
    return res.data.leads;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to bulk update');
  }
});

export const fetchLeadActivities = createAsyncThunk('leads/fetchActivities', async (id, { rejectWithValue }) => {
  try {
    const res = await leadService.getActivities(id);
    return res.data.activities;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch activities');
  }
});

export const fetchLeadNotes = createAsyncThunk('leads/fetchNotes', async (id, { rejectWithValue }) => {
  try {
    const res = await leadService.getNotes(id);
    return res.data.notes;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch notes');
  }
});

export const addLeadNote = createAsyncThunk('leads/addNote', async ({ id, note }, { rejectWithValue }) => {
  try {
    const res = await leadService.addNote(id, note);
    return res.data.note;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add note');
  }
});

export const convertLead = createAsyncThunk('leads/convert', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await leadService.convert(id, data);
    return res.data.admission;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to convert lead');
  }
});

const leadSlice = createSlice({
  name: 'leads',
  initialState: {
    items: [],
    currentLead: null,
    activities: [],
    notes: [],
    pagination: { total: 0, page: 1, limit: 20 },
    filters: {},
    selectedIds: [],
    loading: false,
    detailLoading: false,
    error: null,
  },
  reducers: {
    setFilters: (state, action) => { state.filters = action.payload; },
    setSelectedIds: (state, action) => { state.selectedIds = action.payload; },
    clearCurrentLead: (state) => {
      state.currentLead = null;
      state.activities = [];
      state.notes = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.leads || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchLeads.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.items = []; })
      .addCase(fetchLeadById.pending, (state) => { state.detailLoading = true; })
      .addCase(fetchLeadById.fulfilled, (state, action) => { state.detailLoading = false; state.currentLead = action.payload; })
      .addCase(fetchLeadById.rejected, (state, action) => { state.detailLoading = false; state.error = action.payload; })
      .addCase(createLead.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateLead.fulfilled, (state, action) => {
        const idx = state.items.findIndex((l) => l.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentLead?.id === action.payload.id) state.currentLead = action.payload;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.items = state.items.filter((l) => l.id !== action.payload);
      })
      .addCase(fetchLeadActivities.fulfilled, (state, action) => { state.activities = action.payload || []; })
      .addCase(fetchLeadNotes.fulfilled, (state, action) => { state.notes = action.payload || []; })
      .addCase(addLeadNote.fulfilled, (state, action) => { state.notes.unshift(action.payload); });
  },
});

export const { setFilters, setSelectedIds, clearCurrentLead } = leadSlice.actions;
export default leadSlice.reducer;
