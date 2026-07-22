import React, { useState, useEffect } from 'react';
import { WifiOff, RotateCw, ShoppingBag } from 'lucide-react';
import ProductCard from './ProductCard.jsx';

export default function OfflineView({ onRetry }) {
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('loopers-recently-viewed');
      if (stored) {
        setRecentProducts(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load recently viewed products from local storage:', e);
    }
  }, []);

  const handleRetryClick = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-2xl mx-auto space-y-8 animate-fade-in text-center">
      {/* Offline Status Illustration */}
      <div className="flex flex-col items-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center animate-pulse shadow-inner">
          <WifiOff size={40} className="stroke-[1.75]" />
        </div>
        <div>
          <h2 className="text-xl font-black text-sys-text-primary">You're Offline</h2>
          <p className="text-xs text-sys-text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
            Please check your internet connection. Recently viewed products remain available below. Reconnect to place new orders.
          </p>
        </div>
        <button
          onClick={handleRetryClick}
          className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-primary-500/20 transition-all active:scale-[0.97]"
        >
          <RotateCw size={14} />
          <span>Try Reconnecting</span>
        </button>
      </div>

      {/* Recently Viewed Products Catalog */}
      <div className="w-full pt-6 border-t border-sys-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase text-sys-text-secondary tracking-wider flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-[#40A2E3]" />
            <span>Recently Viewed Products</span>
          </h3>
          {recentProducts.length > 0 && (
            <span className="bg-sys-surface-secondary text-sys-text-secondary text-[10px] font-bold px-2 py-0.5 rounded-md border border-sys-border">
              Offline Catalog
            </span>
          )}
        </div>

        {recentProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recentProducts.map((product) => (
              <div key={product._id} className="h-full">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-sys-surface rounded-2xl p-6 border border-sys-border flex flex-col items-center justify-center text-center">
            <p className="text-xs text-sys-text-muted">
              No recently viewed products cached on this device yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
