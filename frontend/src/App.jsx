import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, FileText, X } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
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

const showCustomOrderToast = (order, navigate) => {
  const isPrint = order.orderType === 'Printout';
  const displayId = order.customId || `LPR-${order.orderId.slice(-6).toUpperCase()}`;

  toast.custom((t) => (
    <div
      onClick={() => {
        toast.dismiss(t.id);
        navigate(`/admin/orders?tab=orders&search=${order.orderId}`);
      }}
      className={`${t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer p-4 transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="flex-1 w-0">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {isPrint ? (
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center">
                <FileText size={20} />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#40A2E3]/10 text-[#40A2E3] flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {isPrint ? '📄 New Print Order' : '🛒 New Order Received'}
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              Order #{displayId.replace('LPR-', '')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Customer: <span className="font-extrabold text-slate-700 dark:text-slate-350">{order.customerName}</span>
            </p>
            {isPrint && order.pages > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {order.pages} Pages
              </p>
            )}
            <p className="text-xs font-black text-[#40A2E3] mt-1 font-mono">
              ₹{order.total ? Number(order.total).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-slate-200 dark:border-slate-800 ml-4 pl-4 items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  ), { duration: 8000 });
};

const addOrderNotificationToLocalStorage = (newNotification) => {
  try {
    const stored = localStorage.getItem('admin_notifications');
    let notifications = stored ? JSON.parse(stored) : [];

    // Add new notification at the beginning
    notifications.unshift({
      ...newNotification,
      id: newNotification.orderId || Date.now().toString(),
      unread: true
    });

    // Limit to 20
    if (notifications.length > 20) {
      notifications = notifications.slice(0, 20);
    }

    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
    // Dispatch a custom event so the AdminOrdersPage can update immediately
    window.dispatchEvent(new CustomEvent('admin-notifications-updated'));
  } catch (err) {
    console.error('Error saving notification:', err);
  }
};

function AppContent() {
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);
  const loading = useSelector(state => state.auth.loading);
  const user = useSelector(state => state.auth.user);
  const navigate = useNavigate();

  const [storeStatus, setStoreStatus] = useState(null);

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
    const isAdmin = user?.role === 'admin';
    const unsubscribe = subscribeToSocketEvents((eventName, data) => {
      if (eventName === 'storeStatusUpdated' && data) {
        setStoreStatus(data);
      }
      if (eventName === 'newOrder' && isAdmin) {
        showCustomOrderToast(data, navigate);
        addOrderNotificationToLocalStorage(data);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [user, token, navigate]);

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
        className="
    flex
    flex-col
    min-h-screen
    bg-[var(--sys-background)]
    text-[var(--sys-text-primary)]
    font-sans
    antialiased
    transition-colors
  "
      >
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl pt-safe">
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
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/products" element={<ProductResultsPage />} />

              {/* Protected Multi-Role Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Customer Routes */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/printouts"
                element={
                  <ProtectedRoute>
                    <PrintoutsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />


              {/* Protected General User Routes */}
              <Route
                path="/tracking/:orderId"
                element={
                  <ProtectedRoute>
                    <OrderTrackingPage />
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

              {/* Admin Dedicated Routes */}
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminOrdersPage />
                  </ProtectedRoute>
                }
              />

              {/* Legacy Fallback Redirects */}
              <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
              <Route path="/agent" element={<Navigate to="/dashboard" replace />} />

              {/* 404 Catch All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          )}
        </main>

        {!isStoreClosed && <FloatingCartBar />}
        <BottomNav />
        <PWAInstallBanner />
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
