import { useTenant } from '../contexts/TenantContext.jsx';

function AboutPage() {
  const tenant = useTenant();

  return (
    <section className="page-card">
      <p className="eyebrow">About</p>
      <h1>About {tenant.businessName}</h1>

      <p style={{ fontSize: '1.05rem', marginTop: '1rem' }}>
        {tenant.businessName} is a {tenant.businessType?.toLowerCase() || 'wholesale'} business
        {tenant.city ? ` based in ${tenant.city}` : ''}, committed to offering quality products
        and reliable service to our customers.
      </p>

      <div className="info-grid" style={{ marginTop: '2rem' }}>
        <article className="info-card">
          <h3>What we offer</h3>
          <p style={{ color: '#64748b' }}>
            A wide range of wholesale-ready products with bulk-friendly pricing, easy quotation
            requests, and fast turnaround for repeat orders.
          </p>
        </article>

        <article className="info-card">
          <h3>Why choose us</h3>
          <p style={{ color: '#64748b' }}>
            We focus on straightforward pricing, clear communication, and making it simple to
            reorder the products you rely on.
          </p>
        </article>
      </div>

      {(tenant.address || tenant.city || tenant.phone) && (
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
          <h3>Find us</h3>
          {(tenant.address || tenant.city) && (
            <p>
              📍 {tenant.address}
              {tenant.city ? `, ${tenant.city}` : ''}
            </p>
          )}
          {tenant.phone && <p>📞 {tenant.phone}</p>}
        </div>
      )}
    </section>
  );
}

export default AboutPage;