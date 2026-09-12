import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractShopOwnerIdFromPath,
  resolveTenant,
  resolveTenantByShopOwnerId,
} from './tenantResolver.js';

test('extracts shop_owner_id from a shop route path', () => {
  const shopOwnerId = '12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

  assert.equal(extractShopOwnerIdFromPath('/shop/' + shopOwnerId), shopOwnerId);
  assert.equal(extractShopOwnerIdFromPath('/shop/' + shopOwnerId + '/products'), shopOwnerId);
  assert.equal(extractShopOwnerIdFromPath('/'), null);
});

test('resolves a tenant by shop_owner_id without hard-coded UUIDs in components', () => {
  const tenant = resolveTenantByShopOwnerId('11111111-1111-1111-1111-111111111111');

  assert.equal(tenant.shopOwnerId, '11111111-1111-1111-1111-111111111111');
  assert.equal(tenant.source, 'path');
  assert.equal(tenant.businessName, 'SK Traders');
});

test('supports future custom domain mapping without creating a backend table', () => {
  const tenant = resolveTenant('sk-traders.com');

  assert.equal(tenant.shopOwnerId, '11111111-1111-1111-1111-111111111111');
  assert.equal(tenant.source, 'domain');
  assert.equal(tenant.businessName, 'SK Traders');
});
