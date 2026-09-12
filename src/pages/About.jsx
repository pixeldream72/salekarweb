import SectionHeader from '../components/SectionHeader.jsx';

function About() {
  return (
    <section id="about" className="section">
      <SectionHeader
        eyebrow="About"
        title="Built for tenant-based commerce"
        description="The SaleKar web app is structured to support multiple businesses with their own identity, content, and product catalogs within a single React codebase."
      />

      <div className="content-grid">
        <article className="info-card">
          <h3>Branding</h3>
          <p>Each business can tailor its own colors, content, and storefront messaging without affecting the global application shell.</p>
        </article>

        <article className="info-card">
          <h3>Tenant model</h3>
          <p>The app is organized to support independent domains, categories, websites, and customer experiences as separate business tenants.</p>
        </article>
      </div>
    </section>
  );
}

export default About;
