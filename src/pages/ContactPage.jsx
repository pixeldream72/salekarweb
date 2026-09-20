import { Link } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext.jsx';
import { useTenantPath } from '../hooks/useTenantPath.js';

function ContactPage() {
  const tenant = useTenant();
  const { getTenantPath } = useTenantPath();

   

  return (
    <section className="page-card">
      <p className="eyebrow">Contact</p>

      <h1>Get in touch with {tenant.businessName}</h1>

      <p style={{ color: '#64748b' }}>
        Have a question about our products or an existing quotation?
        Reach out using any of the details below.
      </p>

      <div className="info-grid" style={{ marginTop: '1.5rem' }}>
        <article className="info-card">
          <h3>Contact details</h3>

          <ul className="data-list compact">
            {tenant.phone && (
              <li>
                <strong>Phone</strong>
                <span>
                  <a
                    href={`tel:${tenant.phone}`}
                    style={{ color: 'inherit' }}
                  >
                    {tenant.phone}
                  </a>
                </span>
              </li>
            )}

            {tenant.whatsapp && (
              <li>
                <strong>WhatsApp</strong>
                <span>
                  <a
                    href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit' }}
                  >
                    {tenant.whatsapp}
                  </a>
                </span>
              </li>
            )}

            {tenant.email && (
              <li>
                <strong>Email</strong>
                
                <span>
                  <a
                    href={`mailto:${tenant.email}`}
                    style={{ color: 'inherit' }}
                  >
                    {tenant.email}
                    
                  </a>
                </span>
              </li>
              
            )}
            
          </ul>
        </article>
       
        {(tenant.address || tenant.city) && (
          <article className="info-card">
            <h3>Location</h3>

            <p>
              {tenant.address}
              {tenant.city ? `, ${tenant.city}` : ''}
            </p>
          </article>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link
          to={getTenantPath('/products')}
          className="header-button primary"
        >
          Browse Products
        </Link>
      </div>
    </section>
  );
}

export default ContactPage;