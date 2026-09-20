import { useEffect, useMemo, useRef, useState } from 'react';
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
        imageUrl: product.imageUrl,
        createdDate: product.created_date,
        variants: [],
      };
    }

    if (product.created_date && (!groups[key].createdDate || product.created_date > groups[key].createdDate)) {
      groups[key].createdDate = product.created_date;
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

function sortGroups(groups, sortOrder) {
  const sorted = [...groups];

  sorted.sort((a, b) => {
    const aDate = a.createdDate ? new Date(a.createdDate).getTime() : 0;
    const bDate = b.createdDate ? new Date(b.createdDate).getTime() : 0;

    return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
  });

  return sorted;
}

function getUniqueCategories(products) {
  const categories = new Set(products.map((p) => p.category || 'Uncategorized'));
  return ['All', ...Array.from(categories)];
}

// Lets a normal vertical mouse wheel scroll a horizontal row (desktop UX);
// touch/swipe already works natively on mobile without this.
function handleHorizontalWheel(event) {
  if (event.deltaY === 0) {
    return;
  }

  const el = event.currentTarget;
  const canScroll = el.scrollWidth > el.clientWidth;

  if (!canScroll) {
    return;
  }

  el.scrollLeft += event.deltaY;
  event.preventDefault();
}

// Click-and-drag horizontal scrolling for desktop mice (mobile keeps native
// touch/swipe scrolling, unaffected by this). Spread the returned handlers
// onto the scrollable element along with its ref.
function useDragScroll() {
  const ref = useRef(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = (event) => {
    const el = ref.current;
    if (!el) return;
    dragState.current.isDown = true;
    dragState.current.startX = event.pageX - el.offsetLeft;
    dragState.current.scrollLeft = el.scrollLeft;
  };

  const stopDragging = () => {
    dragState.current.isDown = false;
  };

  const onMouseMove = (event) => {
    const el = ref.current;
    if (!dragState.current.isDown || !el) return;
    event.preventDefault();
    const x = event.pageX - el.offsetLeft;
    const walk = x - dragState.current.startX;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  };

  return {
    ref,
    onMouseDown,
    onMouseUp: stopDragging,
    onMouseLeave: stopDragging,
    onMouseMove,
  };
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

// Grid card: product image as the full background, with variant color
// dots overlaid at the bottom of the image (tap to select, scroll horizontally
// if there are many). The selected variant's price + qty + add-to-cart sit
// in a bar directly under the image.
function ProductGridCard({ group, onPreview }) {
  const { items, addToCart } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(group.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const variantDrag = useDragScroll();

  const selectedVariant =
    group.variants.find((v) => v.id === selectedVariantId) || group.variants[0];

  const cartVariants = group.variants
    .map((variant) => {
      const cartItem = items.find((item) => item.product.id === variant.id);
      return cartItem ? { color: variant.color || 'Default', qty: cartItem.quantity } : null;
    })
    .filter(Boolean);

  const previewSource = group.imageUrl || buildProductPlaceholderImage(group.name, group.itemCode);

  const handleSelectVariant = (variantId) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
  };

  const handleDecrease = () => setQuantity((current) => Math.max(0, current - 1));
  const handleIncrease = () => setQuantity((current) => current + 1);
  const handleAdd = () => {
    if (quantity <= 0) {
      return;
    }

    addToCart(selectedVariant, quantity);
  };

  return (
    <div
      className="product-grid-card"
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          backgroundImage: `url("${previewSource}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: 'pointer',
        }}
        onClick={() => onPreview(previewSource)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPreview(previewSource);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Preview image for ${group.name}`}
      >
        {cartVariants.length > 0 && (
          <div
            style={{
              position: 'absolute',
              right: '0.5rem',
              bottom: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.25rem',
              maxWidth: 'calc(100% - 1rem)',
            }}
          >
            {cartVariants.map((entry) => (
              <span
                key={entry.color}
                style={{
                  backgroundColor: 'rgba(22, 163, 74, 0.92)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.55rem',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  maxWidth: '100%',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                }}
              >
                <span>✓</span>
                <span>{entry.qty}</span>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.color}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>
          {group.name} <small style={{ color: '#64748b' }}>({group.itemCode})</small>
        </h3>

        {group.variants.length > 1 && (
          <div
            ref={variantDrag.ref}
            onWheel={handleHorizontalWheel}
            onMouseDown={variantDrag.onMouseDown}
            onMouseUp={variantDrag.onMouseUp}
            onMouseLeave={variantDrag.onMouseLeave}
            onMouseMove={variantDrag.onMouseMove}
            style={{
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              flexWrap: 'nowrap',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '0.15rem',
              minWidth: 0,
              maxWidth: '100%',
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            {group.variants.map((variant) => {
              const isSelected = variant.id === selectedVariant.id;

              return (
                <button
                  key={variant.id}
                  type="button"
                  className="grid-variant-pill"
                  onClick={() => handleSelectVariant(variant.id)}
                  style={{
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    padding: '0.3rem 0.7rem',
                    borderRadius: '999px',
                    border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#2563eb' : 'white',
                    color: isSelected ? 'white' : '#334155',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {variant.color || 'Default'}
                </button>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.9rem', color: '#334155' }}>
            {selectedVariant.color || 'Default'}
            <strong style={{ marginLeft: '0.5rem' }}>
              PKR {selectedVariant.price}
              {selectedVariant.unit ? <span style={{ color: '#64748b', fontWeight: 400 }}>/{selectedVariant.unit}</span> : null}
            </strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button type="button" onClick={handleDecrease} style={{ width: '32px', height: '32px' }}>-</button>
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
            style={{ width: '50px', height: '32px', textAlign: 'center' }}
          />
          <button type="button" onClick={handleIncrease} style={{ width: '32px', height: '32px' }}>+</button>

          <button
            type="button"
            className="header-button primary grid-add-to-cart"
            onClick={handleAdd}
            style={{ flex: 1, minWidth: '110px' }}
          >
            Add to Cart
          </button>
        </div>
      </div>
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
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'grid';
    return localStorage.getItem('products_view_mode') || 'grid';
  }); // 'list' | 'grid'
  const [sortOrder, setSortOrder] = useState(() => {
    if (typeof window === 'undefined') return 'newest';
    return localStorage.getItem('products_sort_order') || 'newest';
  }); // 'newest' | 'oldest'

  useEffect(() => {
    localStorage.setItem('products_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('products_sort_order', sortOrder);
  }, [sortOrder]);
  const categoryDrag = useDragScroll();

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
    const filtered = filterGroups(groups, searchTerm, selectedCategory);
    return sortGroups(filtered, sortOrder);
  }, [products, searchTerm, selectedCategory, sortOrder]);

  return (
    <section className="page-card">
      <style>{`
        .products-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 641px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1400px) {
          .products-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 640px) {
          .grid-variant-pill {
            padding: 0.2rem 0.5rem !important;
            font-size: 0.7rem !important;
          }
          .grid-add-to-cart {
            padding: 0.75rem !important;
            font-size: 1rem !important;
            min-height: 44px;
          }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <p className="eyebrow">Products</p>
          <h1 style={{ margin: 0 }}>Products</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setSortOrder((current) => (current === 'newest' ? 'oldest' : 'newest'))}
            title={sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
            aria-label="Toggle sort order"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {sortOrder === 'newest' ? '⇓' : '⇑'}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            disabled={viewMode === 'list'}
            aria-label="List view"
            title="List view"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #2563eb',
              backgroundColor: viewMode === 'list' ? '#2563eb' : 'white',
              color: viewMode === 'list' ? 'white' : '#2563eb',
              cursor: viewMode === 'list' ? 'default' : 'pointer',
              fontSize: '1rem',
            }}
          >
            ☰
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            disabled={viewMode === 'grid'}
            aria-label="Grid view"
            title="Grid view"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #2563eb',
              backgroundColor: viewMode === 'grid' ? '#2563eb' : 'white',
              color: viewMode === 'grid' ? 'white' : '#2563eb',
              cursor: viewMode === 'grid' ? 'default' : 'pointer',
              fontSize: '1rem',
            }}
          >
            ⊞
          </button>
        </div>
      </div>

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
        ref={categoryDrag.ref}
        onWheel={handleHorizontalWheel}
        onMouseDown={categoryDrag.onMouseDown}
        onMouseUp={categoryDrag.onMouseUp}
        onMouseLeave={categoryDrag.onMouseLeave}
        onMouseMove={categoryDrag.onMouseMove}
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          minWidth: 0,
          maxWidth: '100%',
          cursor: 'grab',
          userSelect: 'none',
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
      ) : viewMode === 'grid' ? (
        <div className="products-grid">
          {groupedProducts.map((group) => (
            <ProductGridCard key={group.itemCode} group={group} onPreview={setPreviewImage} />
          ))}
        </div>
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