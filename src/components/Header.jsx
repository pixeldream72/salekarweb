import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTenant } from '../contexts/TenantContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { supabase } from '../services/supabaseClient.js';
import {NavLink,useNavigate,} from 'react-router-dom';
import { useTenantPath } from '../hooks/useTenantPath.js';

function Header() {
  const tenant = useTenant();
  const navigate = useNavigate();
const { getTenantPath } = useTenantPath();


  const { session, signOut, user } = useAuth();
  const { totalItems } = useCart();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState('Account');

  const navItems = [
    { label: 'Home', to: getTenantPath('/') },
    { label: 'Products', to: getTenantPath('/products') },
    { label: 'About', to: getTenantPath('/about') },
    { label: 'Contact', to: getTenantPath('/contact') },
    ...(session
      ? [
          {
            label: 'My Quotations',
            to: getTenantPath('/my-quotations'),
          },
        ]
      : []),
  ];

  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId) {
      setDisplayName('Account');
      return;
    }

    let isMounted = true;

    const loadProfileName = async () => {
      const { data, error } = await supabase
        .from('customer_profile')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.warn(
          'Failed to load customer profile for header:',
          error.message
        );
      }

      const nextName =
        data?.full_name?.trim() ||
        user?.user_metadata?.full_name ||
        session?.user?.email?.split('@')[0] ||
        'Account';

      setDisplayName(nextName);
    };

    loadProfileName();

    return () => {
      isMounted = false;
    };
  }, [session, user]);

  const handleLogout = async () => {
    try {
      await signOut();

      navigate(getTenantPath('/login'), {
        replace: true,
      });

      setIsMenuOpen(false);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="topbar">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <button
          type="button"
          className="hamburger-button"
          onClick={() =>
            setIsMenuOpen((current) => !current)
          }
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
          <NavLink
            to={getTenantPath('/profile')}
            className="user-badge"
            onClick={closeMenu}
          >
            {displayName}
          </NavLink>
        )}

        <NavLink
          to={getTenantPath('/cart')}
          className="header-button secondary"
          style={{ position: 'relative' }}
          onClick={closeMenu}
        >
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

      <nav
        className={`main-nav ${
          isMenuOpen ? 'nav-open' : ''
        }`}
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? 'nav-link active'
                : 'nav-link'
            }
          >
            {item.label}
          </NavLink>
        ))}

        {session ? (
          <button
            type="button"
            className="header-button secondary"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : (
          <>
            <NavLink
              to={getTenantPath('/login')}
              className="header-button primary"
              onClick={closeMenu}
            >
              Login
            </NavLink>

            <NavLink
              to={getTenantPath('/register')}
              className="header-button primary"
              onClick={closeMenu}
            >
              Register
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;