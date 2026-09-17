import {
  defaultTenant,
  getDomainToShopOwnerId,
  getMockTenantByHostname,
  getMockTenantByShopOwnerId,
  normalizeHostname,
} from '../config/tenant.js';


/*
 * --------------------------------------------------
 * Extract tenant slug from URL
 * --------------------------------------------------
 *
 * New URL structure:
 *
 * /pd-traders
 * /pd-traders/products
 * /pd-traders/login
 * /pd-traders/cart
 *
 * Result:
 *
 * pd-traders
 *
 * Old /shop/pd-traders URLs are no longer supported.
 */
export function extractTenantSlugFromPath(pathname = '') {
  const value = String(
    pathname ||
      (typeof window !== 'undefined'
        ? window.location.pathname
        : '') ||
      ''
  ).trim();

  if (!value) {
    return null;
  }

  const match = value.match(/^\/([^/?#]+)/i);

  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}


/*
 * --------------------------------------------------
 * Backward-compatible function name
 * --------------------------------------------------
 *
 * Some existing files may still import:
 *
 * extractShopOwnerIdFromPath()
 *
 * Keep it temporarily so we don't break the app.
 *
 * IMPORTANT:
 * It now returns the TENANT SLUG,
 * not the shopOwnerId.
 */
export function extractShopOwnerIdFromPath(pathname = '') {
  return extractTenantSlugFromPath(pathname);
}


/*
 * --------------------------------------------------
 * Resolve tenant by custom domain
 * --------------------------------------------------
 */
export function resolveTenantByDomain(hostname = '') {
  const normalized = normalizeHostname(
    hostname ||
      (typeof window !== 'undefined'
        ? window.location.hostname
        : '')
  );

  const shopOwnerId =
    getDomainToShopOwnerId(normalized);

  if (!shopOwnerId) {
    return null;
  }

  const tenantByOwner =
    getMockTenantByShopOwnerId(shopOwnerId);

  if (
    tenantByOwner &&
    tenantByOwner.shopOwnerId
  ) {
    return {
      ...defaultTenant,
      ...tenantByOwner,
      shopOwnerId: tenantByOwner.shopOwnerId,
      source: 'domain',
      domain: normalized,
    };
  }

  return null;
}


/*
 * --------------------------------------------------
 * Resolve tenant
 * --------------------------------------------------
 *
 * NOTE:
 * This legacy resolver works with mock/config tenants.
 *
 * The main TenantContext now performs the real
 * Supabase lookup:
 *
 * tenant slug
 *      ↓
 * getShopOwnerIdBySlug()
 *      ↓
 * shopOwnerId
 */
export function resolveTenant(
  hostname = '',
  shopOwnerId = '',
  pathname = ''
) {
  const currentHostname =
    normalizeHostname(
      hostname ||
        (typeof window !== 'undefined'
          ? window.location.hostname
          : '')
    );

  const currentPath =
    pathname ||
    (typeof window !== 'undefined'
      ? window.location.pathname
      : '');

  const fromPath =
    shopOwnerId ||
    extractTenantSlugFromPath(currentPath);

  /*
   * Try path-based tenant.
   *
   * This legacy function expects fromPath to possibly
   * be a shopOwnerId, so only use the mock lookup here.
   */
  if (fromPath) {
    const tenantByOwner =
      getMockTenantByShopOwnerId(fromPath);

    if (
      tenantByOwner &&
      tenantByOwner.shopOwnerId
    ) {
      return {
        ...defaultTenant,
        ...tenantByOwner,
        shopOwnerId:
          tenantByOwner.shopOwnerId,
        source: 'path',
        domain:
          tenantByOwner.domain ||
          currentHostname ||
          defaultTenant.domain,
      };
    }
  }

  /*
   * Try custom domain.
   */
  const tenantFromDomain =
    resolveTenantByDomain(currentHostname);

  if (tenantFromDomain) {
    return tenantFromDomain;
  }

  /*
   * Try hostname mock tenant.
   */
  const tenant =
    getMockTenantByHostname(
      currentHostname
    );

  return {
    ...defaultTenant,
    ...tenant,
    shopOwnerId:
      tenant.shopOwnerId ||
      defaultTenant.shopOwnerId,
    source: 'hostname',
    domain:
      tenant.domain ||
      currentHostname ||
      defaultTenant.domain,
  };
}


export function resolveTenantByHostname(
  hostname = ''
) {
  return resolveTenant(
    hostname,
    '',
    ''
  );
}


export function resolveTenantByShopOwnerId(
  shopOwnerId = ''
) {
  return resolveTenant(
    '',
    shopOwnerId,
    ''
  );
}


export function getCurrentTenant() {
  return resolveTenant();
}


export const getTenantSummary = (
  tenant
) => ({
  name: tenant.businessName,
  type: tenant.businessType,
  phone: tenant.phone,
  whatsapp: tenant.whatsapp,
  shopOwnerId: tenant.shopOwnerId,
  source: tenant.source,
});