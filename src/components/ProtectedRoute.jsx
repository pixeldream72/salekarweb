import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

function ProtectedRoute({ children }) {
  const { session, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <section className="page-card auth-shell">
        <p className="eyebrow">Loading</p>
        <h1>Checking your session...</h1>
        <p>Please wait while we verify your account.</p>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
