import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addSingleItem, updateCartQty, removeCartItem } from '../store/cartSlice.js';
import { Plus, Minus, PackageX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updatePWAEngagement } from './PWAInstallModal.jsx';

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';

export default function ProductCard({ product, isSearchPage = false }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth || {});
  const cartItems = useSelector((state) => state.cart?.items || []);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (product && product._id) {
      // Track product view in engagement metric
      updatePWAEngagement('product_view');

      // Store details in recently viewed (up to 8 items)
      try {
        const stored = localStorage.getItem('loopers-recently-viewed');
        let list = stored ? JSON.parse(stored) : [];
        list = list.filter((item) => String(item._id) !== String(product._id));
        list.unshift(product);
        if (list.length > 8) {
          list = list.slice(0, 8);
        }
        localStorage.setItem('loopers-recently-viewed', JSON.stringify(list));
      } catch (err) {
        console.warn('Failed to cache recently viewed product:', err);
      }
    }
  }, [product]);

  // Fault Tolerance Guard for invalid/missing product props
  if (!product || typeof product !== 'object' || !product._id) {
    return (
      <div className="bg-sys-surface rounded-2xl p-3 border border-sys-border shadow-xs opacity-50 flex flex-col items-center justify-center min-h-[180px]">
        <PackageX size={24} className="text-sys-text-secondary mb-1" />
        <span className="text-xs font-semibold text-sys-text-secondary">Unavailable</span>
      </div>
    );
  }

  const productId = String(product._id);
  const cartItem = Array.isArray(cartItems)
    ? cartItems.find((item) => String(item?.product?._id || item?.product) === productId)
    : null;

  const quantity = Number(cartItem?.quantity) || 0;
  const rawPrice = Number(product.price) || 0;
  const rawDiscount = Number(product.discount) || 0;
  const stock = Number(product.stock) || 0;
  const productName = product.name ? String(product.name) : 'Product Item';
  const productUnit = product.unit ? String(product.unit) : '1 unit';

  const displayPrice = rawDiscount > 0
    ? Math.max(0, rawPrice - (rawPrice * rawDiscount) / 100)
    : Math.max(0, rawPrice);

  const handleAdd = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (!navigator.onLine) {
      toast.error('You are offline. Reconnect to place new orders.');
      return;
    }
    if (!isAuthenticated) {
      toast.error('Please log in to add items to cart');
      return;
    }
    try {
      await dispatch(addSingleItem({ productId: product._id, quantity: 1 })).unwrap();
      toast.success(`${productName} added to cart`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to add item');
    }
  };

  const handleIncrement = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (!navigator.onLine) {
      toast.error('You are offline. Reconnect to place new orders.');
      return;
    }
    try {
      await dispatch(updateCartQty({ productId: product._id, quantity: quantity + 1 })).unwrap();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update quantity');
    }
  };

  const handleDecrement = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (!navigator.onLine) {
      toast.error('You are offline. Reconnect to place new orders.');
      return;
    }
    try {
      if (quantity <= 1) {
        await dispatch(removeCartItem(product._id)).unwrap();
        toast.success(`${productName} removed`);
      } else {
        await dispatch(updateCartQty({ productId: product._id, quantity: quantity - 1 })).unwrap();
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update quantity');
    }
  };

  const handleCardClick = (e) => {
    if (isSearchPage && window.innerWidth <= 375) {
      if (e && e.preventDefault) e.preventDefault();
      if (stock <= 0) return;
      if (quantity > 0) {
        handleIncrement(e);
      } else {
        handleAdd(e);
      }
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      tabIndex={isSearchPage ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick(e);
        }
      }}
      className={`bg-sys-surface rounded-2xl p-3 border border-sys-border shadow-xs hover:shadow-card transition-all duration-200 relative flex flex-col justify-between h-full group ${
        isSearchPage ? 'max-[375px]:cursor-pointer max-[375px]:active:scale-[0.98]' : ''
      }`}
    >
      {/* Product Image Container */}
      <div className="aspect-square w-full rounded-xl bg-sys-surface-secondary flex items-center justify-center overflow-hidden mb-3 border border-sys-border relative">
        <img 
          src={!imgError && product.image ? product.image : DEFAULT_PRODUCT_IMAGE} 
          alt={productName} 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Search Page <=375px Quantity Badge */}
        {isSearchPage && quantity > 0 && (
          <div 
            className="max-[375px]:flex hidden absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#40A2E3] text-white text-[11px] font-black items-center justify-center shadow-md border-2 border-white dark:border-slate-900 z-10 animate-fade-in"
            aria-label={`${quantity} in cart`}
          >
            {quantity}
          </div>
        )}

        {stock <= 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-white bg-red-600 px-2 py-0.5 rounded-full uppercase">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Details & Actions */}
      <div className="flex-grow flex flex-col justify-between space-y-2">
        <div>
          <span className="text-[10px] font-bold text-sys-text-secondary block font-mono">
            {productUnit}
          </span>
          <h4 className="text-xs font-bold text-sys-text-primary line-clamp-2 leading-tight h-8">
            {productName}
          </h4>
        </div>

        {/* Pricing and Quick Add */}
        <div className="flex items-center justify-between pt-1 gap-1">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-sys-text-primary font-mono truncate">
              ₹{displayPrice.toFixed(2)}
            </span>
          </div>

          {/* Dynamic Quick Add / Quantity Selector (Hidden on <=375px for Search Page) */}
          <div className={isSearchPage ? "max-[375px]:hidden" : ""}>
            {stock <= 0 ? (
              <span className="text-[10px] font-bold text-sys-text-secondary">Unavailable</span>
            ) : quantity > 0 ? (
              <div className="flex items-center bg-[#40A2E3] text-white rounded-xl p-0.5 shadow-sm animate-fade-in flex-shrink-0">
                <button 
                  onClick={handleDecrement}
                  className="w-6 h-6 flex items-center justify-center hover:bg-black/15 rounded-lg transition-colors active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus size={11} strokeWidth={3} />
                </button>
                <span className="text-xs font-extrabold px-1.5 min-w-[16px] text-center font-mono">
                  {quantity}
                </span>
                <button 
                  onClick={handleIncrement}
                  className="w-6 h-6 flex items-center justify-center hover:bg-black/15 rounded-lg transition-colors active:scale-90"
                  aria-label="Increase quantity"
                >
                  <Plus size={11} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleAdd}
                className="flex-shrink-0 flex items-center justify-center px-3 py-1.5 rounded-xl border border-[#40A2E3] text-[#40A2E3] hover:bg-[#40A2E3] hover:text-white text-xs font-extrabold transition-all active:scale-95 shadow-xs"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
