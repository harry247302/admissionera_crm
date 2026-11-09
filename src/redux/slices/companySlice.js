import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import companyService from '../../services/companyService';

export const fetchCompanies = createAsyncThunk(
  'companies/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await companyService.getAll();
      const list = Array.isArray(response)
        ? response
        : response?.data ?? response?.companies ?? [];
      return list;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load companies');
    }
  }
);

export const fetchCompanyById = createAsyncThunk(
  'companies/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await companyService.getById(id);
      return response?.data ?? response;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load company details');
    }
  }
);

export const createCompany = createAsyncThunk(
  'companies/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await companyService.create(data);
      const created = response?.data ?? response?.company ?? data;
      return created;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create company');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await companyService.update(id, data);
      const updated = response?.data ?? response?.company ?? { id, ...data };
      return updated;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update company');
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/delete',
  async (id, { rejectWithValue }) => {
    try {
      await companyService.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete company');
    }
  }
);

const companySlice = createSlice({
  name: 'companies',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
    selectedCompany: null,
    search: '',
  },
  reducers: {
    setCompanySearch: (state, action) => {
      state.search = action.payload;
    },
    setSelectedCompany: (state, action) => {
      state.selectedCompany = action.payload;
    },
    clearCompanyError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCompanies
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load companies';
      })

      // fetchCompanyById
      .addCase(fetchCompanyById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCompany = action.payload;
      })
      .addCase(fetchCompanyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createCompany
      .addCase(createCompany.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.saving = false;
        const exists = state.items.some(
          (c) =>
            (c.id && action.payload?.id && String(c.id) === String(action.payload.id)) ||
            (c.company_name || '').toLowerCase() === (action.payload?.company_name || '').toLowerCase()
        );
        if (!exists && action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // updateCompany
      .addCase(updateCompany.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        const index = state.items.findIndex(
          (c) =>
            (updated?.id && String(c.id) === String(updated.id)) ||
            (updated?.uuid && String(c.uuid) === String(updated.uuid))
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updated };
        }
        if (
          state.selectedCompany &&
          ((updated?.id && String(state.selectedCompany.id) === String(updated.id)) ||
            (updated?.uuid && String(state.selectedCompany.uuid) === String(updated.uuid)))
        ) {
          state.selectedCompany = { ...state.selectedCompany, ...updated };
        }
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // deleteCompany
      .addCase(deleteCompany.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.saving = false;
        const idToDelete = String(action.payload);
        state.items = state.items.filter(
          (c) => String(c.id) !== idToDelete && String(c.uuid) !== idToDelete
        );
        if (
          state.selectedCompany &&
          (String(state.selectedCompany.id) === idToDelete ||
            String(state.selectedCompany.uuid) === idToDelete)
        ) {
          state.selectedCompany = null;
        }
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { setCompanySearch, setSelectedCompany, clearCompanyError } =
  companySlice.actions;

export default companySlice.reducer;
