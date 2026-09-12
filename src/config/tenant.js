export const defaultTenant = {
  id: 'default-dev',
  shopOwnerId: '00000000-0000-0000-0000-000000000000',
  businessName: 'SaleKar Demo',
  businessType: 'Retail Commerce',
  domain: 'localhost',
  phone: '0300-0000000',
  whatsapp: '0300-0000000',
};

export const customDomainMap = {
  'sk-traders.com': '11111111-1111-1111-1111-111111111111',
  'al-haram.com': '22222222-2222-2222-2222-222222222222',
};

export const mockTenants = {
  localhost: {
    ...defaultTenant,
    id: 'default-dev',
    shopOwnerId: '00000000-0000-0000-0000-000000000000',
    businessName: 'SaleKar Demo',
    businessType: 'Retail Commerce',
    domain: 'localhost',
  },
  'sk-traders.local': {
    id: 'sk-traders',
    shopOwnerId: '11111111-1111-1111-1111-111111111111',
    businessName: 'SK Traders',
    businessType: 'Wholesale Toys',
    domain: 'sk-traders.local',
    phone: '0300-1111111',
    whatsapp: '0300-1111111',
  },
  'al-haram.local': {
    id: 'al-haram',
    shopOwnerId: '22222222-2222-2222-2222-222222222222',
    businessName: 'Al Haram',
    businessType: 'Home & Lifestyle',
    domain: 'al-haram.local',
    phone: '0300-2222222',
    whatsapp: '0300-2222222',
  },
};

export const normalizeHostname = (hostname = '') => {
  const normalized = String(hostname || '').trim().toLowerCase();
  return normalized.replace(/:\d+$/, '').replace(/^www\./, '');
};

export const getDomainToShopOwnerId = (hostname = '') => {
  const normalized = normalizeHostname(hostname);

  if (!normalized) {
    return null;
  }

  return customDomainMap[normalized] || null;
};

export const getMockTenantByHostname = (hostname) => {
  const normalized = normalizeHostname(hostname);

  if (!normalized) {
    return defaultTenant;
  }

  return mockTenants[normalized] || {
    ...defaultTenant,
    id: `tenant-${normalized.replace(/[^a-z0-9]/g, '-')}`,
    shopOwnerId: null,
    isUnknown: true,
    domain: normalized,
  };
};

export const getMockTenantByShopOwnerId = (shopOwnerId) => {
  const value = String(shopOwnerId || '').trim();

  if (!value) {
    return defaultTenant;
  }

  const tenant = Object.values(mockTenants).find((entry) => String(entry.shopOwnerId || '').toLowerCase() === value.toLowerCase());

  return tenant || {
    ...defaultTenant,
    shopOwnerId: value,
    isUnknown: true,
  };
};