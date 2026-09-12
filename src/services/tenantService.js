export const getTenantSummary = (tenant) => ({
  name: tenant.businessName,
  type: tenant.businessType,
  phone: tenant.phone,
  whatsapp: tenant.whatsapp,
});
