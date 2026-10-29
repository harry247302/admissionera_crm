import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { blogService } from '../../services/blogService';

const getErrorMessage = (err, fallback) => {
  if (typeof err === 'string') return err;
  return err.response?.data?.message || err.message || fallback;
};

export const fetchBlogs = createAsyncThunk(
  'blogs/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await blogService.getAll();
      return Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to fetch blogs'));
    }
  }
);

export const createBlog = createAsyncThunk(
  'blogs/create',
  async (blogData, { rejectWithValue }) => {
    try {
      const res = await blogService.create(blogData);
      return res?.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to create blog'));
    }
  }
);

export const updateBlog = createAsyncThunk(
  'blogs/update',
  async ({ uuid, data }, { rejectWithValue }) => {
    try {
      const res = await blogService.update(uuid, data);
      return res?.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to update blog'));
    }
  }
);

export const deleteBlog = createAsyncThunk(
  'blogs/delete',
  async (uuid, { rejectWithValue }) => {
    try {
      await blogService.delete(uuid);
      return uuid;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to delete blog'));
    }
  }
);

const blogSlice = createSlice({
  name: 'blogs',
  initialState: {
    items: [],
    loading: false,
    loaded: false,
    saving: false,
    deleting: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.items = action.payload || [];
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createBlog.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createBlog.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateBlog.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload?.uuid) {
          const idx = state.items.findIndex((b) => b.uuid === action.payload.uuid);
          if (idx !== -1) {
            state.items[idx] = action.payload;
          }
        }
      })
      .addCase(updateBlog.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteBlog.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter((b) => b.uuid !== action.payload);
      })
      .addCase(deleteBlog.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = blogSlice.actions;
export default blogSlice.reducer;

