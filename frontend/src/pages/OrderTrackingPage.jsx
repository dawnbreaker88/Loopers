import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import orderService from '../services/orderService.js';
import { MapPin, Phone, Clock, CheckCircle2, ChevronLeft, AlertCircle, Hourglass, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { subscribeToSocketEvents, getSocket } from '../services/socketService.js';

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
  const { user } = useSelector((state) => state.auth);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
          onClick={() => navigate('/profile')}
          className="mt-3 bg-[#40A2E3] text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          Go to My Orders
        </button>
      </div>
    );
  }

  // Check if admin has accepted order
  const isAccepted = !['Order Placed', 'Cancelled'].includes(order.orderStatus);

  const statusSteps = [
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

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20">

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/profile')}
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

        {/* 5-Step Order Progress Stepper */}
        {order.orderStatus !== 'Cancelled' && (
          <div className="relative pt-2">
            <div className="flex items-center justify-between relative z-10">
              {statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center flex-1">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isPassed
                        ? 'bg-[#40A2E3] border-[#40A2E3] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-[#40A2E3]/20 scale-110' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-bold mt-2 truncate w-full ${isPassed ? 'text-[#0F172A] dark:text-white' : 'text-slate-400'
                      }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress Line */}
            <div className="absolute top-5.5 sm:top-6 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0">
              <div
                className="h-full bg-[#40A2E3] transition-all duration-500"
                style={{ width: `${(currentStepIndex / 4) * 100}%` }}
              ></div>
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
                    <a
                      href={item.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#40A2E3] hover:underline font-extrabold inline-flex items-center gap-1 mt-1"
                    >
                      View Uploaded Document
                    </a>
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
