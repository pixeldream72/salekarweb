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
            {tenant.what_we_offer || 'A wide range of wholesale-ready products with bulk-friendly pricing, easy quotation requests, and fast turnaround for repeat orders.'}
          </p>
        </article>

        <article className="info-card">
          <h3>Why choose us</h3>
          <p style={{ color: '#64748b' }}>
            {tenant.why_choose_us || 
            'We focus on straightforward pricing, clear communication, and making it simple to reorder the products you rely on.'}
          </p>
        </article>
      </div>

      {(tenant.address ||
  tenant.city ||
  tenant.phone ||
  tenant.socialAccounts?.length > 0) && (
  <div
    style={{
      marginTop: '2rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid #e2e8f0',
    }}
  >
    <h3>Find us</h3>

    {(tenant.address || tenant.city) && (
      <p>
        📍 {tenant.address}
        {tenant.city ? `, ${tenant.city}` : ''}
      </p>
    )}

    {tenant.phone && <p>📞 {tenant.phone}</p>}

    {/* Social Media */}
    {tenant.socialAccounts?.length > 0 && (
      <div style={{ marginTop: '1rem' }}>
        <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
          🌐 Follow us
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {tenant.socialAccounts.map((social, index) => (
            social.url && (
              <a
                key={social.id || index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--theme-primary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                {social.title || 'Social Media'}
              </a>
            )
          ))}
        </div>
      </div>
    )}
  </div>
)}
    </section>
  );
}

export default AboutPage;