import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/index.js';
import { loadUserProfile } from './store/authSlice.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import api from './services/api.js';

// Component Imports
import Navbar from './components/Navbar.jsx';
import FloatingCartBar from './components/FloatingCartBar.jsx';
import BottomNav from './components/BottomNav.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import BrandedLoader from './components/BrandedLoader.jsx';
import StoreClosedScreen from './components/StoreClosedScreen.jsx';
import NotificationPermissionPrompt from './components/NotificationPermissionPrompt.jsx';

// Page Imports
import NewLandingPage from './pages/NewLandingPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductResultsPage from './pages/ProductResultsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import OrderTrackingPage from './pages/OrderTrackingPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PrintoutsPage from './pages/PrintoutsPage.jsx';
import useGeoLocation from './hooks/useGeoLocation.js';

import OfflineBanner from './components/OfflineBanner.jsx';
import PWAInstallBanner from './components/PWAInstallBanner.jsx';
import { initSocket, disconnectSocket, subscribeToSocketEvents } from './services/socketService.js';

function AppContent() {
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);
  const loading = useSelector(state => state.auth.loading);
  const user = useSelector(state => state.auth.user);

  const [storeStatus, setStoreStatus] = useState(null);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // Activate Geolocation tracking
  useGeoLocation();

  const fetchStoreStatus = async () => {
    try {
      const res = await api.get('/api/store/status');
      if (res.data.success) {
        setStoreStatus(res.data.store);
      }
    } catch (err) {
      console.error('Failed to fetch store status');
    }
  };

  useEffect(() => {
    fetchStoreStatus();
    const interval = setInterval(fetchStoreStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Socket initialization and live store status listener
  useEffect(() => {
    if (user && token) {
      initSocket(user, token);
    }
    const unsubscribe = subscribeToSocketEvents((eventName, data) => {
      if (eventName === 'storeStatusUpdated' && data) {
        setStoreStatus(data);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [user, token]);

  // Load profile on start if token exists
  useEffect(() => {
    if (token) {
      dispatch(loadUserProfile(token));
    }
  }, [token, dispatch]);

  if (loading && token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
        <BrandedLoader message="Initializing session..." />
      </div>
    );
  }

  const isStoreClosed = storeStatus && storeStatus.isOpen === false && user?.role !== 'admin';

  return (
    <>
      <OfflineBanner />
      <div
        className={`flex flex-col min-h-screen bg-[var(--sys-background)] text-[var(--sys-text-primary)] font-sans antialiased transition-colors`}
      >
        {!isLandingPage && <Navbar />}
        <main className={isLandingPage ? "w-full" : "flex-grow container mx-auto px-4 py-6 max-w-7xl pt-safe"}>
          <NotificationPermissionPrompt />
          {isStoreClosed ? (
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="*" element={<StoreClosedScreen store={storeStatus} onRefresh={fetchStoreStatus} />} />
            </Routes>
          ) : (
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<NewLandingPage />} />
              <Route path="/app" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/app/products" element={<ProductResultsPage />} />

              {/* Protected Multi-Role Dashboard */}
              <Route
                path="/app/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Customer Routes */}
              <Route
                path="/app/cart"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/printouts"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <PrintoutsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/checkout"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/payment"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected General User Routes */}
              <Route
                path="/app/tracking/:orderId"
                element={
                  <ProtectedRoute>
                    <OrderTrackingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Dedicated Routes */}
              <Route
                path="/app/admin/orders"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminOrdersPage />
                  </ProtectedRoute>
                }
              />

              {/* Legacy Fallback Redirects */}
              <Route path="/admin" element={<Navigate to="/app/admin/orders" replace />} />
              <Route path="/app/admin" element={<Navigate to="/app/admin/orders" replace />} />
              <Route path="/agent" element={<Navigate to="/app/dashboard" replace />} />

              {/* 404 Catch All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          )}
        </main>

        {!isStoreClosed && !isLandingPage && <FloatingCartBar />}
        {!isLandingPage && <BottomNav />}
        {!isLandingPage && <PWAInstallBanner />}
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
            fontWeight: '600',
            fontSize: '13px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            color: '#0F172A',
            background: '#FFFFFF',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'
          }
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </Provider>
  );
}
