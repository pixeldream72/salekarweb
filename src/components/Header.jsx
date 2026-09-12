import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTenant } from '../contexts/TenantContext.jsx';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Categories', to: '/categories' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'My Quotations', to: '/my-quotations' },
  { label: 'Profile', to: '/profile' },
];

function Header() {
  const tenant = useTenant();
  const navigate = useNavigate();
  const { session, signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <header className="topbar">
      <div className="brand-wrap">
        <div className="brand-mark">S</div>
        <div>
          <strong>{tenant.businessName}</strong>
        </div>
      </div>

      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="nav-actions">
        {session ? (
          <>
            <span className="user-badge">{user?.email ? user.email.split('@')[0] : 'Account'}</span>
            <button type="button" className="header-button secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="header-button secondary">
              Login
            </NavLink>
            <NavLink to="/register" className="header-button primary">
              Register
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
