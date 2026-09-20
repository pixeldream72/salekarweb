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
  getShopOwnerIdBySlug,
  resolveShopOwnerIdBySlugOrDomain,
} from '../services/supabaseService.js';

import {
  extractShopOwnerIdFromPath,
} from '../services/tenantResolver.js';

const TenantContext = createContext(null);

const EMPTY_TENANT = {
  shopOwnerId: null,
  tenantSlug: '',
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
         * 1. Get tenant from URL
         * -----------------------------------------
         *
         * Examples:
         *
         * /pd-traders
         * /pd-traders/products
         * /pd-traders/login
         *
         * tenantSlug = pd-traders
         */

        const pathSegment =
          extractShopOwnerIdFromPath(pathname);

        let resolvedShopOwnerId = null;
        let source = null;
        let tenantSlug = '';

        if (pathSegment) {
    
          if (isValidUuid(pathSegment)) {
            resolvedShopOwnerId = pathSegment;
            source = 'path-uuid';

            
          }

          else {
            tenantSlug = pathSegment;

            resolvedShopOwnerId =
              await getShopOwnerIdBySlug(tenantSlug);

            source = 'path-slug';

          }
        }

        

        if (!resolvedShopOwnerId) {
        

          resolvedShopOwnerId =
            await resolveShopOwnerIdBySlugOrDomain(
              hostname
            );

          if (resolvedShopOwnerId) {
            source = 'domain';

           
          }
        }

        /*
         * -----------------------------------------
         * 3. Tenant NOT FOUND
         * -----------------------------------------
         */

        if (!resolvedShopOwnerId) {
         

          if (!isActive) return;

          setTenant({
            ...EMPTY_TENANT,
            tenantSlug,
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
          tenantSlug,
          source,
          domain: hostname,
          isLoading: true,
          loadingMessage:
            'Loading business information...',
          isInvalidTenant: false,
        });

       


        const { data, error } =
          await fetchBusinessDetail(
            resolvedShopOwnerId
          );

        if (!isActive) return;

        if (error) {
        

          setTenant({
            ...EMPTY_TENANT,
            tenantSlug,
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
            ...EMPTY_TENANT,
            tenantSlug,
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


        setTenant({
          ...data,

          shopOwnerId: resolvedShopOwnerId,

          /*
           * Always keep the URL slug available.
           */
          tenantSlug,

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
          ...EMPTY_TENANT,
          tenantSlug: '',
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