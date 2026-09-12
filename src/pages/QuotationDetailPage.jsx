import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { acceptQuotation, fetchQuotationById, rejectQuotation } from '../services/supabaseService.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function QuotationDetailPage() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadQuote = async () => {
      const result = await fetchQuotationById(id);

      if (!isMounted) {
        return;
      }

      setQuote(result.data);
    };

    void loadQuote();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAccept = async () => {
    if (!id) {
      return;
    }

    setIsSubmitting(true);

    try {
      await acceptQuotation(id);
      const result = await fetchQuotationById(id);
      setQuote(result.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!id) {
      return;
    }

    setIsSubmitting(true);

    try {
      await rejectQuotation(id);
      const result = await fetchQuotationById(id);
      setQuote(result.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quote) {
    return (
      <section className="page-card">
        <p className="eyebrow">Quotation</p>
        <h1>Loading...</h1>
      </section>
    );
  }

  const total = Array.isArray(quote.items)
    ? quote.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)
    : Number(quote.total || 0);

  return (
    <section className="page-card">
      <p className="eyebrow">Quotation</p>
      <h1>{quote.id}</h1>
      <p>
        This quotation is loaded from the SaleKar quotation source when available, and otherwise falls back to
        the existing order-based demo data.
      </p>

      <div className="quote-header-row">
        <span className={`status-badge ${quote.status}`}>{quote.status}</span>
        <Link className="text-link" to="/my-quotations">
          Back to quotations
        </Link>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <h3>Customer</h3>
          <p><strong>{quote.customerName}</strong></p>
          <p>Order type: {quote.orderType}</p>
          <p>Created: {formatDate(quote.createdAt)}</p>
          <p>Updated: {formatDate(quote.updatedAt)}</p>
        </div>

        <div className="info-card">
          <h3>Summary</h3>
          <p>Items: {Array.isArray(quote.items) ? quote.items.length : 0}</p>
          <p>Total: {formatCurrency(total)}</p>
          <p>Status: {quote.status}</p>
        </div>
      </div>

      <div className="quote-items-panel">
        <h3>Quotation Items</h3>
        <table className="quote-items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(quote.items) && quote.items.map((item) => (
              <tr key={`${quote.id}-${item.productName}`}>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td>{formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="quote-notes">
        <h3>Notes</h3>
        <p>{quote.notes || 'No notes available.'}</p>
      </div>

      {quote.status === 'pending' && (
        <div className="quote-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="button" className="header-button secondary" disabled={isSubmitting} onClick={handleReject}>
            Reject
          </button>
          <button type="button" className="header-button primary" disabled={isSubmitting} onClick={handleAccept}>
            Accept
          </button>
        </div>
      )}
    </section>
  );
}

export default QuotationDetailPage;
