import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchQuotationById } from '../services/supabaseService.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useTenantPath } from '../hooks/useTenantPath.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(Number(value)));
}

function QuotationDetailPage() {
  const { getTenantPath } = useTenantPath();
  const { id } = useParams();
  const { session } = useAuth();
  const { loadQuotationForEditing, loadQuotationForReorder } = useCart();
  const navigate = useNavigate();
  const customerId = session?.user?.id;
 

  const [quote, setQuote] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadQuote = async () => {
      const result = await fetchQuotationById(id, customerId);
      if (!isMounted) return;
      setQuote(result.data);
    };

    void loadQuote();

    return () => {
      isMounted = false;
    };
  }, [id, customerId]);

  if (!quote) {
    return (
      <section className="page-card">
        <p className="eyebrow">Quotation</p>
        <h1>Loading...</h1>
      </section>
    );
  }

  const isPending = quote.status === 'pending';

  const handleEditInCart = () => {
    loadQuotationForEditing(quote.id, quote.items, quote.remarks);
    navigate(getTenantPath('/cart'));
  };

  const handleReorder = () => {
    loadQuotationForReorder(quote.items);
    navigate(getTenantPath('/cart'));
  };

  return (
    <section className="page-card">
      <p className="eyebrow">Quotation</p>
      <h1>{quote.quotation_no || quote.id}</h1>

      <div className="quote-header-row">
        <span className={`status-badge ${quote.status}`}>{quote.status}</span>
        <Link className="text-link" to={getTenantPath('/my-quotations')}>
          Back to quotations
        </Link>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <h3>Customer</h3>
          <p><strong>{quote.customer_name}</strong></p>
          <p>Created: {formatDate(quote.created_date)}</p>
        </div>

        <div className="info-card">
          <h3>Summary</h3>
          <p>Items: {quote.items.length}</p>
          <p>Total: {formatCurrency(quote.total_amount)}</p>
          <p>Status: {quote.status}</p>
        </div>
      </div>

      <div className="quote-items-panel">
        <h3>Quotation Items</h3>
        <table className="quote-items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Color</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, index) => (
              <tr key={`${quote.id}-${item.product_id}-${index}`}>
                <td>{item.name}</td>
                <td>{item.color}</td>
                <td>{item.qty}</td>
                <td>
                  {formatCurrency(item.rate)}
                  {item.unit ? <span style={{ marginLeft: '0.2rem', color: '#64748b' }}>/{item.unit}</span> : null}
                </td>
                <td>{formatCurrency(item.qty * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="quote-notes">
        <h3>Remarks</h3>
        <p>{quote.remarks || 'No remarks.'}</p>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {isPending ? (
          <button type="button" className="header-button primary" onClick={handleEditInCart}>
            Edit in Cart
          </button>
        ) : (
          <button type="button" className="header-button primary" onClick={handleReorder}>
            Order Again
          </button>
        )}
      </div>
    </section>
  );
}

export default QuotationDetailPage;