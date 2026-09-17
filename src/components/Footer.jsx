import { useTenant } from '../contexts/TenantContext.jsx';
import { useTenantPath } from '../hooks/useTenantPath.js';

function Footer() {
  const tenant = useTenant();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>© 2026 {tenant.businessName}</span>
        <span>{tenant.businessType}</span>
      </div>
    </footer>
  );
}

export default Footer;
