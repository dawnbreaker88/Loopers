import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import orderService from '../services/orderService.js';
import api from '../services/api.js';
import { addSingleItem } from '../store/cartSlice.js';
import { MapPin, Phone, Clock, CheckCircle2, ChevronLeft, AlertCircle, Hourglass, ShieldCheck, RefreshCw, XCircle, Star, Home, ShoppingBag, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { subscribeToSocketEvents } from '../services/socketService.js';

// Custom Leaflet Icons
const createMarkerIcon = (emoji, color) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 34px; height: 34px; border-radius: 50%; border: 2.5px solid white; display: flex; items-center; justify-content: center; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

const storeIcon = createMarkerIcon('🏪', '#40A2E3');
const customerIcon = createMarkerIcon('🏠', '#22C55E');
const agentIcon = createMarkerIcon('🛵', '#EF4444');

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  const fetchOrderDetails = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await orderService.getOrderById(orderId);
      if (response.success && response.order) {
        setOrder(response.order);
        if (isManual) toast.success('Tracking data updated');
      } else {
        if (!order) setError(response.message || 'Order not found');
      }
    } catch (err) {
      if (!order) setError(err.response?.data?.message || 'Error loading order tracking');
      if (isManual) toast.error('Failed to refresh order');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(() => fetchOrderDetails(false), 5000);

    const unsubscribe = subscribeToSocketEvents((eventName, data) => {
      if ((eventName === 'orderUpdated' || eventName === 'order-status-update' || eventName === 'riderLocationUpdate') && data) {
        if (data._id === orderId || data.orderId === orderId) {
          if (eventName === 'riderLocationUpdate' && data.agentLocation) {
            setOrder(prev => prev ? { ...prev, agentLocation: data.agentLocation } : prev);
          } else {
            fetchOrderDetails(false);
          }
        }
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40A2E3]"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <AlertCircle size={36} className="text-red-500 mb-2" />
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">{error || 'Order tracking unavailable'}</h3>
        <button
          onClick={() => navigate('/app/profile')}
          className="mt-3 bg-[#40A2E3] text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          Go to My Orders
        </button>
      </div>
    );
  }

  // Check if admin has accepted order
  const isAccepted = !['Order Placed', 'Cancelled'].includes(order.orderStatus);

  const hasPrintout = order.products?.some(p => p.type === 'printout');

  const statusSteps = hasPrintout ? [
    { key: 'Order Placed', label: 'Order Placed', desc: 'Sent to Campus Store' },
    { key: 'Confirmed', label: 'Confirmed', desc: 'Accepted by Admin' },
    { key: 'Printing', label: 'Printing', desc: 'Printing document' },
    { key: 'Packing', label: 'Ready', desc: 'Document is ready' },
    { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'En route to room' },
    { key: 'Delivered', label: 'Delivered', desc: 'Order completed' }
  ] : [
    { key: 'Order Placed', label: 'Order Placed', desc: 'Sent to Campus Store' },
    { key: 'Confirmed', label: 'Confirmed', desc: 'Accepted by Admin' },
    { key: 'Packing', label: 'Packing', desc: 'Packing items' },
    { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'En route to room' },
    { key: 'Delivered', label: 'Delivered', desc: 'Order completed' }
  ];

  const normalizeStatus = (status) => {
    if (status === 'Preparing') return 'Packing';
    return status;
  };

  const currentNormalizedStatus = normalizeStatus(order.orderStatus);

  const getStepIndex = (status) => {
    if (status === 'Cancelled') return -1;
    const idx = statusSteps.findIndex(s => s.key === status || (s.key === 'Packing' && status === 'Preparing'));
    return idx >= 0 ? idx : 0;
  };

  const currentStepIndex = getStepIndex(order.orderStatus);

  // Raw Customer & Admin (Delivery Partner) Coordinates
  const customerPos = order.customerLocation?.lat && order.customerLocation?.lng
    ? [Number(order.customerLocation.lat), Number(order.customerLocation.lng)]
    : null;

  const agentPos = order.agentLocation?.lat && order.agentLocation?.lng
    ? [Number(order.agentLocation.lat), Number(order.agentLocation.lng)]
    : null;


  // Exact Admin details provided on acceptance
  const adminName = order.adminDetails?.name || 'Campus Admin';
  const adminPhone = order.adminDetails?.phone || '+91 98765 43210';



  const handleRate = (stars) => {
    setRating(stars);
    setRated(true);
    toast.success(`Thank you for rating us ${stars} stars!`);
  };

  const handleReorder = async (orderToReorder) => {
    if (!orderToReorder || !orderToReorder.products || orderToReorder.products.length === 0) {
      toast.error('No items found in this order to reorder');
      return;
    }

    try {
      const addedItems = [];
      const skippedItems = [];

      for (const item of orderToReorder.products) {
        try {
          const productId = typeof item.product === 'object' ? item.product?._id : item.product;
          const itemName = item.name || 'Item';

          if (!productId) {
            skippedItems.push(itemName);
            continue;
          }

          const res = await api.get(`/api/products/${productId}`);
          if (res.data.success && res.data.product) {
            const product = res.data.product;
            if (product.isDeleted || !product.isActive || product.stock <= 0) {
              skippedItems.push(`${product.name} (Out of Stock)`);
              continue;
            }

            const qtyToAdd = Math.min(item.quantity, product.stock);
            await dispatch(addSingleItem({ productId: product._id, quantity: qtyToAdd })).unwrap();
            addedItems.push(product.name);
          } else {
            skippedItems.push(itemName);
          }
        } catch (err) {
          skippedItems.push(item.name || 'Item');
        }
      }

      if (addedItems.length > 0) {
        if (skippedItems.length > 0) {
          toast.success(`Reordered ${addedItems.length} item(s)! (${skippedItems.length} item(s) unavailable)`);
        } else {
          toast.success('All items added to cart!');
        }
        navigate('/app/cart');
      } else {
        toast.error(`Unable to reorder: items are currently out of stock (${skippedItems.join(', ')})`);
      }
    } catch (err) {
      console.error('Reorder error:', err);
      toast.error('Failed to reorder items');
    }
  };

  const formattedCompletionTime = new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (order.orderStatus === 'Delivered') {
    return (
      <div className="max-w-xl mx-auto space-y-4 pb-20">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/app/profile')}
            className="flex items-center text-xs font-bold text-[#64748B] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white"
          >
            <ChevronLeft size={16} className="mr-1" />
            My Orders
          </button>
          <span className="text-xs font-bold text-[#0F172A] dark:text-white">
            Order ID: <span className="font-mono text-[#40A2E3]">{order.customId || `LPR-${order._id.slice(-6).toUpperCase()}`}</span>
          </span>
        </div>

        {/* Success Card */}
        <div className="bg-sys-surface border border-sys-border rounded-2xl p-6 shadow-xs flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-sys-text-primary">Order Delivered Successfully!</h2>
            <p className="text-xs text-sys-text-secondary mt-1">
              Your order was completed on {formattedCompletionTime}
            </p>
          </div>
        </div>

        {/* Details Summary Card */}
        <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-3 shadow-xs">
          <h4 className="text-xs font-extrabold text-[#0F172A] dark:text-white pb-2 border-b border-sys-border">Delivery & Summary Details</h4>
          
          <div className="space-y-2.5 text-xs text-sys-text-secondary">
            <div>
              <p className="font-bold text-sys-text-primary">Delivery Address</p>
              <p className="mt-0.5">{order.address?.name} ({order.address?.houseNumber})</p>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">{order.address?.street}, {order.address?.city} - {order.address?.pincode}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-sys-border pt-2.5">
              <div>
                <p className="font-bold text-sys-text-primary">Payment Method</p>
                <p className="mt-0.5">{order.paymentMethod} ({order.paymentStatus})</p>
              </div>
              <div>
                <p className="font-bold text-sys-text-primary">Delivery Partner</p>
                <p className="mt-0.5">{order.adminDetails?.name || 'Campus Partner'}</p>
              </div>
            </div>

            <div className="border-t border-sys-border pt-2.5 space-y-2">
              <p className="font-bold text-sys-text-primary">Items Summary</p>
              {order.products?.map((item, idx) => {
                const isPrintout = item.type === 'printout';
                return (
                  <div key={idx} className="flex flex-col text-xs text-[#0F172A] dark:text-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate max-w-[75%]">{item.quantity}x {item.name}</span>
                      <span className="font-mono text-sys-text-secondary">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {isPrintout && (
                      <span className="text-[9px] text-[#64748B] dark:text-slate-400 ml-3">
                        {item.paperSize} • {item.printMode === 'double' ? 'Double Side' : 'Single Side'} • {item.colorPages > 0 ? 'Color' : 'B&W'} • {item.pages} pgs
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-sys-border pt-2.5 flex justify-between font-black text-sm text-sys-text-primary">
              <span>Total Paid</span>
              <span className="font-mono text-[#40A2E3]">₹{order.totalPrice?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Rate Experience */}
        <div className="bg-sys-surface border border-sys-border rounded-2xl p-5 shadow-xs flex flex-col items-center text-center space-y-3">
          <h4 className="text-xs font-black text-sys-text-primary">Rate your experience</h4>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                className={`transition-transform duration-150 hover:scale-125 ${
                  star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                }`}
              >
                <Star size={24} className="fill-current" />
              </button>
            ))}
          </div>
          {rated && (
            <p className="text-[10px] text-emerald-500 font-bold">Feedback submitted. Thank you!</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => handleReorder(order)}
            className="w-full bg-[#40A2E3] hover:bg-[#40A2E3]/95 text-white font-black text-xs py-3 px-6 rounded-2xl shadow-lg shadow-[#40A2E3]/25 flex items-center justify-center space-x-1.5 active:scale-[0.99] transition-all"
          >
            <RefreshCw size={13} />
            <span>Order Again</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('/app')}
              className="py-3 px-4 bg-sys-surface-secondary hover:bg-sys-border border border-sys-border rounded-2xl text-xs font-bold text-sys-text-primary transition-all text-center flex items-center justify-center space-x-1.5"
            >
              <Home size={13} />
              <span>Browse Products</span>
            </button>
            <button
              onClick={() => navigate('/app/profile')}
              className="py-3 px-4 bg-sys-surface-secondary hover:bg-sys-border border border-sys-border rounded-2xl text-xs font-bold text-sys-text-primary transition-all text-center flex items-center justify-center space-x-1.5"
            >
              <ShoppingBag size={13} />
              <span>View Orders</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (order.orderStatus === 'Cancelled') {
    const isUPI = order.paymentMethod === 'UPI';
    const refundStatus = isUPI
      ? (order.paymentStatus === 'Refunded' ? 'Refunded' : 'Processing Refund')
      : 'Not Applicable (COD)';

    return (
      <div className="max-w-xl mx-auto space-y-4 pb-20">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/app/profile')}
            className="flex items-center text-xs font-bold text-[#64748B] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white"
          >
            <ChevronLeft size={16} className="mr-1" />
            My Orders
          </button>
          <span className="text-xs font-bold text-[#0F172A] dark:text-white">
            Order ID: <span className="font-mono text-[#40A2E3]">{order.customId || `LPR-${order._id.slice(-6).toUpperCase()}`}</span>
          </span>
        </div>

        {/* Cancelled Card */}
        <div className="bg-sys-surface border border-sys-border rounded-2xl p-6 shadow-xs flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
            <XCircle size={36} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-sys-text-primary">Order Cancelled</h2>
            <p className="text-xs text-sys-text-secondary mt-1">
              This order was cancelled on {formattedCompletionTime}
            </p>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-3 shadow-xs">
          <h4 className="text-xs font-extrabold text-[#0F172A] dark:text-white pb-2 border-b border-sys-border">Cancellation Summary</h4>
          
          <div className="space-y-2.5 text-xs text-sys-text-secondary">
            <div>
              <p className="font-bold text-sys-text-primary">Refund Status</p>
              <p className={`mt-0.5 font-bold ${
                refundStatus === 'Refunded' ? 'text-emerald-500' : isUPI ? 'text-amber-500' : 'text-sys-text-secondary'
              }`}>
                {refundStatus}
              </p>
            </div>
            
            <div className="border-t border-sys-border pt-2.5">
              <p className="font-bold text-sys-text-primary">Customer Support</p>
              <p className="mt-0.5">Need help? Contact campus support at:</p>
              <p className="font-bold text-primary-500 mt-0.5">support.campus@loopers.in</p>
            </div>

            <div className="border-t border-sys-border pt-2.5 space-y-2">
              <p className="font-bold text-sys-text-primary">Items Summary</p>
              {order.products?.map((item, idx) => {
                const isPrintout = item.type === 'printout';
                return (
                  <div key={idx} className="flex justify-between items-center text-xs text-[#0F172A] dark:text-slate-200">
                    <span className="font-medium truncate max-w-[75%]">
                      {item.quantity}x {item.name}
                      {isPrintout && (
                        <span className="block text-[9px] text-[#64748B] dark:text-slate-400">
                          {item.paperSize} • {item.printMode === 'double' ? 'Double Side' : 'Single Side'} • {item.pages} pgs
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-sys-text-secondary">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/app')}
            className="py-3 px-4 bg-[#40A2E3] hover:bg-[#40A2E3]/90 text-white border border-[#40A2E3] rounded-2xl text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5"
          >
            <Home size={13} />
            <span>Browse Products</span>
          </button>
          <button
            onClick={() => navigate('/app/profile')}
            className="py-3 px-4 bg-sys-surface-secondary hover:bg-sys-border border border-sys-border rounded-2xl text-xs font-bold text-sys-text-primary transition-all text-center flex items-center justify-center space-x-1.5"
          >
            <ShoppingBag size={13} />
            <span>View Orders</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20">

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/profile')}
          className="flex items-center text-xs font-bold text-[#64748B] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white"
        >
          <ChevronLeft size={16} className="mr-1" />
          My Orders
        </button>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-[#0F172A] dark:text-white">
            Order ID: <span className="font-mono text-[#40A2E3]">{order.customId || `LPR-${order._id.slice(-6).toUpperCase()}`}</span>
          </span>
          <button
            onClick={() => fetchOrderDetails(true)}
            disabled={refreshing}
            title="Refresh order details & location"
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:text-[#40A2E3] dark:hover:text-[#40A2E3] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#40A2E3]' : ''} />
          </button>
        </div>
      </div>

      {/* Live Status Tracker Card */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">

        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-[#40A2E3] uppercase tracking-wider bg-[#40A2E3]/10 px-2.5 py-1 rounded-full">
              {isAccepted ? 'Estimated Delivery: 10 Mins' : 'Waiting for Admin Acceptance'}
            </span>
            <h2 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white mt-2">
              {order.orderStatus === 'Cancelled' ? 'Order Cancelled' : currentNormalizedStatus}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#40A2E3]/10 text-[#40A2E3] flex items-center justify-center">
            {isAccepted ? <Clock size={20} className="animate-pulse" /> : <Hourglass size={20} className="animate-spin" />}
          </div>
        </div>

        {/* Responsive Progress Timeline */}
        {order.orderStatus !== 'Cancelled' && (
          <div className="relative pt-2">
            {/* Desktop Layout (Horizontal timeline with horizontal connector) */}
            <div className="hidden sm:flex items-center justify-between relative z-10">
              {statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center flex-1 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isPassed
                        ? 'bg-[#40A2E3] border-[#40A2E3] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-[#40A2E3]/20 scale-110' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <span className={`text-xs font-bold mt-2 truncate w-full px-1 ${isPassed ? 'text-[#0F172A] dark:text-white' : 'text-slate-400'
                      }`}>
                      {step.label}
                    </span>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 mt-0.5 truncate w-full px-1">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Desktop Progress Line */}
            <div className="hidden sm:block absolute top-6 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0">
              <div
                className="h-full bg-[#40A2E3] transition-all duration-500"
                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
              ></div>
            </div>

            {/* Mobile Layout (Vertical timeline with vertical connector) */}
            <div className="sm:hidden flex flex-col space-y-5 relative z-10 pl-2">
              {statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-start space-x-3.5 min-w-0">
                    {/* Circle icon wrapper */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-all ${isPassed
                          ? 'bg-[#40A2E3] border-[#40A2E3] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                          } ${isCurrent ? 'ring-4 ring-[#40A2E3]/20 scale-110' : ''}`}
                      >
                        {isPassed ? <CheckCircle2 size={15} /> : idx + 1}
                      </div>
                      
                      {/* Vertical line between icons */}
                      {idx < statusSteps.length - 1 && (
                        <div 
                          className={`w-0.5 absolute top-7 bottom-[-20px] transition-colors duration-300 ${
                            idx < currentStepIndex ? 'bg-[#40A2E3]' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-xs font-bold break-words leading-tight ${isPassed ? 'text-[#0F172A] dark:text-white' : 'text-slate-450'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 break-words leading-snug">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* BEFORE ADMIN ACCEPTS: Waiting Message Card */}
      {!isAccepted && order.orderStatus !== 'Cancelled' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center space-y-2">
          <Hourglass size={28} className="mx-auto text-amber-500 animate-spin" />
          <h4 className="text-xs font-black text-[#0F172A] dark:text-white">Order Sent to Campus Dark Store</h4>
          <p className="text-[11px] text-[#64748B] dark:text-slate-400 max-w-sm mx-auto">
            An admin is reviewing your order items. Once accepted, live delivery map tracking and delivery partner details will activate.
          </p>
        </div>
      )}

      {/* AFTER ADMIN ACCEPTS: Admin Details & Live Map */}
      {isAccepted && order.orderStatus !== 'Cancelled' && (
        <>
          {/* Admin Delivery Info Card */}
          <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#40A2E3]/15 text-[#40A2E3] flex items-center justify-center font-bold text-base">
                  🛵
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                    Delivered by
                  </p>
                  <h4 className="text-xs sm:text-sm font-black text-[#0F172A] dark:text-white">
                    {adminName}
                  </h4>
                </div>
              </div>

              <a
                href={`tel:${adminPhone.replace(/\s+/g, '')}`}
                className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Phone size={14} />
                <span>Call Admin</span>
              </a>
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <span>📞 Contact: <span className="font-mono font-bold text-[#0F172A] dark:text-white">{adminPhone}</span></span>
              <span className="text-[10px] font-extrabold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">Active Partner</span>
            </div>
          </div>

          {/* Live Delivery Map */}
          {!customerPos ? (
            <div className="h-64 sm:h-72 w-full rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center p-6 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                <MapPin className="text-[#64748B] dark:text-slate-400" size={24} />
              </div>
              <h4 className="text-xs font-black text-[#0F172A] dark:text-white">Live Tracking Unavailable</h4>
              <p className="text-[10px] text-sys-text-secondary mt-1 max-w-xs leading-normal">
                Precise coordinates were not captured for this order. Delivery will proceed via text address details.
              </p>
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-700/80 shadow-xs relative z-0">
              <MapContainer
                center={customerPos}
                zoom={15}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={customerPos} icon={customerIcon}>
                  <Popup>Delivery Address</Popup>
                </Marker>

                {agentPos && (
                  <>
                    <Marker position={agentPos} icon={agentIcon}>
                      <Popup>Admin: {adminName}</Popup>
                    </Marker>
                    <Polyline positions={[agentPos, customerPos]} color="#40A2E3" weight={4} dashArray="5, 10" />
                  </>
                )}
              </MapContainer>

              {!agentPos && (
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-200/85 dark:border-slate-700/85 px-3.5 py-2.5 rounded-xl flex items-center space-x-2.5 text-[10px] text-sys-text-secondary shadow-lg z-[400] max-w-max mx-auto animate-fade-in">
                  <AlertCircle className="text-amber-500 shrink-0" size={14} />
                  <span className="font-semibold">Delivery partner's live GPS coordinates are not active yet.</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Items Summary & Payment Info */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-3 shadow-xs">
        <h4 className="text-xs font-extrabold text-[#0F172A] dark:text-white">Order Details</h4>

        <div className="space-y-2">
          {order.products?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="text-[#0F172A] dark:text-slate-200 font-medium">
                {item.quantity}x {item.name}
              </span>
              <span className="font-mono font-bold text-[#0F172A] dark:text-white">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
          <div className="flex justify-between text-[#64748B] dark:text-slate-400">
            <span>Payment Method</span>
            <span className="font-bold text-[#0F172A] dark:text-white">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-[#64748B] dark:text-slate-400">
            <span>Payment Status</span>
            <span className="font-bold text-[#22C55E]">{order.paymentStatus}</span>
          </div>
          <div className="flex justify-between font-black text-sm text-[#0F172A] dark:text-white pt-1">
            <span>Total Paid</span>
            <span className="font-mono text-[#40A2E3]">₹{order.totalPrice?.toFixed(2)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
