import { Link } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext.jsx';

function HomePage() {
  const tenant = useTenant();

  return (
    <div>
      {/* Hero header */}
      <section
        className="page-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          marginBottom: '1.5rem',
        }}
      >
        {tenant.logoUrl ? (
          <img
            src={tenant.logoUrl}
            alt={tenant.businessName}
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              borderRadius: '14px',
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              flexShrink: 0,
              display: 'block',
              padding: '6px',
            }}
          />
        ) : (
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '14px',
              backgroundColor: '#2563eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            {tenant.businessName?.charAt(0) || 'S'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p
            style={{
              fontSize: '0.85rem',
              margin: 0,
              lineHeight: 1.2,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
            }}
          >
            Welcome to
          </p>
          <h1 style={{ margin: '0.2rem 0 0', lineHeight: 1.2, fontSize: '1.75rem' }}>
            {tenant.businessName}
          </h1>
        </div>
      </section>

      {/* Call to action */}
      <section className="page-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Browse our catalog and request a quote</h2>
        <p style={{ color: '#64748b', maxWidth: '480px', margin: '0.5rem auto 1.5rem' }}>
          Explore wholesale-ready products, build your quotation, and we'll get back to you fast.
        </p>
        <Link to="/products" className="header-button primary" style={{ display: 'inline-block' }}>
          Browse Products
        </Link>
      </section>

      {/* Highlights */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          margin: '1.5rem 0',
        }}
      >
        <div className="page-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
          <h3 style={{ margin: '0 0 0.3rem' }}>Wholesale Ready</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Bulk-friendly pricing and quantities on every product.
          </p>
        </div>

        <div className="page-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
          <h3 style={{ margin: '0 0 0.3rem' }}>Quick Quotations</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Build your order and submit a quote request in minutes.
          </p>
        </div>

        <div className="page-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
          <h3 style={{ margin: '0 0 0.3rem' }}>Easy Reordering</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Reorder any past quotation with a single click.
          </p>
        </div>
      </section>

      {/* Contact info */}
      {(tenant.phone || tenant.address) && (
        <section className="page-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Get in touch</h3>
          {tenant.phone && <p style={{ margin: '0.3rem 0' }}>📞 {tenant.phone}</p>}
          {tenant.address && (
            <p style={{ margin: '0.3rem 0' }}>
              📍 {tenant.address}{tenant.city ? `, ${tenant.city}` : ''}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

export default HomePage;