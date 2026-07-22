import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function FloatingCartBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, totalPrice } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  // Hide on Cart, Checkout, Admin, and Login/Signup pages
  const hiddenRoutes = ['/cart', '/checkout', '/payment', '/login', '/signup'];
  if (hiddenRoutes.includes(location.pathname) || location.pathname.startsWith('/admin')) {
    return null;
  }

  // Only show for customers with items in cart
  if (user?.role === 'admin' || !items || items.length === 0) {
    return null;
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div 
          onClick={() => navigate('/cart')}
          className="bg-[#0F172A] dark:bg-[#1E293B] text-white rounded-2xl p-3.5 shadow-2xl shadow-[#0F172A]/30 border border-slate-700/50 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-all active:scale-[0.99] group animate-fade-in"
        >
          {/* Left: Item count & price */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#40A2E3] text-white flex items-center justify-center font-black text-sm relative">
              <ShoppingBag size={18} />
              <span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0F172A]">
                {totalQuantity}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300">
                {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} in cart
              </p>
              <p className="text-sm font-black text-white font-mono">
                ₹{totalPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Right: Checkout button */}
          <div className="flex items-center space-x-1 text-xs font-black text-[#40A2E3] group-hover:translate-x-0.5 transition-transform bg-[#40A2E3]/10 px-3 py-2 rounded-xl border border-[#40A2E3]/20">
            <span>View Cart</span>
            <ArrowRight size={14} className="ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
