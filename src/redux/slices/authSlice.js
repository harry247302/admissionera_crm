import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const PREVIEW_USER = {
  id: 1,
  name: 'Preview Admin',
  email: 'preview@admissionera.com',
  role: 'admin',
};

export const login = createAsyncThunk('auth/login', async () => PREVIEW_USER);
export const register = createAsyncThunk('auth/register', async () => PREVIEW_USER);
export const fetchMe = createAsyncThunk('auth/fetchMe', async () => PREVIEW_USER);
export const logout = createAsyncThunk('auth/logout', async () => PREVIEW_USER);

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: PREVIEW_USER, loading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(register.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(fetchMe.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(logout.fulfilled, (state, action) => { state.user = action.payload || PREVIEW_USER; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
