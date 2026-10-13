import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { NotFoundPage } from './app/not-found-page'
import { RequireAdmin } from './components/layout/require-admin'
import { RequireAuth } from './components/layout/require-auth'
import { RequireVendor } from './components/layout/require-vendor'
import { AccountAddressesPage } from './features/account/account-addresses-page'
import { AccountLayout } from './features/account/account-layout'
import { AccountOverviewPage } from './features/account/account-overview-page'
import { AccountPasswordPage } from './features/account/account-password-page'
import { AccountStorePage } from './features/account/account-store-page'
import { AdminBrandsPage } from './features/admin/admin-brands-page'
import { AdminCategoriesPage } from './features/admin/admin-categories-page'
import { AdminDashboardPage } from './features/admin/admin-dashboard-page'
import { AdminLayout } from './features/admin/admin-layout'
import { AdminOrdersPage } from './features/admin/admin-orders-page'
import { AdminProductsPage } from './features/admin/admin-products-page'
import { AdminUsersPage } from './features/admin/admin-users-page'
import { AdminVendorsPage } from './features/admin/admin-vendors-page'
import { AuthProvider } from './features/auth/auth-provider'
import { LoginPage } from './features/auth/login-page'
import { RegisterPage } from './features/auth/register-page'
import { CartProvider } from './features/cart/cart-provider'
import { CartPage } from './features/cart/cart-page'
import { HomePage } from './features/home/home-page'
import { OrderDetailPage } from './features/orders/order-detail-page'
import { OrdersPage } from './features/orders/orders-page'
import { CheckoutPage } from './features/orders/checkout-page'
import { PaymentPage } from './features/payments/payment-page'
import { ProductDetailPage } from './features/products/product-detail-page'
import { VendorDashboardPage } from './features/vendor/vendor-dashboard-page'
import { VendorInventoryPage } from './features/vendor/vendor-inventory-page'
import { VendorLayout } from './features/vendor/vendor-layout'
import { VendorOrdersPage } from './features/vendor/vendor-orders-page'
import { VendorProductFormPage } from './features/vendor/vendor-product-form-page'
import { VendorProductsPage } from './features/vendor/vendor-products-page'
import { MarketplaceLayout } from './layouts/marketplace-layout'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<MarketplaceLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<HomePage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<RequireAuth />}>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/account" element={<AccountLayout />}>
                  <Route index element={<AccountOverviewPage />} />
                  <Route path="orders" element={<OrdersPage embedded />} />
                  <Route path="addresses" element={<AccountAddressesPage />} />
                  <Route path="password" element={<AccountPasswordPage />} />
                  <Route path="store" element={<AccountStorePage />} />
                </Route>
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/orders/:orderId/pay" element={<PaymentPage />} />
                <Route element={<RequireVendor />}>
                  <Route path="/vendor" element={<VendorLayout />}>
                    <Route index element={<VendorDashboardPage />} />
                    <Route path="products" element={<VendorProductsPage />} />
                    <Route path="products/new" element={<VendorProductFormPage />} />
                    <Route path="products/:id/edit" element={<VendorProductFormPage />} />
                    <Route path="inventory" element={<VendorInventoryPage />} />
                    <Route path="orders" element={<VendorOrdersPage />} />
                  </Route>
                </Route>
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="vendors" element={<AdminVendorsPage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="categories" element={<AdminCategoriesPage />} />
                    <Route path="brands" element={<AdminBrandsPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
