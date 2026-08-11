import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useSelector((s) => s.auth);
  const location = useLocation();

  if (loading) return <LoadingSpinner message="Checking authentication..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}
