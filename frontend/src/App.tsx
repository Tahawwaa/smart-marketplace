import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { NotFoundPage } from './app/not-found-page'
import { RequireAuth } from './components/layout/require-auth'
import { AuthProvider } from './features/auth/auth-provider'
import { LoginPage } from './features/auth/login-page'
import { RegisterPage } from './features/auth/register-page'
import { CartProvider } from './features/cart/cart-provider'
import { CartPage } from './features/cart/cart-page'
import { HomePage } from './features/home/home-page'
import { OrderDetailPage } from './features/orders/order-detail-page'
import { OrdersPage } from './features/orders/orders-page'
import { CheckoutPage } from './features/orders/checkout-page'
import { ProductDetailPage } from './features/products/product-detail-page'
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
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
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
