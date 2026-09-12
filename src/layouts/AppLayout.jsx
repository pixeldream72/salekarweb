import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useTenant } from '../contexts/TenantContext.jsx';
import ShopNotFoundPage from '../pages/ShopNotFoundPage.jsx';

function AppLayout() {
  const tenant = useTenant();
  const location = useLocation();

  const isInvalidShopRoute = /^\/shop(?:\/|$)/i.test(location.pathname || '') && !tenant?.shopOwnerId;

  if (tenant?.isLoading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="page-shell">
          <section className="page-card">
            <p className="eyebrow">Loading</p>
            <h1>Loading tenant</h1>
            <p>{tenant.loadingMessage || 'Resolving business information...'}</p>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (isInvalidShopRoute || tenant?.isInvalidTenant) {
    return (
      <div className="app-shell">
        <Header />
        <main className="page-shell">
          <ShopNotFoundPage shopOwnerId={location.pathname.split('/shop/')[1] || ''} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page-shell">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default AppLayout;
