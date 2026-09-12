import './App.css';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { TenantProvider } from './contexts/TenantContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import MyQuotationsPage from './pages/MyQuotationsPage.jsx';
import QuotationDetailPage from './pages/QuotationDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ShopNotFoundPage from './pages/ShopNotFoundPage.jsx';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop/:shopOwnerId" element={<HomePage />} />
            <Route path="/shop" element={<ShopNotFoundPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/my-quotations"
              element={
                <ProtectedRoute>
                  <MyQuotationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotation/:id"
              element={
                <ProtectedRoute>
                  <QuotationDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;