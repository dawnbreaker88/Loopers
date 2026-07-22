import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import orderService from '../services/orderService.js';
import { addSingleItem } from '../store/cartSlice.js';
import {
  MapPin, Phone, Clock, CheckCircle2, ChevronLeft, AlertCircle,
  Hourglass, ShieldCheck, RefreshCw, ShoppingBag, XCircle, ArrowRight, Home
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { subscribeToSocketEvents, getSocket } from '../services/socketService.js';

// Custom Leaflet Marker Generator
const createMarkerIcon = (emoji, color) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 17px; box-shadow: 0 6px 14px rgba(0,0,0,0.25);">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const storeIcon = createMarkerIcon('🏪', '#40A2E3');
const customerIcon = createMarkerIcon('🏠', '#22C55E');
const agentIcon = createMarkerIcon('🛵', '#EF4444');

// Haversine Distance Formula in Kilometers
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate dynamic ETA based on distance
function getDynamicETA(status, distanceKm) {
  if (status === 'Delivered') return 'Delivered';
  if (status === 'Cancelled') return 'Order Cancelled';
  if (status === 'Order Placed') return 'Awaiting Acceptance';
  if (!distanceKm || distanceKm <= 0) return '10 Mins (Estimated)';
  
  const speedKmH = 22; // Average delivery bike speed in city
  const timeHours = distanceKm / speedKmH;
  const timeMinutes = Math.ceil(timeHours * 60) + 2; // Add 2 min buffer for handling
  
  if (timeMinutes <= 1) return 'Arriving Shortly!';
  return `${timeMinutes} Mins Away`;
}

// Animated Rider Marker for smooth Linear Interpolation without teleporting
function AnimatedMarker({ position, icon, popupText }) {
  const [currentPos, setCurrentPos] = useState(position);
  const animRef = useRef(null);

  useEffect(() => {
    if (!position) return;
    if (!currentPos) {
      setCurrentPos(position);
      return;
    }

    const startLat = currentPos[0];
    const startLng = currentPos[1];
    const endLat = position[0];
    const endLng = position[1];

    if (startLat === endLat && startLng === endLng) return;

    const startTime = performance.now();
    const duration = 1400; // 1.4s smooth motion

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth linear interpolation
      const lat = startLat + (endLat - startLat) * progress;
      const lng = startLng + (endLng - startLng) * progress;
      setCurrentPos([lat, lng]);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [position?.[0], position?.[1]]);

  if (!currentPos) return null;

  return (
    <Marker position={currentPos} icon={icon}>
      {popupText && <Popup>{popupText}</Popup>}
    </Marker>
  );
}

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [reordering, setReordering] = useState(false);

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
  }, [orderId]);

  useEffect(() => {
    if (!order) return;

    const isTerminal = ['Delivered', 'Cancelled'].includes(order.orderStatus);

    // Stop polling & socket connection if order reaches terminal state
    if (isTerminal) return;

    // Fallback refresh every 20 seconds for active orders
    const interval = setInterval(() => fetchOrderDetails(false), 20000);

    const socket = getSocket();
    if (socket) {
      socket.emit('join-order-room', orderId);
    }

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
  }, [orderId, order?.orderStatus]);

  // Re-Order (Order Again) Handler
  const handleOrderAgain = async () => {
    if (!order?.products || order.products.length === 0) return;
    setReordering(true);
    const toastId = toast.loading('Adding items to your cart...');
    try {
      for (const item of order.products) {
        if (item.type === 'printout') {
          await dispatch(addSingleItem({
            type: 'printout',
            pdfUrl: item.pdfUrl,
            pdfName: item.pdfName,
            pdfSize: item.pdfSize,
            pages: item.pages,
            copies: item.copies || 1,
            binding: item.binding || 'none',
            extras: item.extras || [],
            price: item.price,
            specialInstructions: item.specialInstructions || '',
            orientation: item.orientation || 'portrait',
            paperSize: item.paperSize || 'A4',
            paperQuality: item.paperQuality || 'standard',
            printMode: item.printMode || 'single'
          })).unwrap();
        } else if (item.product) {
          const prodId = typeof item.product === 'object' ? item.product._id : item.product;
          await dispatch(addSingleItem({ productId: prodId, quantity: item.quantity || 1 })).unwrap();
        }
      }
      toast.success('Items added to cart!', { id: toastId });
      navigate('/cart');
    } catch (err) {
      toast.error('Failed to re-add items', { id: toastId });
    } finally {
      setReordering(false);
    }
  };

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
          onClick={() => navigate('/orders')}
          className="mt-3 bg-[#40A2E3] text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          Go to My Orders
        </button>
      </div>
    );
  }

  const isDelivered = order.orderStatus === 'Delivered';
  const isCancelled = order.orderStatus === 'Cancelled';
  const isAccepted = !['Order Placed', 'Cancelled'].includes(order.orderStatus);

  const statusSteps = [
    { key: 'Order Placed', label: 'Order Placed' },
    { key: 'Confirmed', label: 'Confirmed' },
    { key: 'Packing', label: 'Packing' },
    { key: 'Out for Delivery', label: 'Out for Delivery' },
    { key: 'Delivered', label: 'Delivered' }
  ];

  const normalizeStatus = (status) => {
    if (status === 'Preparing') return 'Packing';
    return status;
  };

  const currentNormalizedStatus = normalizeStatus(order.orderStatus);

  const getStepIndex = (status) => {
    if (status === 'Cancelled') return -1;
    if (status === 'Delivered') return 4;
    const idx = statusSteps.findIndex(s => s.key === status || (s.key === 'Packing' && status === 'Preparing'));
    return idx >= 0 ? idx : 0;
  };

  const currentStepIndex = getStepIndex(order.orderStatus);

  // Customer & Delivery Partner Coordinates
  const customerPos = order.customerLocation?.lat && order.customerLocation?.lng
    ? [Number(order.customerLocation.lat), Number(order.customerLocation.lng)]
    : null;

  const agentPos = order.agentLocation?.lat && order.agentLocation?.lng
    ? [Number(order.agentLocation.lat), Number(order.agentLocation.lng)]
    : null;

  // Dynamic ETA & Distance Calculation
  const distanceKm = customerPos && agentPos
    ? calculateDistanceKm(agentPos[0], agentPos[1], customerPos[0], customerPos[1])
    : null;

  const dynamicETA = getDynamicETA(order.orderStatus, distanceKm);

  // Admin details
  const adminName = order.adminDetails?.name || 'Loopers Admin';
  const adminPhone = order.adminDetails?.phone || '+91 98765 43210';

  // Format dates
  const formattedDeliveryDate = order.updatedAt
    ? new Date(order.updatedAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : '';

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 px-1 sm:px-0">

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center text-xs font-bold text-[#64748B] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" />
          My Orders
        </button>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-[#0F172A] dark:text-white">
            Order ID: <span className="font-mono text-[#40A2E3]">{order.customId || `LPR-${order._id.slice(-6).toUpperCase()}`}</span>
          </span>
          {!isDelivered && !isCancelled && (
            <button
              onClick={() => fetchOrderDetails(true)}
              disabled={refreshing}
              title="Refresh order details"
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:text-[#40A2E3] dark:hover:text-[#40A2E3] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#40A2E3]' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================
         1. COMPLETED ORDER HERO CARD (DELIVERED)
      ========================================================= */}
      {isDelivered && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 animate-enter">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                  Order Completed
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#0F172A] dark:text-white mt-1">
                  Order Delivered
                </h2>
                {formattedDeliveryDate && (
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    Delivered on: {formattedDeliveryDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Thank you for shopping with Loopers. Your order has been delivered successfully.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2 border-t border-emerald-500/20">
            <button
              onClick={handleOrderAgain}
              disabled={reordering}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <ShoppingBag size={14} />
              <span>{reordering ? 'Adding to Cart...' : 'Order Again'}</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Home size={14} />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
         2. CANCELLED ORDER HERO CARD
      ========================================================= */}
      {isCancelled && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 animate-enter">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-md shrink-0">
              <XCircle size={26} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-500/15 px-2.5 py-0.5 rounded-full">
                Order Status
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#0F172A] dark:text-white mt-1">
                Order Cancelled
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                This order lifecycle has ended.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2 border-t border-red-500/20">
            <button
              onClick={() => navigate('/')}
              className="bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <ShoppingBag size={14} />
              <span>Browse Products</span>
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <ChevronLeft size={14} />
              <span>Back to My Orders</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
         3. ACTIVE LIVE STATUS TRACKER & RESPONSIVE STEPPER (320px+)
      ========================================================= */}
      {!isCancelled && !isDelivered && (
        <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-black text-[#40A2E3] uppercase tracking-wider bg-[#40A2E3]/10 px-2.5 py-1 rounded-full">
                {dynamicETA}
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white mt-2">
                {currentNormalizedStatus}
              </h2>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#40A2E3]/10 text-[#40A2E3] flex items-center justify-center shrink-0">
              {isAccepted ? <Clock size={22} className="animate-pulse" /> : <Hourglass size={22} className="animate-spin" />}
            </div>
          </div>

          {/* 5-Step Order Progress Stepper - Optimized for 320px+ */}
          <div className="relative pt-2">
            <div className="flex items-start justify-between relative z-10 w-full">
              {statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center min-w-0 flex-1 px-0.5">
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 transition-all shrink-0 ${
                        isPassed
                          ? 'bg-[#40A2E3] border-[#40A2E3] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-[#40A2E3]/20 scale-110' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[8px] sm:text-[11px] font-extrabold mt-1.5 leading-tight break-words w-full ${
                        isPassed ? 'text-[#0F172A] dark:text-white' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar Background */}
            <div className="absolute top-5 sm:top-6 left-5 right-5 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0">
              <div
                className="h-full bg-[#40A2E3] transition-all duration-500"
                style={{ width: `${(currentStepIndex / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* BEFORE ADMIN ACCEPTS: Waiting Notice */}
      {!isAccepted && !isCancelled && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center space-y-2">
          <Hourglass size={26} className="mx-auto text-amber-500 animate-spin" />
          <h4 className="text-xs font-black text-[#0F172A] dark:text-white">Order Received by Loopers Store</h4>
          <p className="text-[11px] text-[#64748B] dark:text-slate-400 max-w-sm mx-auto">
            An admin is reviewing your items. Once accepted, live delivery tracking and delivery partner info will activate.
          </p>
        </div>
      )}

      {/* AFTER ADMIN ACCEPTS: Admin Details & Live Route Map */}
      {isAccepted && !isCancelled && !isDelivered && (
        <>
          {/* Delivery Partner Info */}
          <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#40A2E3]/15 text-[#40A2E3] flex items-center justify-center font-bold text-base shrink-0">
                  🛵
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                    Delivery Partner
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
                <span>Call Partner</span>
              </a>
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <span>📞 Contact: <span className="font-mono font-bold text-[#0F172A] dark:text-white">{adminPhone}</span></span>
              <span className="text-[10px] font-extrabold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">En Route</span>
            </div>
          </div>

          {/* Live Delivery Map with Smooth Marker & Dynamic Dark Tiles */}
          {!customerPos ? (
            <div className="h-64 sm:h-72 w-full rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center p-6 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                <MapPin className="text-[#64748B] dark:text-slate-400" size={24} />
              </div>
              <h4 className="text-xs font-black text-[#0F172A] dark:text-white">Live Tracking Unavailable</h4>
              <p className="text-[10px] text-sys-text-secondary mt-1 max-w-xs leading-normal">
                Precise GPS coordinates were not captured for this delivery address. Delivery will proceed via room details.
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

                {/* Customer Location Marker */}
                <Marker position={customerPos} icon={customerIcon}>
                  <Popup>Delivery Address</Popup>
                </Marker>

                {/* Animated Rider Marker */}
                {agentPos && (
                  <>
                    <AnimatedMarker position={agentPos} icon={agentIcon} popupText={`Rider: ${adminName}`} />
                    <Polyline positions={[agentPos, customerPos]} color="#40A2E3" weight={4} dashArray="6, 10" />
                  </>
                )}
              </MapContainer>

              {!agentPos && (
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-200/85 dark:border-slate-700/85 px-3.5 py-2.5 rounded-xl flex items-center space-x-2.5 text-[10px] text-sys-text-secondary shadow-lg z-[400] max-w-max mx-auto animate-fade-in">
                  <AlertCircle className="text-amber-500 shrink-0" size={14} />
                  <span className="font-semibold">Delivery partner live GPS updates starting shortly.</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* =========================================================
         4. ITEMS SUMMARY & PAYMENT INFO
      ========================================================= */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-3 shadow-xs">
        <h4 className="text-xs font-extrabold text-[#0F172A] dark:text-white">Order Summary</h4>

        <div className="space-y-2">
          {order.products?.map((item, idx) => (
            <div key={idx} className="flex flex-col justify-center text-xs pb-2 border-b border-slate-100/50 dark:border-slate-800/50 last:border-0 last:pb-0">
              <div className="flex justify-between items-center">
                <span className="text-[#0F172A] dark:text-slate-200 font-medium">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-mono font-bold text-[#0F172A] dark:text-white">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
              {item.type === 'printout' && (
                <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 font-semibold">
                  <p>
                    Config: {item.pages} pages • {item.copies} copies • {item.printMode === 'single' ? 'Single side' : 'Double side'} • {item.binding !== 'none' ? item.binding : 'No binding'}
                  </p>
                  {item.specialInstructions && (
                    <p className="text-[9px] text-[#40A2E3] italic font-bold">
                      Instructions: "{item.specialInstructions}"
                    </p>
                  )}
                  {item.pdfUrl && (
                    <button
                      onClick={async () => {
                        const toastId = toast.loading('Downloading document...');
                        try {
                          const res = await orderService.downloadPrintout(order._id, idx);
                          const blob = new Blob([res.data], { type: 'application/pdf' });
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', item.pdfName || 'printout.pdf');
                          document.body.appendChild(link);
                          link.click();
                          link.parentNode.removeChild(link);
                          window.URL.revokeObjectURL(url);
                          toast.success('Download complete', { id: toastId });
                        } catch (err) {
                          console.error(err);
                          toast.error('Failed to download document', { id: toastId });
                        }
                      }}
                      className="text-[#40A2E3] hover:underline font-extrabold inline-flex items-center gap-1 mt-1 text-left"
                    >
                      Download Document
                    </button>
                  )}
                </div>
              )}
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
            <span className={`font-bold ${isCancelled ? 'text-red-500' : 'text-[#22C55E]'}`}>{order.paymentStatus}</span>
          </div>
          <div className="flex justify-between font-black text-sm text-[#0F172A] dark:text-white pt-1">
            <span>Total Amount</span>
            <span className="font-mono text-[#40A2E3]">₹{order.totalPrice?.toFixed(2)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
