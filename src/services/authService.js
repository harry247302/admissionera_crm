import { PREVIEW_USER } from '../redux/slices/authSlice';

const ok = (user = PREVIEW_USER) => Promise.resolve({ data: { user } });

export const authService = {
  login: () => ok(),
  register: () => ok(),
  logout: () => ok(),
  me: () => ok(),
};
