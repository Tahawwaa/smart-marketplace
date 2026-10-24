import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAdmin } from './components/layout/require-admin'
import { RequireAuth } from './components/layout/require-auth'
import { RequireVendor } from './components/layout/require-vendor'
import { AuthProvider } from './features/auth/auth-provider'
import { CartProvider } from './features/cart/cart-provider'
import { HomePage } from './features/home/home-page'
import { MarketplaceLayout } from './layouts/marketplace-layout'

const NotFoundPage = lazy(() => import('./app/not-found-page').then((module) => ({ default: module.NotFoundPage })))
const AccountAddressesPage = lazy(() => import('./features/account/account-addresses-page').then((module) => ({ default: module.AccountAddressesPage })))
const AccountLayout = lazy(() => import('./features/account/account-layout').then((module) => ({ default: module.AccountLayout })))
const AccountOverviewPage = lazy(() => import('./features/account/account-overview-page').then((module) => ({ default: module.AccountOverviewPage })))
const AccountPasswordPage = lazy(() => import('./features/account/account-password-page').then((module) => ({ default: module.AccountPasswordPage })))
const AccountStorePage = lazy(() => import('./features/account/account-store-page').then((module) => ({ default: module.AccountStorePage })))
const AdminBrandsPage = lazy(() => import('./features/admin/admin-brands-page').then((module) => ({ default: module.AdminBrandsPage })))
const AdminCategoriesPage = lazy(() => import('./features/admin/admin-categories-page').then((module) => ({ default: module.AdminCategoriesPage })))
const AdminDashboardPage = lazy(() => import('./features/admin/admin-dashboard-page').then((module) => ({ default: module.AdminDashboardPage })))
const AdminLayout = lazy(() => import('./features/admin/admin-layout').then((module) => ({ default: module.AdminLayout })))
const AdminOrdersPage = lazy(() => import('./features/admin/admin-orders-page').then((module) => ({ default: module.AdminOrdersPage })))
const AdminProductsPage = lazy(() => import('./features/admin/admin-products-page').then((module) => ({ default: module.AdminProductsPage })))
const AdminUsersPage = lazy(() => import('./features/admin/admin-users-page').then((module) => ({ default: module.AdminUsersPage })))
const AdminVendorsPage = lazy(() => import('./features/admin/admin-vendors-page').then((module) => ({ default: module.AdminVendorsPage })))
const LoginPage = lazy(() => import('./features/auth/login-page').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./features/auth/register-page').then((module) => ({ default: module.RegisterPage })))
const CartPage = lazy(() => import('./features/cart/cart-page').then((module) => ({ default: module.CartPage })))
const OrderDetailPage = lazy(() => import('./features/orders/order-detail-page').then((module) => ({ default: module.OrderDetailPage })))
const OrdersPage = lazy(() => import('./features/orders/orders-page').then((module) => ({ default: module.OrdersPage })))
const CheckoutPage = lazy(() => import('./features/orders/checkout-page').then((module) => ({ default: module.CheckoutPage })))
const PaymentPage = lazy(() => import('./features/payments/payment-page').then((module) => ({ default: module.PaymentPage })))
const ProductDetailPage = lazy(() => import('./features/products/product-detail-page').then((module) => ({ default: module.ProductDetailPage })))
const VendorDashboardPage = lazy(() => import('./features/vendor/vendor-dashboard-page').then((module) => ({ default: module.VendorDashboardPage })))
const VendorAnalyticsPage = lazy(() => import('./features/vendor/vendor-analytics-page').then((module) => ({ default: module.VendorAnalyticsPage })))
const VendorInventoryPage = lazy(() => import('./features/vendor/vendor-inventory-page').then((module) => ({ default: module.VendorInventoryPage })))
const VendorLayout = lazy(() => import('./features/vendor/vendor-layout').then((module) => ({ default: module.VendorLayout })))
const VendorOrdersPage = lazy(() => import('./features/vendor/vendor-orders-page').then((module) => ({ default: module.VendorOrdersPage })))
const VendorProductFormPage = lazy(() => import('./features/vendor/vendor-product-form-page').then((module) => ({ default: module.VendorProductFormPage })))
const VendorProductsPage = lazy(() => import('./features/vendor/vendor-products-page').then((module) => ({ default: module.VendorProductsPage })))

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={<p className="px-4 py-16 text-center text-sm text-fg-muted">در حال بارگذاری…</p>}>
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
                    <Route path="analytics" element={<VendorAnalyticsPage />} />
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
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
