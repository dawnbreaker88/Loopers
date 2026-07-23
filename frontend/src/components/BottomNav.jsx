import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, Search, ShoppingCart, User, ShoppingBag, Package, Store, BarChart3 } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});
  const cartItems = useSelector((state) => state.cart?.items || []);
  const [failedImages, setFailedImages] = useState({});

  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  const isAdmin = isAuthenticated && user?.role === 'admin';
  const cartItemsCount = Array.isArray(cartItems)
    ? cartItems.reduce((total, item) => total + (Number(item?.quantity) || 0), 0)
    : 0;

  const handleImgError = (key) => {
    setFailedImages((prev) => ({ ...prev, [key]: true }));
  };

  const adminNavItems = [
    { label: 'Orders', path: '/app/admin/orders?tab=orders', tab: 'orders', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3500/3500833.png', fallbackIcon: ShoppingBag },
    { label: 'Products', path: '/app/admin/orders?tab=products', tab: 'products', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2897/2897785.png', fallbackIcon: Package },
    { label: 'Store & Profile', path: '/app/admin/orders?tab=store_profile', tab: 'store_profile', iconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869636.png', fallbackIcon: Store },
    { label: 'Analytics', path: '/app/admin/orders?tab=analytics', tab: 'analytics', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3588/3588658.png', fallbackIcon: BarChart3 }
  ];

  const customerNavItems = [
    { label: 'Home', path: '/app', iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png', fallbackIcon: Home },
    { label: 'Search', path: '/app/products', iconUrl: 'https://cdn-icons-png.flaticon.com/512/954/954591.png', fallbackIcon: Search },
    { label: 'Cart', path: isAuthenticated ? '/app/cart' : '/login', iconUrl: 'https://img.icons8.com/fluency/96/shopping-cart.png', fallbackIcon: ShoppingCart, badge: cartItemsCount },
    { label: 'Profile', path: isAuthenticated ? '/app/profile' : '/login', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png', fallbackIcon: User }
  ];

  if (isAdmin) {
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'orders';

    return (
      <nav aria-label="Admin Navigation" className="fixed bottom-0 left-0 right-0 z-30 bg-sys-surface border-t border-sys-border px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {adminNavItems.map((item) => {
            const isActive = location.pathname.startsWith('/app/admin/orders') && activeTab === item.tab;
            const FallbackIcon = item.fallbackIcon;
            const hasFailed = failedImages[item.label];

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                className={`flex flex-col items-center py-1 px-3 min-w-[56px] rounded-xl transition-all ${
                  isActive ? 'text-[#40A2E3] font-black scale-105' : 'text-sys-text-secondary font-semibold hover:text-sys-text-primary'
                }`}
              >
                {!hasFailed ? (
                  <img
                    src={item.iconUrl}
                    alt={item.label}
                    onError={() => handleImgError(item.label)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 object-contain transition-transform duration-200 ${
                      isActive ? 'scale-110 drop-shadow-xs' : 'opacity-70 grayscale-[25%] hover:opacity-100'
                    }`}
                  />
                ) : (
                  <FallbackIcon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                )}
                <span className="text-[10px] mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Bottom Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-sys-surface border-t border-sys-border px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {customerNavItems.map((item) => {
          const isActive = item.path === '/app' ? location.pathname === '/app' : (location.pathname === item.path || location.pathname.startsWith(item.path));
          const FallbackIcon = item.fallbackIcon;
          const hasFailed = failedImages[item.label];

          return (
            <NavLink
              key={item.label}
              to={item.path}
              aria-label={item.label}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-[#40A2E3] font-black scale-105' : 'text-sys-text-secondary font-semibold hover:text-sys-text-primary'
              }`}
            >
              <div className="relative">
                {!hasFailed ? (
                  <img
                    src={item.iconUrl}
                    alt={item.label}
                    onError={() => handleImgError(item.label)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 object-contain transition-transform duration-200 ${
                      isActive ? 'scale-110 drop-shadow-xs' : 'opacity-70 grayscale-[25%] hover:opacity-100'
                    }`}
                  />
                ) : (
                  <FallbackIcon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                )}
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#EF4444] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-[#0F172A] shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
