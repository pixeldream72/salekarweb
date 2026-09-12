import { useTenant } from '../contexts/TenantContext.jsx';

function HomePage() {
  const tenant = useTenant();

  return (
    <section className="page-card">
      <p className="eyebrow">Home</p>
      <h1>{tenant.businessName}</h1>
      <p>
        Tenant: {tenant.businessType} · Domain: {tenant.domain}
      </p>
      <p>This is the home page placeholder for the multi-tenant SaaS storefront.</p>
    </section>
  );
}

export default HomePage;
