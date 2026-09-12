import { useEffect, useState } from 'react';
import { useTenant } from '../contexts/TenantContext.jsx';
import { fetchBusinessDetail } from '../services/supabaseService.js';

function ProfilePage() {
  const tenantContext = useTenant();
  const [tenant, setTenant] = useState(tenantContext);

  useEffect(() => {
    let active = true;

    fetchBusinessDetail().then(({ data }) => {
      if (active) {
        setTenant({
          ...tenantContext,
          ...data,
        });
      }
    });

    return () => {
      active = false;
    };
  }, [tenantContext]);

  return (
    <section className="page-card">
      <p className="eyebrow">Profile</p>
      <h1>Business profile</h1>
      <p>Manage business details and contact information for this tenant.</p>

      <div className="info-grid">
        <article className="info-card">
          <h3>Business information</h3>
          <ul className="data-list compact">
            <li>
              <strong>Business name</strong>
              <span>{tenant.businessName}</span>
            </li>
            <li>
              <strong>Business type</strong>
              <span>{tenant.businessType}</span>
            </li>
            <li>
              <strong>Primary domain</strong>
              <span>{tenant.domain}</span>
            </li>
          </ul>
        </article>

        <article className="info-card">
          <h3>Contact information</h3>
          <ul className="data-list compact">
            <li>
              <strong>Phone</strong>
              <span>{tenant.phone}</span>
            </li>
            <li>
              <strong>WhatsApp</strong>
              <span>{tenant.whatsapp}</span>
            </li>
            <li>
              <strong>Tenant ID</strong>
              <span>{tenant.id}</span>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}

export default ProfilePage;
