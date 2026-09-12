import SectionHeader from '../components/SectionHeader.jsx';
import { tenant } from '../config/tenant.js';
import { formatPhone } from '../utils/formatters.js';

function Contact() {
  return (
    <section id="contact" className="section">
      <SectionHeader
        eyebrow="Contact"
        title="Customer and business contact details"
        description="This is a simple placeholder contact view for tenant support and business communication details."
      />

      <div className="contact-grid">
        <article className="contact-card">
          <h3>Call us</h3>
          <p>{formatPhone(tenant.phone)}</p>
        </article>

        <article className="contact-card">
          <h3>WhatsApp</h3>
          <p>{formatPhone(tenant.whatsapp)}</p>
        </article>
      </div>
    </section>
  );
}

export default Contact;
