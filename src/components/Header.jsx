import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTenant } from '../contexts/TenantContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'My Quotations', to: '/my-quotations' },
  { label: 'Profile', to: '/profile' },
];

function Header() {
  const tenant = useTenant();
  const navigate = useNavigate();
  const { session, signOut, user } = useAuth();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          className="hamburger-button"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

        <div className="brand-wrap">
          <div>
            <strong>{tenant.businessName}</strong>
          </div>
        </div>

        {session && (
          <span className="user-badge">
            {user?.email ? user.email.split('@')[0] : 'Account'}
          </span>
        )}

        <NavLink to="/cart" className="header-button secondary" style={{ position: 'relative' }}>
          Cart
          {totalItems > 0 && (
            <span
              style={{
                marginLeft: '0.4rem',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '999px',
                padding: '0.1rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              {totalItems}
            </span>
          )}
        </NavLink>
      </div>

      <nav className={`main-nav ${isMenuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeMenu}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}

        {session ? (
          <button type="button" className="header-button secondary" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <>
            <NavLink to="/login" className="header-button primary" onClick={closeMenu}>
              Login
            </NavLink>
            <NavLink to="/register" className="header-button primary" onClick={closeMenu}>
              Register
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;