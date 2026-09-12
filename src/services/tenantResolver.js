import {
  defaultTenant,
  getDomainToShopOwnerId,
  getMockTenantByHostname,
  getMockTenantByShopOwnerId,
  normalizeHostname,
} from '../config/tenant.js';

export function extractShopOwnerIdFromPath(pathname = '') {
  const value = String(pathname || (typeof window !== 'undefined' ? window.location.pathname : '') || '')
    .trim();

  if (!value) {
    return null;
  }

  const match = value.match(/\/shop\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

export function resolveTenantByDomain(hostname = '') {
  const normalized = normalizeHostname(hostname || (typeof window !== 'undefined' ? window.location.hostname : ''));
  const shopOwnerId = getDomainToShopOwnerId(normalized);

  if (!shopOwnerId) {
    return null;
  }

  const tenantByOwner = getMockTenantByShopOwnerId(shopOwnerId);

  if (tenantByOwner && tenantByOwner.shopOwnerId) {
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

export function resolveTenant(hostname = '', shopOwnerId = '', pathname = '') {
  const currentHostname = normalizeHostname(hostname || (typeof window !== 'undefined' ? window.location.hostname : ''));
  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  const fromPath = shopOwnerId || extractShopOwnerIdFromPath(currentPath);

  if (fromPath) {
    const tenantByOwner = getMockTenantByShopOwnerId(fromPath);
    if (tenantByOwner && tenantByOwner.shopOwnerId) {
      return {
        ...defaultTenant,
        ...tenantByOwner,
        shopOwnerId: tenantByOwner.shopOwnerId,
        source: 'path',
        domain: tenantByOwner.domain || currentHostname || defaultTenant.domain,
      };
    }
  }

  const tenantFromDomain = resolveTenantByDomain(currentHostname);
  if (tenantFromDomain) {
    return tenantFromDomain;
  }

  const tenant = getMockTenantByHostname(currentHostname);

  return {
    ...defaultTenant,
    ...tenant,
    shopOwnerId: tenant.shopOwnerId || defaultTenant.shopOwnerId,
    source: 'hostname',
    domain: tenant.domain || currentHostname || defaultTenant.domain,
  };
}

export function resolveTenantByHostname(hostname = '') {
  return resolveTenant(hostname, '', '');
}

export function resolveTenantByShopOwnerId(shopOwnerId = '') {
  return resolveTenant('', shopOwnerId, '');
}

export function getCurrentTenant() {
  return resolveTenant();
}

export const getTenantSummary = (tenant) => ({
  name: tenant.businessName,
  type: tenant.businessType,
  phone: tenant.phone,
  whatsapp: tenant.whatsapp,
  shopOwnerId: tenant.shopOwnerId,
  source: tenant.source,
});
