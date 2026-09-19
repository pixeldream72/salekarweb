import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuotations } from '../services/supabaseService.js';
import { useAuth , } from '../contexts/AuthContext.jsx';
import { useTenantPath } from '../hooks/useTenantPath.js';
import { useTenant } from '../contexts/TenantContext.jsx';

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
  }).format(new Date(Number(value)));
}

function MyQuotationsPage() {
  const { session } = useAuth();
  const { getTenantPath } = useTenantPath();
    const tenant = useTenant();
   const {shopOwnerId} = tenant;
  const customerId = session?.user?.id;


  const [quotations, setQuotations] = useState([]);
  const [source, setSource] = useState('loading');

  useEffect(() => {
    let isMounted = true;

    const loadQuotations = async () => {
      const result = await fetchQuotations(customerId,shopOwnerId);

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
  }, [customerId,shopOwnerId]);

  return (
    <section className="page-card">
      <p className="eyebrow">My Quotations</p>
      <h1>Quotations</h1>

      <div className="quotation-list">
        {quotations.length > 0 ? (
          quotations.map((quotation) => (
            <article
              key={quotation.id}
              className="quotation-card"
            >
              <div className="quotation-header">
                <div>
                  <span className="quotation-id">
                    {quotation.quotation_no || quotation.id}
                  </span>

                  <h2>{quotation.customer_name}</h2>
                </div>

                <span
                  className={`status-badge ${quotation.status}`}
                >
                  {quotation.status}
                </span>
              </div>

              <div className="quotation-meta">
                <span>
                  Created: {formatDate(quotation.created_date)}
                </span>
              </div>

              <div className="quotation-summary">
                <strong>
                  {formatCurrency(quotation.total_amount || 0)}
                </strong>
              </div>

              <Link
                className="text-link"
                to={getTenantPath(`/quotation/${quotation.id}`)}
              >
                View quotation
              </Link>
            </article>
          ))
        ) : (
          <p>You have no quotations yet.</p>
        )}
      </div>
    </section>
  );
}

export default MyQuotationsPage;