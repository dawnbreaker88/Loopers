import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import api from '../services/api.js';
import productService from '../services/productService.js';
import orderService from '../services/orderService.js';

// Sub-components
import StatusBadge from '../components/StatusBadge.jsx';
import ProductCard from '../components/ProductCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

// Icons
import { 
  ShoppingBag, ShoppingCart, ShieldAlert, Truck, 
  MapPin, Phone, CheckSquare, PlusCircle, BarChart3, 
  Users, Activity, CheckCircle, RefreshCw, Power, Star, ChevronRight,
  Package, UserCheck, XCircle, Compass, DollarSign, Ban, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const getCoordsFromAddress = (address) => {
  if (!address || !address.pincode) return { lat: 12.9780, lng: 77.6400 };
  const pinNum = parseInt(address.pincode) || 560001;
  const hash = (pinNum % 100) + (address.street ? address.street.length : 0);
  const latOffset = ((hash * 17) % 100 - 50) / 2500;
  const lngOffset = ((hash * 31) % 100 - 50) / 2500;
  return {
    lat: 12.9724 + latOffset,
    lng: 77.5951 + lngOffset
  };
};

/* ============================================================================
   CUSTOMER SUB-DASHBOARD
   ============================================================================ */
function CustomerDashboard() {
  const { user } = useAuth();
  const { addToCart, updateQuantity, removeFromCart, items } = useCart();
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [ordersRes, prodRes] = await Promise.all([
          orderService.getOrders(),
          productService.getProducts()
        ]);

        if (ordersRes.success) {
          const list = ordersRes.orders || [];
          setRecentOrders(list.slice(0, 3));
          
          const total = list.length;
          const active = list.filter(o => !['Delivered', 'Cancelled'].includes(o.orderStatus)).length;
          const delivered = list.filter(o => o.orderStatus === 'Delivered').length;
          
          setStats({ total, active, delivered });
        }

        if (prodRes.success) {
          // Select 4 random recommended products
          const prods = prodRes.products || [];
          setRecommendations(prods.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  return (
    <div class="space-y-10">
      {/* Welcome Message */}
      <div class="bg-white border border-[#E5E7EB] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-soft">
        <div class="space-y-1">
          <h2 class="text-2xl font-black text-[#111827]">Welcome back, {user?.name}! 👋</h2>
          <p class="text-xs text-[#6B7280] font-semibold">Browse our products and order your fresh groceries now!</p>
        </div>
        <button 
          onClick={() => navigate('/products')}
          class="bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-extrabold px-5 py-3 rounded-xl transition-all shadow-sm shadow-[#22C55E]/10 uppercase tracking-wider flex items-center gap-2"
        >
          Browse Products <ShoppingBag class="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white border border-[#E5E7EB] p-4.5 rounded-2xl shadow-soft">
          <span class="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">Total Orders</span>
          <p class="text-2xl font-black text-[#111827]">{stats.total}</p>
        </div>
        <div class="bg-white border border-[#E5E7EB] p-4.5 rounded-2xl shadow-soft">
          <span class="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">Active Deliveries</span>
          <p class="text-2xl font-black text-[#22C55E]">{stats.active}</p>
        </div>
        <div class="bg-white border border-[#E5E7EB] p-4.5 rounded-2xl shadow-soft">
          <span class="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">Completed Rides</span>
          <p class="text-2xl font-black text-[#111827]">{stats.delivered}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Recent Orders */}
        <div class="md:col-span-6 space-y-4">
          <div class="flex justify-between items-center pl-1">
            <h3 class="font-extrabold text-[#111827] text-md">Recent Orders</h3>
            <Link to="/orders" class="text-xs font-bold text-[#22C55E] hover:underline flex items-center gap-0.5">
              View all <ChevronRight class="w-3.5 h-3.5" />
            </Link>
          </div>

          <div class="space-y-3">
            {recentOrders.length === 0 ? (
              <div class="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center text-xs text-[#6B7280] font-semibold shadow-soft">
                No orders placed yet.
              </div>
            ) : (
              recentOrders.map((order, idx) => (
                <div key={idx} class="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-soft flex justify-between items-center text-xs">
                  <div class="space-y-1">
                    <p class="font-bold text-[#111827]">Order #{order._id.slice(-8)}</p>
                    <p class="text-[10px] text-[#6B7280] font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <span class="text-[10px] font-extrabold text-[#22C55E] block">₹{order.totalPrice}</span>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <StatusBadge status={order.orderStatus} />
                    <Link to={`/tracking/${order._id}`} class="text-[10px] font-black text-[#22C55E] hover:underline uppercase tracking-wider">
                      Track Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick actions & Recommended Products */}
        <div class="md:col-span-6 space-y-4">
          <h3 class="font-extrabold text-[#111827] text-md pl-1">Popular Picks</h3>
          
          <div class="grid grid-cols-2 gap-4">
            {recommendations.map((prod) => {
              const inCartItem = items.find(i => i.product?._id === prod._id);
              const count = inCartItem ? inCartItem.quantity : 0;
              
              return (
                <ProductCard 
                  key={prod._id}
                  product={prod}
                  quantityInCart={count}
                  onAdd={addToCart}
                  onUpdate={updateQuantity}
                  onRemove={removeFromCart}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ADMIN SUB-DASHBOARD
   ============================================================================ */
function AdminDashboardView() {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, users, agents, orders, products
  const [stats, setStats] = useState({ revenue: 0, activeOrders: 0, totalProducts: 0, totalAgents: 0 });
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    revenue: 0,
    deliveryCharges: 0
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Product Creation
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('Groceries');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDiscount, setProdDiscount] = useState('0');
  const [prodStock, setProdStock] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodUnit, setProdUnit] = useState('1 Kg');
  const [prodImage, setProdImage] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [prodRes, orderRes, agentRes, usersRes, analyticsRes] = await Promise.all([
          productService.getProducts(),
          orderService.getOrders(),
          orderService.getAgents(),
          api.get('/api/admin/users'),
          api.get('/api/admin/analytics')
        ]);

        if (prodRes.success) setProducts(prodRes.products || []);
        if (orderRes.success) setOrders(orderRes.orders || []);
        if (agentRes.success) setAgents(agentRes.agents || []);
        if (usersRes.data.success) setUsers(usersRes.data.users || []);
        if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);

        const list = orderRes.orders || [];
        const completed = list.filter(o => o.orderStatus === 'Delivered');
        const active = list.filter(o => !['Delivered', 'Cancelled'].includes(o.orderStatus));
        const totalRevenue = completed.reduce((sum, o) => sum + o.totalPrice, 0);

        setStats({
          revenue: Math.round(totalRevenue),
          activeOrders: active.length,
          totalProducts: prodRes.products?.length || 0
        });
      } catch (err) {
        console.error('Error loading admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [refreshTrigger]);

  const handleUpdateUserStatus = async (userId, status, isActive) => {
    try {
      const res = await api.put(`/api/admin/users/${userId}/status`, { status, isActive });
      if (res.data.success) {
        toast.success(`User status updated to ${status}`);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };



  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await productService.createProduct({
        name: prodName, description: prodDesc, category: prodCategory,
        price: Number(prodPrice), discount: Number(prodDiscount || 0),
        stock: Number(prodStock), brand: prodBrand, unit: prodUnit, image: prodImage
      });
      if (res.success) {
        toast.success('Product created successfully');
        setRefreshTrigger(prev => prev + 1);
        setShowProductForm(false);
        setProdName(''); setProdDesc(''); setProdPrice(''); setProdBrand(''); setProdImage('');
      }
    } catch (err) {
      toast.error('Failed to create product');
    }
  };

  const handleOrderTransition = async (orderId, endpoint) => {
    try {
      const res = await api.post(`/api/admin/orders/${orderId}/${endpoint}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order update failed');
    }
  };

  if (loading && refreshTrigger === 0) return <LoadingSpinner message="Loading Admin Panel..." />;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pl-1">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-[#EF4444]" />
          <h2 className="text-2xl font-black text-[#111827]">System Admin Control</h2>
        </div>
        <button 
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="flex items-center gap-1 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase hover:bg-[#22C55E]/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Refresh Console
        </button>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-soft">
          <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">Total Orders</span>
          <p className="text-2xl font-black text-[#111827]">{analytics.totalOrders}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-soft">
          <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">Active / Completed</span>
          <p className="text-2xl font-black text-[#22C55E]">{analytics.activeOrders} / {analytics.completedOrders}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-soft">
          <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">Total Revenue</span>
          <p className="text-2xl font-black text-[#111827]">₹{Math.round(analytics.revenue)}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-soft">
          <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">Delivery Charges</span>
          <p className="text-2xl font-black text-[#111827]">₹{analytics.deliveryCharges}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB] gap-2 overflow-x-auto pb-0.5 font-extrabold text-xs">
        {[
          { id: 'analytics', label: 'Dispatcher Hub', icon: Activity },
          { id: 'users', label: 'Users Management', icon: Users },
          { id: 'products', label: 'Inventory Catalog', icon: Package },
          { id: 'orders', label: 'Orders Register', icon: CheckCircle }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 pb-3 px-4 border-b-2 uppercase tracking-wider ${activeTab === t.id ? 'text-[#22C55E] border-[#22C55E]' : 'text-[#6B7280] border-transparent hover:text-[#111827]'}`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Panels */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-soft space-y-4">
            <h3 className="font-extrabold text-[#111827] text-md">Live Orders Monitor</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {orders.filter(o => !['Completed', 'Cancelled'].includes(o.orderStatus)).map((order, idx) => (
                <div key={idx} className="p-3 border border-[#E5E7EB] rounded-xl bg-slate-50 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-[#6B7280] block font-mono">#{order._id.slice(-8)}</span>
                      <span className="font-black text-[#111827]">₹{order.totalPrice} • {order.products.length} Items</span>
                    </div>
                    <StatusBadge status={order.orderStatus} />
                  </div>
                  <div className="flex justify-between items-center border-t border-[#E5E7EB] pt-2">
                    <div className="flex gap-2">
                      {order.orderStatus === 'Placed' && <button onClick={() => handleOrderTransition(order._id, 'accept')} className="bg-[#22C55E] text-white px-2 py-1 rounded">Accept</button>}
                      {order.orderStatus === 'Accepted' && <button onClick={() => handleOrderTransition(order._id, 'pack')} className="bg-[#22C55E] text-white px-2 py-1 rounded">Pack</button>}
                      {order.orderStatus === 'Packed' && <button onClick={() => handleOrderTransition(order._id, 'out-for-delivery')} className="bg-[#22C55E] text-white px-2 py-1 rounded">Out for Delivery</button>}
                      {order.orderStatus === 'Out For Delivery' && <button onClick={() => handleOrderTransition(order._id, 'deliver')} className="bg-[#22C55E] text-white px-2 py-1 rounded">Deliver</button>}
                      <button onClick={() => handleOrderTransition(order._id, 'cancel')} className="bg-rose-500 text-white px-2 py-1 rounded">Cancel</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-soft space-y-4">
          <h3 className="font-extrabold text-[#111827] text-md">Users Management</h3>
          <div className="overflow-x-auto text-xs text-left border-collapse">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] font-extrabold uppercase text-[10px]">
                  <th className="pb-3 pr-2">Name</th>
                  <th className="pb-3 px-2">Email</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {users.map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 pr-2 font-bold">{u.name}</td>
                    <td className="py-3 px-2 font-mono">{u.email}</td>
                    <td className="py-3 px-2 font-semibold text-[#6B7280]">{u.role.toUpperCase()}</td>
                    <td className="py-3 px-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : u.status === 'suspended' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 pl-2 text-right space-x-1">
                      {u.status !== 'active' && (
                        <button 
                          onClick={() => handleUpdateUserStatus(u._id, 'active', true)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-1 rounded"
                        >
                          Activate
                        </button>
                      )}
                      {u.status === 'active' && (
                        <>
                          <button 
                            onClick={() => handleUpdateUserStatus(u._id, 'suspended', true)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-extrabold px-2 py-1 rounded"
                          >
                            Suspend
                          </button>
                          <button 
                            onClick={() => handleUpdateUserStatus(u._id, 'inactive', false)}
                            className="bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-extrabold px-2 py-1 rounded"
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pl-1">
            <h3 className="font-extrabold text-[#111827] text-md">Stock Inventory ({products.length})</h3>
            <button 
              onClick={() => setShowProductForm(!showProductForm)}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" /> Add Item
            </button>
          </div>

          {showProductForm && (
            <form onSubmit={handleCreateProduct} className="bg-white border border-[#E5E7EB] p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Product Name</label>
                <input 
                  type="text" required placeholder="Fortune Soya Oil" 
                  value={prodName} onChange={e => setProdName(e.target.value)}
                  className="w-full border border-[#E5E7EB] text-xs font-semibold rounded-lg p-2.5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Description</label>
                <input 
                  type="text" required placeholder="Healthy refined soyabean oil" 
                  value={prodDesc} onChange={e => setProdDesc(e.target.value)}
                  className="w-full border border-[#E5E7EB] text-xs font-semibold rounded-lg p-2.5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Category</label>
                <select 
                  value={prodCategory} onChange={e => setProdCategory(e.target.value)}
                  className="w-full border border-[#E5E7EB] text-xs font-semibold rounded-lg p-2.5 bg-white"
                >
                  {['Groceries', 'Vegetables', 'Fruits', 'Dairy', 'Beverages', 'Snacks', 'Household'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Price (₹)</label>
                <input 
                  type="number" required placeholder="150"
                  value={prodPrice} onChange={e => setProdPrice(e.target.value)}
                  className="w-full border border-[#E5E7EB] text-xs font-semibold rounded-lg p-2.5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Stock</label>
                <input 
                  type="number" required placeholder="50"
                  value={prodStock} onChange={e => setProdStock(e.target.value)}
                  className="w-full border border-[#E5E7EB] text-xs font-semibold rounded-lg p-2.5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Brand</label>
                <input 
                  type="text" required placeholder="Fortune"
                  value={prodBrand} onChange={e => setProdBrand(e.target.value)}
                  className="w-full border border-[#E5E7EB] text-xs font-semibold rounded-lg p-2.5"
                />
              </div>
              <div className="col-span-1 md:col-span-3 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowProductForm(false)} className="text-xs font-bold text-[#6B7280] hover:text-[#111827]">Cancel</button>
                <button type="submit" className="bg-[#22C55E] text-white text-xs font-extrabold px-5 py-2 rounded-lg">Register</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {products.map((prod, idx) => (
              <div key={idx} className="bg-white border border-[#E5E7EB] p-4 rounded-xl flex gap-3 items-center">
                <img src={prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=80&q=80'} alt={prod.name} className="w-10 h-10 object-cover rounded-lg border" />
                <div className="min-w-0 flex-grow text-xs font-semibold">
                  <span className="text-[9px] text-[#22C55E] block font-bold">{prod.brand} • {prod.category}</span>
                  <h4 className="text-[#111827] line-clamp-1">{prod.name}</h4>
                  <div className="flex justify-between items-center text-[#6B7280] font-bold mt-1 text-[10px]">
                    <span>Stock: {prod.stock}</span>
                    <span className="text-[#111827] font-black">₹{prod.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-soft">
          <h3 className="font-extrabold text-[#111827] text-md mb-4">Orders Register</h3>
          <div className="overflow-x-auto text-xs text-left border-collapse">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] font-extrabold uppercase text-[10px]">
                  <th className="pb-3 pr-2">ID</th>
                  <th className="pb-3 px-2">Customer</th>
                  <th className="pb-3 px-2 text-right">Paid</th>
                  <th className="pb-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {orders.map((ord, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 pr-2 font-mono">#{ord._id.slice(-8)}</td>
                    <td className="py-3 px-2 font-bold">{ord.user?.name || 'Customer'}</td>
                    <td className="py-3 px-2 text-right font-black text-[#22C55E]">₹{ord.totalPrice}</td>
                    <td className="py-3 px-2"><StatusBadge status={ord.orderStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


    </div>
  );
}

    </div>
  );
}

/* ============================================================================
   MAIN WRAPPER / ROUTER SWITCHER
   ============================================================================ */
export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboardView />;
  }
  return <CustomerDashboard />;
}
