import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  fetchBusinessDetail,
  isValidUuid,
  resolveShopOwnerIdBySlug,
  resolveShopOwnerIdBySlugOrDomain,
} from '../services/supabaseService.js';
import { extractShopOwnerIdFromPath, resolveTenant } from '../services/tenantResolver.js';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const location = useLocation();
  const [tenant, setTenant] = useState({
    shopOwnerId: null,
    isLoading: true,
    loadingMessage: 'Resolving tenant...',
    isInvalidTenant: false,
  });

  useEffect(() => {
    let isActive = true;

    const resolveEverything = async () => {
      setTenant((current) => ({
        ...current,
        isLoading: true,
        loadingMessage: 'Resolving tenant...',
      }));

      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const pathSegment = extractShopOwnerIdFromPath(location.pathname);
      const isShopRoute = /^\/shop(?:\/|$)/i.test(location.pathname || '');

      let resolvedShopOwnerId = null;
      let source = 'default';

      if (pathSegment) {
        if (isValidUuid(pathSegment)) {
          // Path segment IS a valid UUID — use it directly
          resolvedShopOwnerId = pathSegment;
          source = 'path-uuid';
        } else {
  // Path segment is a SLUG — look it up
  console.log('Path segment (not UUID):', pathSegment); // TEMP DEBUG
  resolvedShopOwnerId = await resolveShopOwnerIdBySlug(pathSegment);
  console.log('Resolved shopOwnerId from slug:', resolvedShopOwnerId); // TEMP DEBUG
  source = 'path-slug';
}
      } else {
        // No path segment — try domain/subdomain resolution
        const domainResolved = await resolveShopOwnerIdBySlugOrDomain(hostname);

        if (domainResolved) {
          resolvedShopOwnerId = domainResolved;
          source = 'domain';
        } else {
          // Fallback: previously saved shop in this browser session
          const saved = typeof window !== 'undefined' ? sessionStorage.getItem('shopOwnerId') : '';
          if (saved) {
            resolvedShopOwnerId = saved;
            source = 'session';
          }
        }
      }

      if (!isActive) return;

      // If this was a /shop/ route but resolution failed, show "not found"
      if (isShopRoute && !resolvedShopOwnerId) {
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
        return;
      }

      if (!resolvedShopOwnerId) {
        // No tenant resolvable at all — fall back to default/mock tenant
        const fallback = resolveTenant(hostname, '', location.pathname);
        setTenant({
          ...fallback,
          isLoading: false,
          loadingMessage: null,
          isInvalidTenant: false,
        });
        return;
      }

      // Remember this shop for the rest of the browsing session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('shopOwnerId', resolvedShopOwnerId);
      }

      setTenant((current) => ({
        ...current,
        shopOwnerId: resolvedShopOwnerId,
        source,
        isLoading: true,
        loadingMessage: 'Loading business information...',
        isInvalidTenant: false,
      }));

      const { data } = await fetchBusinessDetail(resolvedShopOwnerId);

      if (!isActive) return;

      setTenant({
        ...(data || {}),
        shopOwnerId: resolvedShopOwnerId,
        source,
        domain: hostname,
        isLoading: false,
        loadingMessage: null,
        isInvalidTenant: false,
      });
    };

    void resolveEverything();

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