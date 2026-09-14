import { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../contexts/TenantContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { fetchProducts } from '../services/supabaseService.js';

function groupProductsByItemCode(products) {
  const groups = {};

  products.forEach((product) => {
    const key = product.item_code || 'uncategorized';

    if (!groups[key]) {
      groups[key] = {
        itemCode: key,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl, // NEW
        variants: [],
      };
    }

    groups[key].variants.push(product);
  });

  return Object.values(groups);
}

function filterGroups(groups, searchTerm, selectedCategory) {
  return groups.filter((group) => {
    const matchesCategory =
      selectedCategory === 'All' || group.category === selectedCategory;

    const search = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !search ||
      group.name.toLowerCase().includes(search) ||
      group.itemCode.toLowerCase().includes(search) ||
      group.variants.some((v) => (v.color || '').toLowerCase().includes(search));

    return matchesCategory && matchesSearch;
  });
}

function getUniqueCategories(products) {
  const categories = new Set(products.map((p) => p.category || 'Uncategorized'));
  return ['All', ...Array.from(categories)];
}

// NEW: a single variant row, as its OWN small component
// This is like extracting a ViewHolder's binding logic into its own class in Android —
// each row manages its own local "how many to add" state independently.
function VariantRow({ variant }) {
  const { items, addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const cartItem = items.find((item) => item.product.id === variant.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleDecrease = () => setQuantity((current) => Math.max(1, current - 1));
  const handleIncrease = () => setQuantity((current) => current + 1);
  const handleAdd = () => addToCart(variant, quantity);

    return (
    <div
      className="variant-row"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem',
        borderBottom: '1px solid #e2e8f0',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      <span className="variant-color" style={{ minWidth: '80px' }}>{variant.color || 'Default'}</span>
      <span className="variant-price" style={{ minWidth: '80px' }}>PKR {variant.price}</span>

      <div className="variant-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button type="button" onClick={handleDecrease} style={{ width: '32px' }}>-</button>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          style={{ width: '50px', textAlign: 'center' }}
        />
        <button type="button" onClick={handleIncrease} style={{ width: '32px' }}>+</button>
        <span className="variant-unit" style={{ color: '#64748b' }}>{variant.unit}</span>
      </div>

      <button type="button" className="header-button primary" onClick={handleAdd}>
        Add to Cart
      </button>

      {quantityInCart > 0 && (
        <span className="cart-count-pill" style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ {quantityInCart} in cart</span>
      )}
    </div>
  );



}

function ProductsPage() {
  const { shopOwnerId } = useTenant();
  const [products, setProducts] = useState([]);
  const [source, setSource] = useState('loading');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const categories = useMemo(() => getUniqueCategories(products), [products]);

  const groupedProducts = useMemo(() => {
    const groups = groupProductsByItemCode(products);
    return filterGroups(groups, searchTerm, selectedCategory);
  }, [products, searchTerm, selectedCategory]);

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

      <input
        type="text"
        className="product-search"
        placeholder="Search by name, item code, or color..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', fontSize: '1rem' }}
      />

      <div className="category-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: '1px solid #2563eb',
              backgroundColor: selectedCategory === category ? '#2563eb' : 'white',
              color: selectedCategory === category ? 'white' : '#2563eb',
              cursor: 'pointer',
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {groupedProducts.length === 0 ? (
        <p style={{ marginTop: '1rem', color: '#64748b' }}>No products match your search.</p>
      ) : (
       groupedProducts.map((group) => (
  <div key={group.itemCode} className="product-group" style={{ marginBottom: '2rem' }}>
    <div className="product-group-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
      {group.imageUrl ? (
        <img
          className="product-group-image"
          src={group.imageUrl}
          alt={group.name}
          style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px' }}
        />
      ) : (
        <div className="product-group-image product-group-image-placeholder" style={{ width: '48px', height: '48px', backgroundColor: '#e2e8f0', borderRadius: '6px' }} />
      )}
      <h3 className="product-group-title" style={{ margin: 0 }}>
        {group.name} <small style={{ color: '#64748b' }}>({group.itemCode})</small>
      </h3>
    </div>

    {group.variants.map((variant) => (
      <VariantRow key={variant.id} variant={variant} />
    ))}
  </div>
))
      )}
    </section>
  );
}

export default ProductsPage;