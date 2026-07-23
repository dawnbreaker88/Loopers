import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCartLocal } from '../store/cartSlice.js';
import orderService from '../services/orderService.js';
import { MapPin, Phone, CreditCard, ChevronLeft, ArrowRight, ShieldCheck, CheckCircle2, QrCode, Copy, X, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import LocationPermissionModal from '../components/LocationPermissionModal.jsx';
import LocationPromptBanner from '../components/LocationPromptBanner.jsx';

import { fetchOrders } from '../store/orderSlice.js';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, totalPrice } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const orders = useSelector((state) => state.orders.orders);

  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' only
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // 6-Second Confirmation Countdown Window state
  const [countdown, setCountdown] = useState(null); // null or 6..0
  const timerRef = useRef(null);

  // Check for active order
  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const activeOrder = orders?.find((o) =>
    ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.orderStatus)
  );

  const addresses = user?.addresses && user.addresses.length > 0 ? user.addresses : [
    {
      name: user?.name || 'Customer',
      phone: user?.phone || '9999999999',
      houseNumber: 'Room 304',
      street: 'Hostel Block A',
      city: 'Campus',
      state: 'State',
      pincode: '560001',
      landmark: 'Near Mess'
    }
  ];

  const selectedAddress = addresses[selectedAddressIndex] || addresses[0];

  const deliveryCharge = items && items.length > 0 ? 1 : 0;
  const finalTotal = totalPrice + deliveryCharge;

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const upiId = import.meta.env.VITE_UPI_ID || '';

  const handleCopyUpi = () => {
    if (!upiId) {
      toast.error('UPI ID is not configured.');
      return;
    }
    navigator.clipboard.writeText(upiId);
    toast.success('UPI ID copied to clipboard!');
  };

  // Step 1: Initiate 6-second countdown
  const handleInitiateOrder = () => {
    if (activeOrder) {
      toast.error('You already have an active order. Please wait until it is completed before placing another order.');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    // Check if user has active GPS location coordinates
    const hasCoordinates = user?.location?.latitude !== undefined && user.location.latitude !== null && user.location.latitude !== 0;

    if (!hasCoordinates) {
      // Prompt user to enable location before proceeding
      setShowLocationModal(true);
      return;
    }

    setCountdown(6);
  };

  const handleLocationGranted = () => {
    setShowLocationModal(false);
    setCountdown(6);
  };

  // Timer loop effect for countdown
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Countdown completed naturally -> Execute backend order creation!
      executeFinalOrder();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  // Step 2: Cancel Order during 6-second countdown
  const handleCancelCountdown = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCountdown(null);
    toast.error('Order placement cancelled');
  };

  // Step 3: Execute Order creation after 6-second countdown completes
  const executeFinalOrder = async () => {
    setCountdown(null);
    setLoading(true);

    try {
      const orderPayload = {
        address: selectedAddress,
        paymentMethod,
        deliveryNotes
      };

      const response = await orderService.createOrder(orderPayload);

      if (response.success && response.order) {
        dispatch(clearCartLocal());
        toast.success('Order placed successfully!');

        if (paymentMethod === 'UPI') {
          navigate('/app/payment', { state: { orderId: response.order._id, amount: finalTotal } });
        } else {
          navigate(`/app/tracking/${response.order._id}`);
        }
      } else {
        toast.error(response.message || 'Failed to place order');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Your cart is empty</h3>
        <button
          onClick={() => navigate('/app/products')}
          className="mt-3 bg-[#40A2E3] text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-28">

      {/* Header Bar */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-[#0F172A] dark:text-white"
        >
          <ChevronLeft size={16} />
        </button>
        <h1 className="text-base font-black text-[#0F172A] dark:text-white">Checkout</h1>
      </div>

      {/* Active Order Alert Banner */}
      {activeOrder && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black">Active Order In Progress</h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-300 mt-0.5">
                You already have an active order ({activeOrder.customId || `LPR-${activeOrder._id.slice(-6).toUpperCase()}`}). Please wait until it is completed before placing another order.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/tracking/${activeOrder._id}`)}
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl active:scale-95 transition-all shadow-xs"
          >
            Track Order
          </button>
        </div>
      )}

      {/* Location Permission Prompt Banner */}
      <LocationPromptBanner />

      {/* Delivery Address Selection */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-extrabold text-[#0F172A] dark:text-white">
            <MapPin size={16} className="text-[#40A2E3]" />
            <span>Select Delivery Address</span>
          </div>
          <button
            onClick={() => navigate('/app/profile')}
            className="text-[11px] font-extrabold text-[#40A2E3] hover:underline"
          >
            + Add New
          </button>
        </div>

        <div className="space-y-2">
          {addresses.map((addr, idx) => {
            const isSelected = idx === selectedAddressIndex;
            return (
              <div
                key={idx}
                onClick={() => setSelectedAddressIndex(idx)}
                className={`p-3 rounded-xl border cursor-pointer transition-all text-xs flex items-center justify-between ${isSelected
                    ? 'border-[#40A2E3] bg-[#40A2E3]/5 text-[#0F172A] dark:text-white'
                    : 'border-[#E2E8F0] dark:border-slate-700/70 bg-white dark:bg-slate-800/50 text-[#64748B] dark:text-slate-400'
                  }`}
              >
                <div>
                  <p className="font-bold text-[#0F172A] dark:text-white">{addr.name} ({addr.houseNumber})</p>
                  <p className="text-[11px] mt-0.5">{addr.street}, {addr.city} {addr.landmark ? `• ${addr.landmark}` : ''}</p>
                  <p className="text-[10px] font-mono mt-0.5 text-[#64748B] dark:text-slate-400">📞 {addr.phone}</p>
                </div>
                {isSelected && (
                  <CheckCircle2 size={18} className="text-[#40A2E3] flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method Selection (Only COD enabled) */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-extrabold text-[#0F172A] dark:text-white">
          <CreditCard size={16} className="text-[#40A2E3]" />
          <span>Payment Method</span>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <span className="text-[#0F172A] dark:text-white font-bold block">Cash on Delivery (COD)</span>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400">Pay cash or scan QR code at delivery agent's doorstep.</span>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded-md">
            Active
          </span>
        </div>
      </div>

      {/* Delivery Notes */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-2 shadow-xs">
        <label className="text-xs font-bold text-[#0F172A] dark:text-white block">
          Delivery Notes / Instructions (Optional)
        </label>
        <input
          type="text"
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
          placeholder="e.g. Leave at hostel gate or call when outside block..."
          className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
        />
      </div>

      {/* Order Items Summary */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-3 shadow-xs">
        <h4 className="text-xs font-extrabold text-[#0F172A] dark:text-white">Order Summary ({items.length} items)</h4>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {items.map((item) => {
            const isPrintout = item.type === 'printout';
            const product = item.product;
            if (!isPrintout && !product) return null;

            const name = isPrintout ? (item.pdfName || 'Printout Document') : product.name;
            const displayPrice = isPrintout
              ? item.price
              : (product.discount ? product.price - (product.price * product.discount) / 100 : product.price);
            const itemKey = isPrintout ? item._id : product._id;

            return (
              <div key={itemKey} className="flex justify-between items-center text-xs">
                <span className="truncate text-[#0F172A] dark:text-slate-200 font-medium max-w-[70%]">
                  {item.quantity}x {name}
                  {isPrintout && (
                    <span className="block text-[10px] text-[#64748B] dark:text-slate-400">
                      {item.paperSize} • {item.printMode === 'double' ? 'Double Side' : 'Single Side'} • {item.colorPages > 0 ? 'Color' : 'B&W'} • {item.pages} pgs
                    </span>
                  )}
                </span>
                <span className="font-mono font-bold text-[#0F172A] dark:text-white">
                  ₹{(displayPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
          <div className="flex justify-between text-[#64748B] dark:text-slate-400">
            <span>Items Subtotal</span>
            <span className="font-mono">₹{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#64748B] dark:text-slate-400">
            <span>Delivery Fee</span>
            <span className="font-mono text-[#22C55E]">₹{deliveryCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-black text-sm text-[#0F172A] dark:text-white pt-1">
            <span>Total Payable</span>
            <span className="font-mono text-[#40A2E3]">₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sticky Order Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#0F172A]/95 border-t border-[#E2E8F0] dark:border-[#334155] backdrop-blur-md z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase">Payable Amount</p>
            <p className="text-base font-black text-[#0F172A] dark:text-white font-mono">
              ₹{finalTotal.toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleInitiateOrder}
            disabled={loading}
            className="flex-1 bg-[#40A2E3] hover:bg-[#40A2E3]/90 text-white font-black text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-[#40A2E3]/25 flex items-center justify-center space-x-2 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Processing Order...' : 'Place Order'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* 6-SECOND ORDER CONFIRMATION MODAL OVERLAY */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">

            {/* Animated Countdown Circle */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#40A2E3]/20 animate-pulse"></div>
              <div className="w-16 h-16 rounded-full bg-[#40A2E3]/10 text-[#40A2E3] flex items-center justify-center text-2xl font-black font-mono shadow-inner">
                {countdown}s
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-[#0F172A] dark:text-white">
                Finalizing Your Order
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                Placing order for <span className="font-bold text-[#0F172A] dark:text-white">₹{finalTotal.toFixed(2)}</span> via <span className="font-bold text-[#40A2E3]">{paymentMethod}</span>.
              </p>
            </div>

            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2.5 rounded-2xl text-[11px] font-bold flex items-center justify-center space-x-1.5">
              <Clock size={14} className="flex-shrink-0 animate-spin" />
              <span>Placing order automatically in {countdown}s...</span>
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCancelCountdown}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
            >
              <X size={16} />
              <span>Cancel Order</span>
            </button>

          </div>
        </div>
      )}

      {/* LOCATION PERMISSION PROMPT MODAL */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSuccess={handleLocationGranted}
      />

    </div>
  );
}
