import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuotations } from '../services/supabaseService.js';

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

function MyQuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [source, setSource] = useState('loading');

  useEffect(() => {
    let isMounted = true;

    const loadQuotations = async () => {
      const result = await fetchQuotations('');

      if (!isMounted) {
        return;
      }

      setQuotations(result.data || []);
      setSource(result.source || 'private');
    };

    void loadQuotations();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="page-card">
      <p className="eyebrow">My Quotations</p>
      <h1>Quotations</h1>
      <p>
        Quotation history is private and requires an authenticated customer session. Public tenant pages do not expose order or quotation records.
      </p>
      <p>{source === 'private' ? 'Private quotation data is not available on this public storefront view.' : 'Quotation data unavailable.'}</p>

      <div className="quotation-list">
        {quotations.length > 0 ? quotations.map((quotation) => (
          <article key={quotation.id} className="quotation-card">
            <div className="quotation-header">
              <div>
                <span className="quotation-id">{quotation.id}</span>
                <h2>{quotation.customerName}</h2>
              </div>
              <span className={`status-badge ${quotation.status}`}>{quotation.status}</span>
            </div>

            <div className="quotation-meta">
              <span>Created: {formatDate(quotation.createdAt)}</span>
              <span>Updated: {formatDate(quotation.updatedAt)}</span>
            </div>

            <div className="quotation-summary">
              <strong>{Array.isArray(quotation.items) ? quotation.items.length : 0} items</strong>
              <strong>{formatCurrency(quotation.total || 0)}</strong>
            </div>

            <Link className="text-link" to={`/quotation/${quotation.id}`}>
              View quotation
            </Link>
          </article>
        )) : (
          <p>No private quotation data is available from this public storefront view.</p>
        )}
      </div>
    </section>
  );
}

export default MyQuotationsPage;
