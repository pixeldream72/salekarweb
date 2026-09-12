import { useEffect, useState } from 'react';
import { useTenant } from '../contexts/TenantContext.jsx';
import { fetchProducts } from '../services/supabaseService.js';

function ProductsPage() {
  const { shopOwnerId } = useTenant();
  const [products, setProducts] = useState([]);
  const [source, setSource] = useState('loading');

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      const result = await fetchProducts(shopOwnerId);

      if (!isMounted) {
        return;
      }

      setProducts(result.data || []);
      setSource(result.source || 'empty');
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [shopOwnerId]);

  return (
    <section className="page-card">
      <p className="eyebrow">Products</p>
      <h1>Products</h1>
      <p>
        {source === 'loading' && 'Loading products...'}
        {source === 'supabase' && 'Live Supabase data.'}
        {source === 'fallback' && 'Showing demo catalog while Supabase data is not available.'}
        {source === 'empty' && 'No products found for this shop.'}
      </p>

      {products.length === 0 ? (
        <p style={{ marginTop: '1rem', color: '#64748b' }}>
          There are no catalog items for this tenant yet.
        </p>
      ) : (
        <ul className="data-list">
          {products.map((product) => (
            <li key={product.id}>
              <strong>{product.name}</strong>
              <span>{product.price ? `PKR ${product.price}` : 'Price unavailable'}</span>
              <small>{product.description}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ProductsPage;
