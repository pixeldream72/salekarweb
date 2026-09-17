import { useLocation } from 'react-router-dom';

export function useTenantPath() {
  const location = useLocation();

  const segments = location.pathname
    .split('/')
    .filter(Boolean);

  const tenantSlug = segments[0] || '';

  const tenantBasePath = tenantSlug
    ? `/${tenantSlug}`
    : '';

  const getTenantPath = (path = '') => {
    if (!tenantBasePath) {
      return path || '/';
    }

    if (!path || path === '/') {
      return tenantBasePath;
    }

    return `${tenantBasePath}${path}`;
  };

  return {
    tenantSlug,
    tenantBasePath,
    getTenantPath,
  };
}