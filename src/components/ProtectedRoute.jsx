import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTenantPath } from '../hooks/useTenantPath.js';

function ProtectedRoute({ children }) {
  const { session, authLoading } = useAuth();
  const location = useLocation();
  const { getTenantPath } = useTenantPath();

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
    const from =
      location.pathname +
      location.search +
      location.hash;

    return (
      <Navigate
        to={getTenantPath('/login')}
        replace
        state={{ from }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;