import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { 
  ShoppingBag, Search, Filter, RefreshCw, Calendar, 
  MapPin, Phone, CheckCircle2, AlertCircle, Clock, 
  Eye, X, ArrowUpDown, ChevronRight, Check, Ban
} from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters and Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price-high, price-low

  // Modal details
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch initial orders and request notification permissions
  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    const getOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/orders');
        if (res.data.success) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.error('Error fetching admin orders:', err);
        toast.error('Failed to load orders register');
      } finally {
        setLoading(false);
      }
    };
    getOrders();
  }, [refreshTrigger]);

  // Real-time socket event subscription
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Admin socket connected');
      socket.emit('join-admin-room');
    });

    socket.on('orderCreated', (newOrder) => {
      console.log('Socket orderCreated received:', newOrder);
      setOrders((prev) => {
        // Prevent duplicates
        if (prev.some((o) => o._id === newOrder._id)) return prev;
        return [newOrder, ...prev];
      });

      // Play a louder, more noticeable notification sound (Ding-Dong)
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Ding
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain1.gain.setValueAtTime(0.6, audioCtx.currentTime); // Louder
        gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc1.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 0.4);

        // Dong
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
        gain2.gain.setValueAtTime(0.6, audioCtx.currentTime + 0.3);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.9);
        osc2.start(audioCtx.currentTime + 0.3);
        osc2.stop(audioCtx.currentTime + 0.9);
      } catch (e) {
        console.error("Audio playback blocked", e);
      }

      // Browser Notification
      if (Notification.permission === 'granted') {
        new Notification('New Order Received!', {
          body: `Order #${newOrder._id.slice(-8)} from ${newOrder.user?.name || 'Customer'} (₹${newOrder.totalPrice})`,
          icon: '/favicon.ico' // Or any specific icon path if available
        });
      }

      toast.success(
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-[#111827] uppercase tracking-wider text-[11px] mb-0.5">🔔 New Order Received!</span>
          <span className="text-[10px] text-[#6B7280]">
            Order #{newOrder._id.slice(-8)} from {newOrder.user?.name || 'Customer'} (₹{newOrder.totalPrice})
          </span>
        </div>,
        { duration: 6000 }
      );
    });

    socket.on('orderUpdated', (updatedOrder) => {
      console.log('Socket orderUpdated received:', updatedOrder);
      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
      
      // Update selected order details modal if it's currently open
      setSelectedOrder((curr) => {
        if (curr && curr._id === updatedOrder._id) {
          return updatedOrder;
        }
        return curr;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update order status lifecycle
  const handleTransition = async (orderId, endpoint) => {
    try {
      const res = await api.post(`/api/admin/orders/${orderId}/${endpoint}`);
      if (res.data.success) {
        toast.success(res.data.message);
        // The socket listener 'orderUpdated' will automatically trigger updating the UI state
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  // Helper for status buttons
  const renderStatusActionButtons = (order) => {
    const { _id, orderStatus } = order;
    if (orderStatus === 'Placed') {
      return (
        <button 
          onClick={() => handleTransition(_id, 'accept')}
          className="flex items-center gap-1 bg-[#22C55E] hover:bg-[#16A34A] text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-sm shadow-[#22C55E]/10 tracking-wider"
        >
          <Check className="w-3.5 h-3.5" /> Accept Order
        </button>
      );
    }
    if (orderStatus === 'Accepted') {
      return (
        <button 
          onClick={() => handleTransition(_id, 'pack')}
          className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-sm shadow-violet-600/10 tracking-wider"
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Pack Items
        </button>
      );
    }
    if (orderStatus === 'Packed') {
      return (
        <button 
          onClick={() => handleTransition(_id, 'out-for-delivery')}
          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-sm shadow-amber-500/10 tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Hand Over to Delivery
        </button>
      );
    }
    if (orderStatus === 'Out For Delivery') {
      return (
        <button 
          onClick={() => handleTransition(_id, 'deliver')}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-600/10 tracking-wider"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
        </button>
      );
    }
    return null;
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  // Compute Statistics
  const getStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.orderStatus === 'Placed').length;
    const accepted = orders.filter(o => o.orderStatus === 'Accepted').length;
    const packed = orders.filter(o => o.orderStatus === 'Packed').length;
    const outForDelivery = orders.filter(o => o.orderStatus === 'Out For Delivery').length;
    const delivered = orders.filter(o => ['Delivered', 'Completed'].includes(o.orderStatus)).length;
    const cancelled = orders.filter(o => o.orderStatus === 'Cancelled').length;
    return { total, pending, accepted, packed, outForDelivery, delivered, cancelled };
  };

  const stats = getStats();

  // Filter and Sort Processing
  const processedOrders = () => {
    let result = [...orders];

    // Search query matching (Order ID, Name, Phone)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o._id.toLowerCase().includes(q) || 
        (o.user?.name && o.user.name.toLowerCase().includes(q)) ||
        (o.address?.phone && o.address.phone.includes(q))
      );
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'DELIVERED') {
        result = result.filter(o => ['Delivered', 'Completed'].includes(o.orderStatus));
      } else {
        result = result.filter(o => o.orderStatus === statusFilter);
      }
    }

    // Payment Method Filter
    if (paymentFilter !== 'ALL') {
      result = result.filter(o => o.paymentMethod === paymentFilter);
    }

    // Sort order
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.totalPrice - a.totalPrice);
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => a.totalPrice - b.totalPrice);
    }

    return result;
  };

  const filteredOrders = processedOrders();

  if (loading && orders.length === 0) return <LoadingSpinner message="Opening Admin Orders Ledger..." />;

  return (
    <div className="space-y-6 py-4 max-w-7xl mx-auto">
      {/* Header and Sync Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pl-1">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#22C55E]" />
            <h2 className="text-2xl font-black text-[#111827]">Order Lifecycle Register</h2>
          </div>
          <p className="text-xs text-[#6B7280] font-semibold mt-0.5">
            Centralized admin dispatcher console. Syncing live via Socket.io channels.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center gap-1 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase hover:bg-[#22C55E]/20 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Pull Fresh List
          </button>
        </div>
      </div>

      {/* Stats Cards (Interactive Status Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {[
          { key: 'ALL', label: 'All Orders', count: stats.total, color: 'border-slate-200 text-slate-700 bg-white' },
          { key: 'Placed', label: 'Pending', count: stats.pending, color: 'border-blue-200 text-blue-600 bg-blue-50/50' },
          { key: 'Accepted', label: 'Accepted', count: stats.accepted, color: 'border-amber-200 text-amber-600 bg-amber-50/50' },
          { key: 'Packed', label: 'Packed', count: stats.packed, color: 'border-violet-200 text-violet-600 bg-violet-50/50' },
          { key: 'Out For Delivery', label: 'Out for Delivery', count: stats.outForDelivery, color: 'border-green-200 text-[#22C55E] bg-green-50/50' },
          { key: 'DELIVERED', label: 'Delivered', count: stats.delivered, color: 'border-emerald-200 text-emerald-600 bg-emerald-50/50' },
          { key: 'Cancelled', label: 'Cancelled', count: stats.cancelled, color: 'border-rose-200 text-rose-600 bg-rose-50/50' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            className={`border rounded-2xl p-4 text-left shadow-soft transition-all duration-200 ${item.color} ${statusFilter === item.key ? 'ring-2 ring-offset-2 ring-[#22C55E] scale-105 shadow-md' : 'hover:scale-102'}`}
          >
            <span className="text-[9px] font-extrabold uppercase tracking-wider block mb-1 opacity-80">{item.label}</span>
            <p className="text-xl font-black">{item.count}</p>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E7EB] p-4.5 rounded-3xl shadow-soft flex flex-col lg:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#6B7280]" />
          <input 
            type="text" 
            placeholder="Search by ID, customer name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#22C55E] transition-all bg-[#F8FAFC]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:ml-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[#6B7280]" />
            <span className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider">Payment Method:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs font-bold border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#22C55E] bg-white cursor-pointer"
            >
              <option value="ALL">All Methods</option>
              <option value="COD">Cash On Delivery (COD)</option>
              <option value="UPI">UPI Payment</option>
              <option value="Card">Credit/Debit Card</option>
              <option value="Wallet">Digital Wallet</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-4 h-4 text-[#6B7280]" />
            <span className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#22C55E] bg-white cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Highest Price</option>
              <option value="price-low">Lowest Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List Table / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-16 text-center shadow-soft">
          <AlertCircle className="w-10 h-10 text-[#6B7280] mx-auto mb-3 animate-pulse" />
          <h3 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider">No matching orders found</h3>
          <p className="text-xs text-[#6B7280] font-semibold mt-1">Try relaxing filters or changing your search criteria.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] font-extrabold uppercase text-[10px] bg-slate-50/50">
                  <th className="py-4.5 px-6">Order ID</th>
                  <th className="py-4.5 px-4">Date</th>
                  <th className="py-4.5 px-4">Customer Details</th>
                  <th className="py-4.5 px-4">Products</th>
                  <th className="py-4.5 px-4 text-right">Amount</th>
                  <th className="py-4.5 px-4">Payment</th>
                  <th className="py-4.5 px-4">Status</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-semibold text-[#6B7280]">
                {filteredOrders.map((order) => {
                  const itemsSummary = order.products.map(p => `${p.name} x${p.quantity}`).join(', ');
                  return (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 px-6 font-mono text-[11px] font-bold text-[#111827]">
                        #{order._id.slice(-8)}
                      </td>
                      <td className="py-4.5 px-4 font-mono text-[10px]">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4.5 px-4 space-y-0.5">
                        <p className="font-bold text-[#111827]">{order.address?.name || order.user?.name || 'Customer'}</p>
                        <p className="text-[10px] flex items-center gap-1"><Phone className="w-3 h-3" /> {order.address?.phone}</p>
                      </td>
                      <td className="py-4.5 px-4 max-w-xs">
                        <span className="line-clamp-1 text-[11px] text-[#111827] font-medium" title={itemsSummary}>
                          {itemsSummary}
                        </span>
                      </td>
                      <td className="py-4.5 px-4 text-right font-black text-[#111827] text-[13px]">
                        ₹{order.totalPrice}
                      </td>
                      <td className="py-4.5 px-4 space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                          {order.paymentMethod}
                        </span>
                        <span className={`block text-[9px] font-bold uppercase ${order.paymentStatus === 'Completed' ? 'text-emerald-600' : order.paymentStatus === 'Refunded' ? 'text-violet-600' : 'text-amber-500'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4.5 px-4">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {renderStatusActionButtons(order)}
                          
                          {/* Cancel Order action */}
                          {!['Delivered', 'Completed', 'Cancelled'].includes(order.orderStatus) && (
                            <button
                              onClick={() => handleTransition(order._id, 'cancel')}
                              className="p-1.5 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              title="Cancel Order"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          <button 
                            onClick={() => handleOpenDetails(order)}
                            className="p-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal (Completely Purged of Agent Info) */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            {/* Header */}
            <div className="bg-slate-50 border-b border-[#E5E7EB] p-5 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider">
                  Order Details Summary
                </h3>
                <span className="font-mono text-[10px] text-[#6B7280]">ID: #{selectedOrder._id}</span>
              </div>
              <button 
                onClick={() => { setShowModal(false); setSelectedOrder(null); }} 
                className="p-1 text-[#6B7280] hover:text-[#111827] border rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-xs font-semibold text-[#6B7280] max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                {/* Left side info */}
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Customer</span>
                    <p className="text-sm font-extrabold text-[#111827]">{selectedOrder.address?.name || selectedOrder.user?.name}</p>
                    <p className="text-[10px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" /> {selectedOrder.address?.phone || selectedOrder.user?.phone || 'No Phone Registered'}
                    </p>
                  </div>

                  {/* Delivery Location */}
                  <div className="space-y-1.5 pt-2 border-t border-dashed">
                    <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Delivery Address</span>
                    {selectedOrder.address ? (
                      <p className="text-[#111827] leading-relaxed">
                        {selectedOrder.address.houseNumber}, {selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                        {selectedOrder.address.landmark && (
                          <span className="block text-[10px] text-[#6B7280] mt-1">Landmark: {selectedOrder.address.landmark}</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-[#EF4444]">No delivery address specified</p>
                    )}
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-1.5 pt-2 border-t border-dashed">
                    <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Payment Details</span>
                    <div className="flex justify-between text-[#111827] text-[11px] pt-0.5">
                      <span>Method: <strong className="uppercase">{selectedOrder.paymentMethod}</strong></span>
                      <span>Status: <strong className="uppercase text-emerald-600">{selectedOrder.paymentStatus}</strong></span>
                    </div>
                    {selectedOrder.paymentId && (
                      <p className="text-[9px] font-mono mt-1 text-[#6B7280]">Settlement ID: {selectedOrder.paymentId}</p>
                    )}
                  </div>
                </div>

                {/* Right side info: Products list & Timeline */}
                <div className="space-y-4">
                  {/* Products */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Order Items</span>
                    <div className="bg-slate-50 border rounded-2xl p-4.5 space-y-3.5 max-h-48 overflow-y-auto">
                      {selectedOrder.products.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div className="min-w-0 pr-2">
                            <span className="text-[#111827] font-bold block line-clamp-1">{item.name}</span>
                            <span className="text-[10px]">Qty: {item.quantity}</span>
                          </div>
                          <span className="font-extrabold text-[#111827]">₹{Math.round(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-center text-xs font-bold text-[#111827]">
                        <span>Paid Total</span>
                        <span className="text-sm font-black text-[#22C55E]">₹{selectedOrder.totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2.5 pt-2 border-t border-dashed">
                    <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Order Lifecycle Timeline</span>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 ? (
                        selectedOrder.trackingHistory.map((history, idx) => (
                          <div key={idx} className="flex gap-2 text-[10px]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mt-1 shrink-0"></div>
                            <div>
                              <p className="font-bold text-[#111827] uppercase">{history.status}</p>
                              <p className="text-[9px] text-[#6B7280] font-mono">
                                {new Date(history.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex gap-2 text-[10px]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mt-1 shrink-0"></div>
                          <div>
                            <p className="font-bold text-[#111827] uppercase">PLACED</p>
                            <p className="text-[9px] text-[#6B7280] font-mono">
                              {new Date(selectedOrder.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="bg-slate-50 border-t border-[#E5E7EB] p-4.5 flex justify-end gap-3">
              <button 
                onClick={() => { setShowModal(false); setSelectedOrder(null); }} 
                className="text-xs font-bold text-[#6B7280] hover:text-[#111827] border px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-all uppercase tracking-wider"
              >
                Close Window
              </button>
              {renderStatusActionButtons(selectedOrder)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
