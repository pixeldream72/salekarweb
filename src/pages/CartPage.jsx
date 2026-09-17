import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTenant } from '../contexts/TenantContext.jsx';
import { createQuotation, updateQuotation } from '../services/supabaseService.js';
import { useTenantPath } from '../hooks/useTenantPath.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
}

function groupCartItemsByItemCode(items) {
  const groups = {};

  items.forEach((item) => {
    const key = item.product.item_code || 'uncategorized';

    if (!groups[key]) {
      groups[key] = {
        itemCode: key,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        variants: [],
      };
    }

    groups[key].variants.push(item);
  });

  return Object.values(groups);
}

function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    totalAmount,
    clearCart,
    cartMode,
    editingQuotationId,
  } = useCart();

  const { session } = useAuth();
  const { shopOwnerId } = useTenant();
  const { getTenantPath } = useTenantPath();

  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [draftQuantities, setDraftQuantities] = useState({});

  const groupedCart = groupCartItemsByItemCode(items);

  useEffect(() => {
    setDraftQuantities((current) => {
      const next = { ...current };

      items.forEach((item) => {
        next[item.product.id] = String(item.quantity);
      });

      Object.keys(next).forEach((productId) => {
        const stillExists = items.some(
          (item) => item.product.id === Number(productId)
        );

        if (!stillExists) {
          delete next[productId];
        }
      });

      return next;
    });
  }, [items]);

  const handleSubmit = async () => {
    setError('');

    if (!session) {
      setError('Please log in to submit a quotation.');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (cartMode === 'editing' && editingQuotationId) {
        await updateQuotation({
          quotationId: editingQuotationId,
          shopOwnerId,
          items,
        });

        clearCart();

        navigate(
          getTenantPath(`/quotation/${editingQuotationId}`)
        );
      } else {
        // 'new' or 'reorder' both create a brand new quotation
        const { quotation } = await createQuotation({
          shopOwnerId,
          customerId: session.user.id,
          customerEmail: session.user.email,
          items,
        });

        clearCart();

        navigate(
          getTenantPath(`/quotation/${quotation.id}`)
        );
      }
    } catch (err) {
      setError(
        err.message ||
          'Failed to submit quotation. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonLabel =
    cartMode === 'editing'
      ? 'Update Quotation'
      : 'Submit Quotation';

  if (items.length === 0) {
    return (
      <section className="page-card">
        <p className="eyebrow">Cart</p>
        <h1>Your cart is empty</h1>

        <p>
          <Link
            className="text-link"
            to={getTenantPath('/products')}
          >
            Browse products
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="page-card">
      <p className="eyebrow">Cart</p>

      <h1>
        {cartMode === 'editing'
          ? 'Editing your quotation'
          : 'Review your quote'}
      </h1>

      <Link
        to={getTenantPath('/products')}
        className="header-button primary"
        style={{
          display: 'inline-block',
          marginBottom: '1.5rem',
        }}
      >
        + Add More Products
      </Link>

      {groupedCart.map((group) => (
        <div
          key={group.itemCode}
          style={{ marginBottom: '2rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            {group.imageUrl ? (
              <img
                src={group.imageUrl}
                alt={group.name}
                onClick={() =>
                  setPreviewImage(group.imageUrl)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault();
                    setPreviewImage(group.imageUrl);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Preview image for ${group.name}`}
                style={{
                  width: '48px',
                  height: '48px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '6px',
                }}
              />
            )}

            <h3 style={{ margin: 0 }}>
              {group.name}{' '}
              <small style={{ color: '#64748b' }}>
                ({group.itemCode})
              </small>
            </h3>
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid #e2e8f0',
                  textAlign: 'left',
                }}
              >
                <th>Color</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {group.variants.map((item) => (
                <tr
                  key={item.product.id}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <td>
                    {item.product.color || 'Default'}
                  </td>

                  <td>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          if (item.quantity <= 0) {
                            return;
                          }

                          updateQuantity(
                            item.product.id,
                            item.quantity - 1
                          );
                        }}
                        style={{
                          minWidth: '26px',
                          padding: '0.15rem 0.4rem',
                        }}
                        aria-label={`Decrease quantity for ${item.product.name}`}
                      >
                        −
                      </button>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          draftQuantities[item.product.id] ??
                          String(item.quantity)
                        }
                        onChange={(event) => {
                          const nextValueText =
                            event.target.value;

                          setDraftQuantities((current) => ({
                            ...current,
                            [item.product.id]:
                              nextValueText,
                          }));

                          if (nextValueText === '') {
                            return;
                          }

                          const nextValue =
                            Number(nextValueText);

                          if (
                            !Number.isFinite(nextValue) ||
                            nextValue < 0
                          ) {
                            return;
                          }

                          updateQuantity(
                            item.product.id,
                            nextValue
                          );
                        }}
                        onBlur={() => {
                          const currentValue =
                            draftQuantities[item.product.id] ??
                            String(item.quantity);

                          const cleaned =
                            currentValue === ''
                              ? String(item.quantity)
                              : currentValue;

                          setDraftQuantities((current) => ({
                            ...current,
                            [item.product.id]: cleaned,
                          }));
                        }}
                        style={{
                          width: '60px',
                          textAlign: 'center',
                        }}
                      />

                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity + 1
                          )
                        }
                        style={{
                          minWidth: '26px',
                          padding: '0.15rem 0.4rem',
                        }}
                        aria-label={`Increase quantity for ${item.product.name}`}
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td>
                    {formatCurrency(item.product.price)}

                    {item.product.unit ? (
                      <span
                        style={{
                          marginLeft: '0.2rem',
                          color: '#64748b',
                        }}
                      >
                        /{item.product.unit}
                      </span>
                    ) : null}
                  </td>

                  <td>
                    {formatCurrency(
                      item.quantity * item.product.price
                    )}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        removeFromCart(item.product.id)
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {error && (
        <p className="form-message error-message">
          {error}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '2px solid #e2e8f0',
        }}
      >
        <h2>
          Grand Total: {formatCurrency(totalAmount)}
        </h2>

        <button
          type="button"
          className="header-button primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Submitting...'
            : buttonLabel}
        </button>
      </div>

      {previewImage && (
        <div
          className="image-preview-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="image-preview-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <img
              src={previewImage}
              alt="Product preview"
              style={{
                width: '100%',
                maxWidth: '480px',
                borderRadius: '14px',
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default CartPage;