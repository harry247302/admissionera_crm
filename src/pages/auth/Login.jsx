import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, register, clearError } from '../../redux/slices/authSlice';
import AuthLayout from '../../layouts/AuthLayout';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    try {
      if (isRegister) {
        await dispatch(register(form)).unwrap();
      } else {
        await dispatch(login({ email: form.email, password: form.password })).unwrap();
      }
      navigate('/crm');
    } catch (_) { /* error in state */ }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-center">{isRegister ? 'Create Account' : 'Sign In'}</h2>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {isRegister && (
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
        </button>
        <p className="text-center text-sm text-slate-500">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="text-brand-600 font-medium" onClick={() => { setIsRegister(!isRegister); dispatch(clearError()); }}>
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
