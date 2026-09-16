import './App.css';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { TenantProvider } from './contexts/TenantContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';

import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
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
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';

import { CartProvider } from './contexts/CartContext.jsx';
import CartPage from './pages/CartPage.jsx';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <CartProvider>
          <Routes>

            <Route element={<AppLayout />}>

              {/* Normal / custom-domain website */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/cart" element={<CartPage />} />

              {/* Tenant URL */}
              <Route path="/shop/:shopOwnerId">
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="auth" element={<AuthPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
                <Route path="cart" element={<CartPage />} />

                <Route
                  path="my-quotations"
                  element={
                    <ProtectedRoute>
                      <MyQuotationsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="quotation/:id"
                  element={
                    <ProtectedRoute>
                      <QuotationDetailPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route path="/shop" element={<ShopNotFoundPage />} />

              <Route path="*" element={<NotFoundPage />} />

            </Route>

          </Routes>
        </CartProvider>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;