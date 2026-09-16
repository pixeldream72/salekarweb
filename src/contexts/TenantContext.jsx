import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useLocation } from 'react-router-dom';

import {
  fetchBusinessDetail,
  isValidUuid,
  resolveShopOwnerIdBySlug,
  resolveShopOwnerIdBySlugOrDomain,
} from '../services/supabaseService.js';

import {
  extractShopOwnerIdFromPath,
} from '../services/tenantResolver.js';

const TenantContext = createContext(null);

const EMPTY_TENANT = {
  shopOwnerId: null,
  source: null,
  domain: '',
  businessName: '',
  businessType: '',
  isLoading: true,
  loadingMessage: 'Resolving tenant...',
  isInvalidTenant: false,
};

export function TenantProvider({ children }) {
  const location = useLocation();

  const [tenant, setTenant] = useState(EMPTY_TENANT);

  useEffect(() => {
    let isActive = true;

    const resolveEverything = async () => {
      const hostname =
        typeof window !== 'undefined'
          ? window.location.hostname
          : '';

      const pathname = location.pathname || '';

      console.log('--------------------------------');
      console.log('TENANT RESOLUTION START');
      console.log('Hostname:', hostname);
      console.log('Pathname:', pathname);

      if (isActive) {
        setTenant({
          ...EMPTY_TENANT,
          domain: hostname,
          isLoading: true,
          loadingMessage: 'Resolving tenant...',
        });
      }

      try {
        /*
         * -----------------------------------------
         * 1. Resolve tenant from URL path
         * -----------------------------------------
         */

        const pathSegment = extractShopOwnerIdFromPath(pathname);

        let resolvedShopOwnerId = null;
        let source = null;

        if (pathSegment) {
          console.log('Path tenant:', pathSegment);

          if (isValidUuid(pathSegment)) {
            resolvedShopOwnerId = pathSegment;
            source = 'path-uuid';

            console.log(
              'Using UUID from path:',
              resolvedShopOwnerId
            );
          } else {
            console.log(
              'Path is slug. Resolving slug:',
              pathSegment
            );

            resolvedShopOwnerId =
              await resolveShopOwnerIdBySlug(pathSegment);

            source = 'path-slug';

            console.log(
              'Resolved slug → shopOwnerId:',
              resolvedShopOwnerId
            );
          }
        }

        /*
         * -----------------------------------------
         * 2. If no path tenant, resolve hostname
         * -----------------------------------------
         */

        if (!resolvedShopOwnerId) {
          console.log(
            'No path tenant. Resolving hostname:',
            hostname
          );

          resolvedShopOwnerId =
            await resolveShopOwnerIdBySlugOrDomain(hostname);

          if (resolvedShopOwnerId) {
            source = 'domain';

            console.log(
              'Resolved domain → shopOwnerId:',
              resolvedShopOwnerId
            );
          }
        }

        /*
         * -----------------------------------------
         * 3. Tenant NOT FOUND
         * -----------------------------------------
         */

        if (!resolvedShopOwnerId) {
          console.warn(
            'TENANT NOT FOUND',
            {
              hostname,
              pathname,
              pathSegment,
            }
          );

          if (!isActive) return;

          setTenant({
            shopOwnerId: null,
            source: source || 'not-found',
            domain: hostname,
            businessName: 'Shop not found',
            businessType: 'Unavailable',
            isLoading: false,
            loadingMessage: null,
            isInvalidTenant: true,
          });

          return;
        }

        /*
         * -----------------------------------------
         * 4. Tenant ID resolved
         * -----------------------------------------
         */

        if (!isActive) return;

        setTenant({
          ...EMPTY_TENANT,
          shopOwnerId: resolvedShopOwnerId,
          source,
          domain: hostname,
          isLoading: true,
          loadingMessage: 'Loading business information...',
          isInvalidTenant: false,
        });

        console.log(
          'Fetching BusinessDetail:',
          resolvedShopOwnerId
        );

        /*
         * -----------------------------------------
         * 5. Load BusinessDetail
         * -----------------------------------------
         */

        const { data, error } =
          await fetchBusinessDetail(resolvedShopOwnerId);

        if (!isActive) return;

        if (error) {
          console.error(
            'BusinessDetail fetch error:',
            error
          );

          setTenant({
            shopOwnerId: null,
            source: 'business-detail-error',
            domain: hostname,
            businessName: 'Shop not found',
            businessType: 'Unavailable',
            isLoading: false,
            loadingMessage: null,
            isInvalidTenant: true,
          });

          return;
        }

        if (!data) {
          console.warn(
            'No BusinessDetail found for:',
            resolvedShopOwnerId
          );

          setTenant({
            shopOwnerId: null,
            source: 'business-detail-not-found',
            domain: hostname,
            businessName: 'Shop not found',
            businessType: 'Unavailable',
            isLoading: false,
            loadingMessage: null,
            isInvalidTenant: true,
          });

          return;
        }

        /*
         * -----------------------------------------
         * 6. Tenant successfully loaded
         * -----------------------------------------
         */

        console.log(
          'TENANT LOADED:',
          data.businessName
        );

        setTenant({
          ...data,
          shopOwnerId: resolvedShopOwnerId,
          source,
          domain: hostname,
          isLoading: false,
          loadingMessage: null,
          isInvalidTenant: false,
        });

      } catch (error) {
        console.error(
          'Tenant resolution failed:',
          error
        );

        if (!isActive) return;

        setTenant({
          shopOwnerId: null,
          source: 'error',
          domain: hostname,
          businessName: 'Shop not found',
          businessType: 'Unavailable',
          isLoading: false,
          loadingMessage: null,
          isInvalidTenant: true,
        });
      }
    };

    void resolveEverything();

    return () => {
      isActive = false;
    };
  }, [location.pathname]);

  const value = useMemo(
    () => tenant,
    [tenant]
  );

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error(
      'useTenant must be used within a TenantProvider'
    );
  }

  return context;
}

export default TenantContext;