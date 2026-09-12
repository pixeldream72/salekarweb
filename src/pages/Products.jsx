import SectionHeader from '../components/SectionHeader.jsx';

const products = [
  {
    name: 'Wholesale Toys',
    tag: 'Popular',
    description: 'Bulk-ready product listings built for repeat orders and storefront clarity.',
  },
  {
    name: 'Seasonal Packs',
    tag: 'New',
    description: 'Curated bundles designed for promotions and customer upsells.',
  },
  {
    name: 'Fast Moving Items',
    tag: 'Top sellers',
    description: 'High-volume catalog items highlighted for faster browsing and ordering.',
  },
];

function Products() {
  return (
    <section id="products" className="section">
      <SectionHeader
        eyebrow="Products"
        title="Catalog structure for multi-tenant sales"
        description="This area is prepared for tenant-specific categories, stock information, and product discovery views."
      />

      <div className="product-grid">
        {products.map((product) => (
          <article key={product.name} className="product-card">
            <span className="tag">{product.tag}</span>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Products;
