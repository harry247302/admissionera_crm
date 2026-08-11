import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import crmReducer from './slices/crmSlice';
import leadReducer from './slices/leadSlice';
import followupReducer from './slices/followupSlice';
import taskReducer from './slices/taskSlice';
import counselorReducer from './slices/counselorSlice';
import applicationReducer from './slices/applicationSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    crm: crmReducer,
    leads: leadReducer,
    followups: followupReducer,
    tasks: taskReducer,
    counselors: counselorReducer,
    applications: applicationReducer,
  },
});

export default store;
