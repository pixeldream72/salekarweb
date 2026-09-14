import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchBusinessDetail } from '../services/supabaseService.js';
import { extractShopOwnerIdFromPath, resolveTenant } from '../services/tenantResolver.js';

const TenantContext = createContext(null);

function hasValidShopOwnerId(pathname = '') {
  const id = extractShopOwnerIdFromPath(pathname);
  return Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
}

export function TenantProvider({ children }) {
  const location = useLocation();
  const [tenant, setTenant] = useState(() => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const pathShopOwnerId = extractShopOwnerIdFromPath(location.pathname);
    const savedShopOwnerId = typeof window !== 'undefined' ? sessionStorage.getItem('shopOwnerId') : '';
    const effectiveShopOwnerId = pathShopOwnerId || savedShopOwnerId || '';
    const resolved = resolveTenant(hostname, effectiveShopOwnerId, location.pathname);

    return {
      ...resolved,
      isLoading: true,
      loadingMessage: 'Resolving tenant...',
    };
  });

  useEffect(() => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const pathShopOwnerId = extractShopOwnerIdFromPath(location.pathname);

    // If the path has a shop ID, remember it for this session
    if (pathShopOwnerId && typeof window !== 'undefined') {
      sessionStorage.setItem('shopOwnerId', pathShopOwnerId);
    }

    // Use the path ID if present, otherwise fall back to the last saved one
    const savedShopOwnerId = typeof window !== 'undefined' ? sessionStorage.getItem('shopOwnerId') : '';
    const effectiveShopOwnerId = pathShopOwnerId || savedShopOwnerId || '';

    const resolved = resolveTenant(hostname, effectiveShopOwnerId, location.pathname);
    const isShopRoute = /^\/shop(?:\/|$)/i.test(location.pathname || '');
    const invalidShopRoute = isShopRoute && !hasValidShopOwnerId(location.pathname);

    if (invalidShopRoute) {
      setTenant({
        shopOwnerId: null,
        source: 'path',
        domain: hostname || 'localhost',
        businessName: 'Shop not found',
        businessType: 'Unavailable',
        isLoading: false,
        loadingMessage: null,
        isInvalidTenant: true,
      });
      return undefined;
    }

    setTenant({
      ...resolved,
      isLoading: true,
      loadingMessage: 'Loading business information...',
      isInvalidTenant: false,
    });

    if (!resolved.shopOwnerId) {
      setTenant((current) => ({
        ...current,
        ...resolved,
        isLoading: false,
        loadingMessage: null,
        isInvalidTenant: false,
      }));
      return undefined;
    }

    let isActive = true;

    fetchBusinessDetail(resolved.shopOwnerId).then(({ data }) => {
      if (!isActive) {
        return;
      }

      setTenant({
        ...resolved,
        ...(data || {}),
        shopOwnerId: resolved.shopOwnerId,
        source: resolved.source,
        domain: (data && data.domain) || resolved.domain,
        isLoading: false,
        loadingMessage: null,
        isInvalidTenant: false,
      });
    });

    return () => {
      isActive = false;
    };
  }, [location.pathname]);

  const value = useMemo(() => tenant, [tenant]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }

  return context;
}

export default TenantContext;