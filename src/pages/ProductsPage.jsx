import { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../contexts/TenantContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { fetchProducts } from '../services/supabaseService.js';
import { useTenantPath } from '../hooks/useTenantPath.js';

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

function buildProductPlaceholderImage(name = 'Product', itemCode = '') {
  const safeName = (name || 'Product').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeCode = (itemCode || 'ITEM').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#dbeafe"/>
          <stop offset="100%" stop-color="#bfdbfe"/>
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="28" fill="#f8fafc"/>
      <rect x="28" y="28" width="264" height="264" rx="22" fill="url(#g)"/>
      <circle cx="160" cy="128" r="52" fill="#ffffff" opacity="0.8"/>
      <path d="M126 176L160 132L194 176" fill="none" stroke="#2563eb" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M116 194H204" stroke="#2563eb" stroke-width="14" stroke-linecap="round"/>
      <text x="160" y="245" text-anchor="middle" fill="#0f172a" font-size="18" font-family="Arial, sans-serif" font-weight="700">${safeName}</text>
      <text x="160" y="270" text-anchor="middle" fill="#475569" font-size="14" font-family="Arial, sans-serif">${safeCode}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// NEW: a single variant row, as its OWN small component
// This is like extracting a ViewHolder's binding logic into its own class in Android —
// each row manages its own local "how many to add" state independently.
function VariantRow({ variant }) {
  const { items, addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const cartItem = items.find((item) => item.product.id === variant.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleDecrease = () => setQuantity((current) => Math.max(0, current - 1));
  const handleIncrease = () => setQuantity((current) => current + 1);
  const handleAdd = () => {
    if (quantity <= 0) {
      return;
    }

    addToCart(variant, quantity);
  };

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
      <span className="variant-price" style={{ minWidth: '80px' }}>
        PKR {variant.price}
        {variant.unit ? <span className="variant-unit" style={{ color: '#64748b', marginLeft: '0.18rem' }}>/{variant.unit}</span> : null}
      </span>

      <div className="variant-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button type="button" onClick={handleDecrease} style={{ width: '32px' }}>-</button>
        <input
          type="number"
          min="0"
          value={quantity}
          onChange={(event) => {
            const nextValue = event.target.value;

            if (nextValue === '') {
              setQuantity(0);
              return;
            }

            const parsedValue = Number(nextValue);
            setQuantity(Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0);
          }}
          style={{ width: '50px', textAlign: 'center' }}
        />
        <button type="button" onClick={handleIncrease} style={{ width: '32px' }}>+</button>
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
   const { getTenantPath } = useTenantPath();
  const [products, setProducts] = useState([]);
  const [source, setSource] = useState('loading');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewImage, setPreviewImage] = useState(null);
 

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

      <div
        className="category-row"
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
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
              flex: '0 0 auto',
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {groupedProducts.length === 0 ? (
        <p style={{ marginTop: '1rem', color: '#64748b' }}>No products match your search.</p>
      ) : (
        groupedProducts.map((group) => {
          const previewSource = group.imageUrl || buildProductPlaceholderImage(group.name, group.itemCode);

          return (
            <div key={group.itemCode} className="product-group" style={{ marginBottom: '2rem' }}>
              <div className="product-group-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <img
                  className="product-group-image interactive-image"
                  src={previewSource}
                  alt={group.name}
                  onClick={() => setPreviewImage(previewSource)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setPreviewImage(previewSource);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Preview image for ${group.name}`}
                  style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                />
                <h3 className="product-group-title" style={{ margin: 0 }}>
                  {group.name} <small style={{ color: '#64748b' }}>({group.itemCode})</small>
                </h3>
              </div>

              {group.variants.map((variant) => (
                <VariantRow key={variant.id} variant={variant} />
              ))}
            </div>
          );
        })
      )}

      {previewImage && (
        <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <div className="image-preview-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="image-preview-close"
              onClick={() => setPreviewImage(null)}
              aria-label="Close image preview"
            >
              ✕
            </button>
            <img src={previewImage} alt="Product preview" className="image-preview-image" />
          </div>
        </div>
      )}
    </section>
  );
}

export default ProductsPage;