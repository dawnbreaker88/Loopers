import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartQty, removeCartItem } from '../store/cartSlice.js';
import { fetchOrders } from '../store/orderSlice.js';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ShieldCheck, ChevronLeft, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CartPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, totalPrice, loading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const orders = useSelector((state) => state.orders.orders);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
      dispatch(fetchOrders());
    }
  }, [dispatch, isAuthenticated]);

  const activeOrder = orders?.find((o) =>
    ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.orderStatus)
  );

  const handleIncrement = async (itemId, currentQty) => {
    try {
      await dispatch(updateCartQty({ productId: itemId, quantity: currentQty + 1 })).unwrap();
    } catch (err) {
      toast.error(err || 'Failed to update quantity');
    }
  };

  const handleDecrement = async (itemId, currentQty) => {
    try {
      if (currentQty === 1) {
        await dispatch(removeCartItem(itemId)).unwrap();
        toast.success('Item removed from cart');
      } else {
        await dispatch(updateCartQty({ productId: itemId, quantity: currentQty - 1 })).unwrap();
      }
    } catch (err) {
      toast.error(err || 'Failed to update quantity');
    }
  };

  const deliveryCharge = items && items.length > 0 ? 1 : 0;
  const finalTotal = totalPrice + deliveryCharge;

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-[#40A2E3]/10 text-[#40A2E3] rounded-full flex items-center justify-center">
          <ShoppingBag size={36} />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white">Your Cart is Empty</h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
            Looks like you haven't added any dorm snacks or essentials yet!
          </p>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="bg-[#40A2E3] text-white text-xs font-black px-6 py-3 rounded-2xl shadow-md shadow-[#40A2E3]/20 hover:opacity-90 active:scale-95 transition-all"
        >
          Add Items
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-xs font-bold text-[#64748B] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back
        </button>
        <h1 className="text-base font-black text-[#0F172A] dark:text-white">My Cart ({items.length})</h1>
        <button
          onClick={() => navigate('/products')}
          className="text-xs font-extrabold text-[#40A2E3] hover:underline"
        >
          Add Items
        </button>
      </div>

      {/* Cart Items List */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-4 shadow-xs">
        {items.map((item) => {
          if (item.type === 'printout') {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            return (
              <div
                key={item._id}
                className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
              >
                {/* Printout Thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <FileText className="text-red-500" size={24} />
                </div>

                {/* Printout Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold uppercase bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-400 px-1.5 py-0.5 rounded-md shrink-0">
                      PDF Print
                    </span>
                    <h4 className="text-xs font-bold text-[#0F172A] dark:text-white truncate">
                      {item.pdfName || 'Printout Document'}
                    </h4>
                  </div>
                  <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed font-semibold">
                    {item.pages} pages • {item.copies} copies • {item.printMode === 'single' ? 'Single side' : 'Double side'} • {item.binding !== 'none' ? item.binding : 'No binding'}
                  </p>
                  {item.specialInstructions && (
                    <p className="text-[9px] text-[#40A2E3] italic truncate mt-0.5">
                      "{item.specialInstructions}"
                    </p>
                  )}
                  <p className="text-xs font-black text-[#40A2E3] mt-1 font-mono">
                    ₹{itemTotal.toFixed(2)}
                  </p>
                </div>

                {/* Quantity Adjuster */}
                <div className="flex items-center bg-[#40A2E3] text-white rounded-xl p-0.5 shadow-xs shrink-0 self-center">
                  <button
                    onClick={() => handleDecrement(item._id, item.quantity)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-black/15 rounded-lg transition-colors active:scale-90"
                  >
                    {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} strokeWidth={3} />}
                  </button>
                  <span className="text-xs font-extrabold px-2 font-mono">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleIncrement(item._id, item.quantity)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-black/15 rounded-lg transition-colors active:scale-90"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>
              </div>
            );
          }

          const product = item.product;
          if (!product) return null;

          const discountedPrice = product.discount
            ? product.price - (product.price * product.discount) / 100
            : product.price;

          const itemTotal = discountedPrice * item.quantity;

          return (
            <div
              key={product._id}
              className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
            >
              {/* Product Thumbnail */}
              <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex-shrink-0 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white truncate">
                  {product.name}
                </h4>
                <p className="text-[10px] font-mono text-[#64748B] dark:text-slate-400">
                  ₹{discountedPrice.toFixed(2)} / {product.unit || 'unit'}
                </p>
                <p className="text-xs font-black text-[#40A2E3] mt-0.5 font-mono">
                  ₹{itemTotal.toFixed(2)}
                </p>
              </div>

              {/* Quantity Adjuster */}
              <div className="flex items-center bg-[#40A2E3] text-white rounded-xl p-0.5 shadow-xs">
                <button
                  onClick={() => handleDecrement(product._id, item.quantity)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-black/15 rounded-lg transition-colors active:scale-90"
                >
                  {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} strokeWidth={3} />}
                </button>
                <span className="text-xs font-extrabold px-2 font-mono">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleIncrement(product._id, item.quantity)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-black/15 rounded-lg transition-colors active:scale-90"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Assurance */}
      <div className="bg-[#40A2E3]/10 border border-[#40A2E3]/20 rounded-2xl p-3 flex items-center space-x-3 text-xs text-[#0F172A] dark:text-slate-200">
        <ShieldCheck size={20} className="text-[#40A2E3] flex-shrink-0" />
        <div>
          <p className="font-extrabold">15-Minutes Delivery</p>
          <p className="text-[11px] text-[#64748B] dark:text-slate-400">Direct delivery to your hostel.</p>
        </div>
      </div>

      {/* Price Summary Breakdown */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-2.5 shadow-xs text-xs">
        <h4 className="font-extrabold text-[#0F172A] dark:text-white mb-1">Bill Details</h4>

        <div className="flex justify-between text-[#64748B] dark:text-slate-400 font-medium">
          <span>Items Total</span>
          <span className="font-mono">₹{totalPrice.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-[#64748B] dark:text-slate-400 font-medium">
          <span>Delivery Charge</span>
          <span className="font-mono text-[#22C55E]">₹{deliveryCharge.toFixed(2)}</span>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-black text-sm text-[#0F172A] dark:text-white">
          <span>To Pay</span>
          <span className="font-mono text-[#40A2E3]">₹{finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#0F172A]/95 border-t border-[#E2E8F0] dark:border-[#334155] backdrop-blur-md z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase">Grand Total</p>
            <p className="text-base font-black text-[#0F172A] dark:text-white font-mono">
              ₹{finalTotal.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="flex-1 bg-[#40A2E3] hover:bg-[#40A2E3]/90 text-white font-black text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-[#40A2E3]/25 flex items-center justify-center space-x-2 active:scale-[0.99] transition-all"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}
