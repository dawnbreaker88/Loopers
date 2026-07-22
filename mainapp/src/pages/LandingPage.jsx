import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/productSlice.js';
import { fetchCart } from '../store/cartSlice.js';
import { loginSuccess } from '../store/authSlice.js';
import ProductCard from '../components/ProductCard.jsx';
import LocationPromptBanner from '../components/LocationPromptBanner.jsx';
import OfflineView from '../components/OfflineView.jsx';
import api from '../services/api.js';
import { Search, ChevronRight, Zap, Gift, Sparkles, Compass, MapPin, ChevronDown, CheckCircle2, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products, loading: productsLoading } = useSelector((state) => state.products);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [activeBanner, setActiveBanner] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Dynamic CMS Data
  const [banners, setBanners] = useState([]);
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cmLoading, setCmLoading] = useState(true);

  // Address Selector Modal State
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Fallback Promotional banners if database is empty
  const fallbackBanners = [
    {
      _id: '1',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&h=500&q=80',
      altText: 'Late Night Study Munchies',
      redirectType: 'category',
      redirectTarget: 'Fast Food'
    },
    {
      _id: '2',
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=1200&h=500&q=80',
      altText: 'Weekend Combo Deals',
      redirectType: 'category',
      redirectTarget: 'Snacks'
    }
  ];

  // Helper check for printout category
  const isPrintoutCategory = (name) => {
    if (!name) return false;
    const n = String(name).toLowerCase().trim();
    return n === 'printouts' || n === 'printout' || n.includes('print');
  };

  // Fetch Banners, Sections, and Categories on mount
  const fetchCMSData = async () => {
    try {
      const [bannersRes, sectionsRes, categoriesRes] = await Promise.all([
        api.get('/api/banners'),
        api.get('/api/sections'),
        api.get('/api/categories') // Fetches active categories only
      ]);

      if (bannersRes.data.success) {
        setBanners(bannersRes.data.banners || []);
      }
      if (sectionsRes.data.success) {
        setSections(sectionsRes.data.sections || []);
      }
      if (categoriesRes.data.success) {
        let cats = categoriesRes.data.categories || [];
        const hasPrintout = cats.some((c) => isPrintoutCategory(c.name));
        if (!hasPrintout) {
          cats.push({
            _id: 'printouts-static',
            name: 'Printouts',
            description: 'Document printing service',
            icon: 'https://cdn-icons-png.flaticon.com/512/1041/1041975.png',
            isActive: true
          });
        }
        setCategories(cats);
      }
    } catch (err) {
      console.warn('Unable to load dynamic content or categories');
      setCategories([
        { _id: '1', name: 'Snacks', icon: 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png' },
        { _id: '2', name: 'Beverages', icon: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png' },
        { _id: '3', name: 'Printouts', description: 'Document printing service', icon: 'https://cdn-icons-png.flaticon.com/512/1041/1041975.png' }
      ]);
    } finally {
      setCmLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchProducts({}));
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
    fetchCMSData();
  }, [dispatch, isAuthenticated]);

  const activeBannersList = banners.length > 0 ? banners : fallbackBanners;

  // Auto scroll banners every 5 seconds
  useEffect(() => {
    if (activeBannersList.length === 0) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % activeBannersList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBannersList.length]);

  // Touch Swipe Handlers for Banners
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      setActiveBanner((prev) => (prev + 1) % activeBannersList.length);
    }
    if (touchEndX.current - touchStartX.current > 50) {
      setActiveBanner((prev) => (prev - 1 + activeBannersList.length) % activeBannersList.length);
    }
  };

  // Compact Address Display rule helper
  const getCompactAddress = () => {
    if (!isAuthenticated || !user) return 'Set delivery location';
    const defaultAddress = user.addresses?.find((addr) => addr.isDefault) || user.addresses?.[0];
    if (!defaultAddress) return 'Add delivery address...';
    // Display only first line / primary location name (e.g. pincode , Room 304)
    return `${defaultAddress.name}, ${defaultAddress.houseNumber || ''}`;
  };

  // Helper gradients for banners
  const handleBannerClick = (b) => {
    const type = b.redirectType || (b.category ? 'category' : 'none');
    const target = b.redirectTarget || b.category || '';

    if (target && target.toLowerCase().includes('print')) {
      navigate('/printouts');
      return;
    }
    if (type === 'category' && target) {
      navigate(`/products?category=${encodeURIComponent(target)}`);
    } else if (type === 'product' && target) {
      navigate(`/products?search=${encodeURIComponent(target)}`);
    } else if (type === 'page' && target) {
      navigate(target);
    } else if (type === 'external' && target) {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  const renderProductSkeleton = () => (
    <div className="flex space-x-3.5 overflow-x-auto pb-4 scrollbar-hide">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="w-40 flex-shrink-0 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-700/80 rounded-2xl p-3 animate-pulse space-y-3">
          <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
        </div>
      ))}
    </div>
  );

    const handleRefetch = () => {
      dispatch(fetchProducts({}));
      if (isAuthenticated) {
        dispatch(fetchCart());
      }
      fetchCMSData();
    };

    const isOfflineAndEmpty = !navigator.onLine && sections.length === 0 && products.length === 0;

    if (isOfflineAndEmpty) {
      return (
        <div className="pb-20">
          <OfflineView onRetry={handleRefetch} />
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-20">

      {/* 2. Delivery Address Selector (Positioned above search bar) */}
      <div className="w-full sm:max-w-md">
        <button
          onClick={() => isAuthenticated ? setAddressModalOpen(true) : navigate('/login')}
          className="w-full flex items-center justify-between text-left text-xs font-semibold text-[#0F172A] dark:text-slate-200 bg-sys-surface hover:bg-sys-surface-hover px-4 py-3 rounded-2xl border border-sys-border transition-all shadow-xs truncate"
        >
          <div className="flex items-center min-w-0 truncate mr-1">
            <MapPin size={16} className="text-[#40A2E3] flex-shrink-0 mr-2" />
            <span className="truncate text-xs font-extrabold uppercase tracking-wide">
              {getCompactAddress()}
            </span>
          </div>
          <ChevronDown size={16} className="text-[#64748B] flex-shrink-0 ml-1" />
        </button>
      </div>

      {/* Location Permission Prompt Banner */}
      <LocationPromptBanner />

      {/* 3. Search Bar (Positioned directly below the address selector) */}
      <div
        onClick={() => navigate('/products')}
        className="relative flex items-center w-full bg-sys-surface hover:bg-sys-surface-hover border border-sys-border rounded-2xl px-4 py-3 cursor-pointer transition-all shadow-xs group"
      >
        <Search size={18} className="text-[#40A2E3] mr-3 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 select-none">
          Search snacks, drinks, stationery, instant noodles...
        </span>
        <span className="ml-auto text-[10px] font-extrabold text-[#40A2E3] bg-[#40A2E3]/10 px-2 py-0.5 rounded-full">
          SEARCH
        </span>
      </div>

      {/* 4. Pure Marketing Creative Promotional Banners */}
      {activeBannersList.length > 0 && (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-[2.4/1] max-h-64 sm:max-h-80 overflow-hidden rounded-3xl border border-sys-border shadow-soft select-none bg-slate-900 group"
        >
          {activeBannersList.map((b, idx) => {
            const isClickable = (b.redirectType && b.redirectType !== 'none') || b.category;
            return (
              <div
                key={b._id || idx}
                onClick={() => handleBannerClick(b)}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${isClickable ? 'cursor-pointer' : 'cursor-default'
                  } ${idx === activeBanner
                    ? 'opacity-100 translate-x-0 scale-100 z-10'
                    : 'opacity-0 translate-x-8 scale-95 z-0'
                  }`}
              >
                <img
                  src={b.image}
                  alt={b.altText || 'Promotional Banner'}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover rounded-3xl"
                />
              </div>
            );
          })}

          {/* Pagination Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-20">
            {activeBannersList.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBanner(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${idx === activeBanner ? 'w-6 bg-white shadow-md' : 'w-1.5 bg-white/50'
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              ></button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Categories Grid (Dynamically fetched from backend database) */}
      {categories.length > 0 && (
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center space-x-1.5">
              <Compass size={16} className="text-[#40A2E3]" />
              <h3 className="text-sm font-black text-[#0F172A] dark:text-white">Categories</h3>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="text-xs font-extrabold text-[#40A2E3] hover:underline flex items-center"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {categories.map((cat) => {
              const isPrintout = isPrintoutCategory(cat.name);
              return (
                <div
                  key={cat._id}
                  onClick={() => {
                    if (isPrintout) {
                      navigate('/printouts');
                    } else {
                      navigate(`/products?category=${encodeURIComponent(cat.name)}`);
                    }
                  }}
                  className="bg-sys-surface border border-sys-border rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.03] active:scale-95 group text-center shadow-xs"
                >
                  <img
                    src={
                      (cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/')))
                        ? cat.icon
                        : ({
                          'Printouts': 'https://cdn-icons-png.flaticon.com/512/1041/1041975.png',
                          'Printout': 'https://cdn-icons-png.flaticon.com/512/1041/1041975.png',
                          'Snacks': 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png',
                          'Beverages': 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png',
                          'Dairy': 'https://cdn-icons-png.flaticon.com/512/3050/3050158.png',
                          'Groceries': 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png',
                          'Household': 'https://cdn-icons-png.flaticon.com/512/995/995053.png',
                          'Fast Food': 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
                          'Vegetables': 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png',
                          'Fruits': 'https://cdn-icons-png.flaticon.com/512/3194/3194766.png',
                          'Electronics': 'https://cdn-icons-png.flaticon.com/512/3659/3659899.png',
                        }[cat.name] || 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png')
                    }
                    alt={cat.name}
                    className="w-8 h-8 sm:w-9 sm:h-9 object-contain mb-1.5 group-hover:scale-110 transition-transform filter drop-shadow-xs"
                  />
                  <span className="text-[11px] font-bold text-[#0F172A] dark:text-slate-200 truncate w-full group-hover:text-[#40A2E3]">
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Printouts Banner */}
      <section className="group relative overflow-hidden rounded-3xl border border-sys-border bg-sys-surface shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">

        {/* Accent Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-primary-500/10 blur-3xl transition-transform duration-500 group-hover:scale-125"
        />

        {/* Left Accent */}
        <div className="absolute left-0 top-0 h-full w-1.5 bg-primary-500" />

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

          {/* Content */}
          <div className="max-w-xl space-y-3">

            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 dark:border-primary-500/20 dark:bg-primary-500/10">
              <Printer
                size={14}
                className="text-primary-500"
                aria-hidden="true"
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Printing Service
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-sys-text-primary">
                Print Documents with Ease
              </h3>

              <p className="mt-2 text-sm leading-6 text-sys-text-secondary">
                Upload PDFs, choose black &amp; white or color printing, single or
                double-sided, spiral binding, and collect or receive your documents
                quickly.
              </p>
            </div>

          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => navigate("/printouts")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 active:scale-95 sm:w-auto"
          >
            <span>Order Printouts</span>
            <ChevronRight size={18} />
          </button>

        </div>
      </section>

      {/* 6. Product Sections (Dynamic home sections fetched from backend) */}
      {cmLoading ? (
        <div className="space-y-6">
          {renderProductSkeleton()}
          {renderProductSkeleton()}
        </div>
      ) : sections.length > 0 ? (
        sections.map((section) => {
          if (!section.isActive || !section.products || section.products.length === 0) return null;
          return (
            <section key={section._id} className="space-y-3 animate-fade-in">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center space-x-1.5">
                  <Sparkles size={16} className="text-[#40A2E3] fill-current" />
                  <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              </div>

              <div className="flex space-x-3.5 overflow-x-auto pb-4 px-0.5 scrollbar-hide snap-x">
                {section.products.map((product) => {
                  if (!product) return null;
                  return (
                    <div key={product._id} className="w-40 sm:w-44 flex-shrink-0 snap-start">
                      <ProductCard product={product} />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      ) : (
        /* Fallback Static Sections if dynamic seeding failed */
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center space-x-1.5">
                <Zap size={16} className="text-[#40A2E3] fill-current" />
                <h3 className="text-sm font-black text-[#0F172A] dark:text-white">Trending</h3>
              </div>
            </div>
            <div className="flex space-x-3.5 overflow-x-auto pb-4 px-0.5 scrollbar-hide snap-x">
              {products.slice(0, 6).map((product) => (
                <div key={product._id} className="w-40 sm:w-44 flex-shrink-0 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Address Switcher Modal (Triggered by Address Selector above search bar) */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-fade-in space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Select Delivery Address</h3>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="text-xs font-bold text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
              >
                Close
              </button>
            </div>

            {user?.addresses && user.addresses.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {user.addresses.map((addr) => (
                  <button
                    key={addr._id}
                    onClick={async () => {
                      try {
                        await api.put(`/api/auth/address/${addr._id}`, { isDefault: true });
                        // Trigger hot reload profile update on backend success
                        const profileRes = await api.get('/api/auth/profile');
                        if (profileRes.data.success) {
                          dispatch(loginSuccess({ token: localStorage.getItem('token'), user: profileRes.data.user }));
                        }
                        setAddressModalOpen(false);
                        toast.success(`Delivery address set to ${addr.name}`);
                      } catch (err) {
                        toast.error('Failed to change active location');
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex justify-between items-center ${addr.isDefault
                      ? 'border-[#40A2E3] bg-[#40A2E3]/5 text-[#0F172A] dark:text-white font-extrabold'
                      : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:border-slate-300'
                      }`}
                  >
                    <div>
                      <p className="font-bold text-[#0F172A] dark:text-white">{addr.name}</p>
                      <p className="text-[11px] mt-0.5">{addr.houseNumber}, {addr.street}, {addr.city}</p>
                    </div>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold text-[#40A2E3] uppercase bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-[#40A2E3]/20 shadow-xs">
                        Default
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 text-center my-4">
                No saved addresses. Add one in your Profile settings.
              </p>
            )}

            <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-700 flex justify-end">
              <button
                onClick={() => {
                  setAddressModalOpen(false);
                  navigate('/profile');
                }}
                className="text-xs font-bold bg-[#40A2E3] text-white px-4 py-2 rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Manage Locations
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
