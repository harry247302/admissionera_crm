import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, useDispatch } from 'react-redux';
import store from './redux/store';
import { fetchMe, logout } from './redux/slices/authSlice';
import App from './App';
import './index.css';

function AuthInit({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMe());
    const handler = () => dispatch(logout());
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [dispatch]);

  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AuthInit>
        <App />
      </AuthInit>
    </Provider>
  </StrictMode>
);
