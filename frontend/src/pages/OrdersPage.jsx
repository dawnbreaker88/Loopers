import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import orderService from '../services/orderService.js';
import api from '../services/api.js';
import { addSingleItem } from '../store/cartSlice.js';

import { PackageCheck, ArrowRight, RefreshCw, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function OrdersPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderService.getOrders();
        if (response && response.success) {
          setOrders(response.orders || []);
        } else if (Array.isArray(response)) {
          setOrders(response);
        } else {
          setOrders(response?.orders || []);
        }
      } catch (err) {
        console.error('Fetch Orders Error:', err);
        toast.error('Failed to load orders history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);


  const handleReorder = async (order) => {
    if (!order || !order.products || order.products.length === 0) {
      toast.error('No items found in this order to reorder');
      return;
    }

    try {
      const addedItems = [];
      const skippedItems = [];

      for (const item of order.products) {
        try {
          const productId = typeof item.product === 'object' ? item.product._id : item.product;
          const itemName = item.name || 'Item';

          if (!productId) {
            skippedItems.push(itemName);
            continue;
          }

          // Fetch fresh product data from backend DB
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
        navigate('/cart');
      } else {
        toast.error(`Unable to reorder: items are currently out of stock (${skippedItems.join(', ')})`);
      }
    } catch (err) {
      console.error('Reorder error:', err);
      toast.error('Failed to reorder items');
    }
  };


  const normalizeStatus = (status) => {
    if (status === 'Preparing') return 'Packing';
    return status;
  };

  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'Delivered':
        return 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20';
      case 'Out for Delivery':
        return 'bg-[#40A2E3]/10 text-[#40A2E3] border-[#40A2E3]/20';
      case 'Packing':
      case 'Confirmed':
      case 'Order Placed':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Cancelled':
        return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40A2E3]"></div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-[#40A2E3]/10 text-[#40A2E3] rounded-full flex items-center justify-center">
          <PackageCheck size={36} />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white">No Previous Orders</h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
            You haven't placed any orders yet. Try ordering late night munchies or stationery!
          </p>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="bg-[#40A2E3] text-white text-xs font-black px-6 py-3 rounded-2xl shadow-md shadow-[#40A2E3]/20 hover:opacity-90 active:scale-95 transition-all"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      
      <div className="flex justify-between items-center">
        <h1 className="text-base font-black text-[#0F172A] dark:text-white">My Orders ({orders.length})</h1>
        <span className="text-xs font-bold text-[#40A2E3]">Loopers Quick History</span>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const displayStatus = normalizeStatus(order.orderStatus);
          const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div 
              key={order._id}
              className="bg-sys-surface border border-sys-border rounded-2xl p-4 space-y-3 shadow-xs hover:border-[#40A2E3]/40 transition-colors"
            >
              {/* Order Header */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div>
                  <span className="text-xs font-black text-[#0F172A] dark:text-white font-mono">
                    ID: {order.customId || `LPR-${order._id.slice(-6).toUpperCase()}`}
                  </span>
                  <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-0.5">{orderDate}</p>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getStatusColor(order.orderStatus)}`}>
                  {displayStatus}
                </span>
              </div>

              {/* Order Items Preview */}
              <div className="space-y-1">
                {order.products?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-[#0F172A] dark:text-slate-200">
                    <span className="truncate max-w-[75%] font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono text-[#64748B] dark:text-slate-400">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer Total & Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-bold uppercase">Total Amount</span>
                  <p className="text-sm font-black text-[#0F172A] dark:text-white font-mono">
                    ₹{order.totalPrice?.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReorder(order)}
                    className="flex items-center text-xs font-extrabold text-[#40A2E3] bg-[#40A2E3]/10 px-3 py-1.5 rounded-xl border border-[#40A2E3]/20 hover:bg-[#40A2E3]/20 active:scale-95 transition-all"
                  >
                    <RefreshCw size={12} className="mr-1" />
                    <span>Reorder</span>
                  </button>

                  <button
                    onClick={() => navigate(`/tracking/${order._id}`)}
                    className="flex items-center text-xs font-extrabold bg-[#40A2E3] text-white px-3.5 py-1.5 rounded-xl shadow-xs hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span>Track</span>
                    <ChevronRight size={14} className="ml-0.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
