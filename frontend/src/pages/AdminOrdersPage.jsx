import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../store/authSlice.js';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { subscribeToSocketEvents } from '../services/socketService.js';
import { fetchOrders, newOrderReceived } from '../store/orderSlice.js';
import {
  Package,
  ShoppingBag,
  BarChart3,
  ShieldCheck,
  Store,
  Plus,
  Edit3,
  Trash2,
  Search,
  TrendingUp,
  AlertTriangle,
  Phone,
  Clock,
  X,
  Users,
  DollarSign,
  RefreshCw,
  Key,
  Save,
  CheckCircle2,
  TrendingDown,
  Power,
  Navigation,
  Image,
  Layers,
  LogOut,
  User as UserIcon,
  Check,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import NotificationPermissionPrompt from '../components/NotificationPermissionPrompt.jsx';

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  const activeTab = searchParams.get('tab') || 'orders';

  const setActiveTab = (tabName) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabName);
    setSearchParams(params);
  };

  const orders = useSelector((state) => state.orders.orders);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [storeInfo, setStoreInfo] = useState({
    storeName: 'Loopers  Store',
    openingTime: '07:00 AM',
    closingTime: '02:00 AM',
    isOpen: true,
    announcement: ''
  });

  // Content Management States
  const [banners, setBanners] = useState([]);
  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('weekly'); // 'daily', 'weekly', 'monthly'

  // Admin Profile Form
  const [adminProfileForm, setAdminProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Filters & Modals
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [deliveredDateFilter, setDeliveredDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'week', 'month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'Snacks',
    price: '',
    discount: 0,
    stock: 10,
    unit: 'unit',
    image: '',
    brand: 'Generic'
  });

  // Banner Modal States
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    image: '',
    altText: '',
    redirectType: 'none',
    redirectTarget: '',
    displayOrder: 0,
    isActive: true
  });
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Section Modal States
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    displayOrder: 0,
    products: [],
    isActive: true
  });

  // Category Modal States
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    isActive: true
  });

  // Fetch initial data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Socket.io subscription for Admin toast notifications
  useEffect(() => {
    if (!token) return;

    const unsubscribe = subscribeToSocketEvents((eventName, newOrder) => {
      if (eventName === 'new-order') {
        toast.success(`New Order Received: ${newOrder?.customId || `LPR-${newOrder?._id?.slice(-6).toUpperCase()}`}`, {
          duration: 5000,
          position: 'top-right'
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [token]);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      if (isManual || activeTab === 'orders') {
        await dispatch(fetchOrders()).unwrap();
        const storeRes = await api.get('/api/store/status');
        if (storeRes.data.success && storeRes.data.store) setStoreInfo(storeRes.data.store);
      }
      
      if (isManual || activeTab === 'products') {
        const res = await api.get('/api/products');
        if (res.data.success) setProducts(res.data.products || []);
      }

      if (isManual || activeTab === 'analytics') {
        const [summaryRes, orderRes, revRes, prodRes, custRes] = await Promise.all([
          api.get('/api/admin/analytics'),
          api.get('/api/admin/analytics/orders'),
          api.get('/api/admin/analytics/revenue'),
          api.get('/api/admin/analytics/products'),
          api.get('/api/admin/analytics/customers')
        ]);
        setAnalytics({
          summary: summaryRes.data.analytics,
          orders: orderRes.data.orders,
          revenue: revRes.data.revenue,
          products: prodRes.data.products,
          customers: custRes.data.customers
        });
      }

      if (isManual || activeTab === 'store_profile') {
        const res = await api.get('/api/store/status');
        if (res.data.success && res.data.store) setStoreInfo(res.data.store);
      }
      
      if (isManual || activeTab === 'banners') {
        const [banRes, catRes] = await Promise.all([
          api.get('/api/banners/admin'),
          api.get('/api/categories?all=true')
        ]);
        if (banRes.data.success) setBanners(banRes.data.banners || []);
        if (catRes.data.success) setCategories(catRes.data.categories || []);
      }
      
      if (isManual || activeTab === 'sections') {
        const [secRes, prodRes] = await Promise.all([
          api.get('/api/sections/admin'),
          api.get('/api/products')
        ]);
        if (secRes.data.success) setSections(secRes.data.sections || []);
        if (prodRes.data.success) setProducts(prodRes.data.products || []);
      }
      
      if (isManual || activeTab === 'categories') {
        const res = await api.get('/api/categories?all=true');
        if (res.data.success) setCategories(res.data.categories || []);
      }

      if (isManual) {
        toast.success('Dashboard data refreshed successfully');
      }
    } catch (err) {
      toast.error('Failed to load operational data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Toggle Store Availability from Operation Hub
  const handleToggleStoreStatus = async () => {
    const updatedStatus = !storeInfo.isOpen;
    try {
      const res = await api.put('/api/store/admin/status', { ...storeInfo, isOpen: updatedStatus });
      if (res.data.success) {
        setStoreInfo(res.data.store);
        toast.success(`Store marked as ${updatedStatus ? 'OPEN' : 'CLOSED'}`);
      }
    } catch (err) {
      toast.error('Failed to update store availability');
    }
  };

  // Save Store Operating Hours
  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/api/store/admin/status', storeInfo);
      if (res.data.success) {
        setStoreInfo(res.data.store);
        toast.success('Store operating hours updated');
      }
    } catch (err) {
      toast.error('Failed to save store settings');
    }
  };

  // Save Admin Profile
  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/api/auth/profile', {
        name: adminProfileForm.name,
        phone: adminProfileForm.phone,
        email: adminProfileForm.email
      });

      if (adminProfileForm.newPassword) {
        if (!adminProfileForm.currentPassword) {
          toast.error('Current password is required to change password');
          setSavingProfile(false);
          return;
        }
        await api.put('/api/auth/change-password', {
          currentPassword: adminProfileForm.currentPassword,
          newPassword: adminProfileForm.newPassword
        });
      }

      if (res.data.success) {
        dispatch(loginSuccess({ token, user: res.data.user }));
        toast.success('Admin profile saved successfully');
        setAdminProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving admin profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Order Transition Handlers
  const handleUpdateOrderStatus = async (orderId, endpoint) => {
    try {
      const res = await api.post(`/api/admin/orders/${orderId}/${endpoint}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Order status updated');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status transition failed');
    }
  };

  // Product Create/Edit Handlers
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || productForm.stock === undefined) {
      toast.error('Please enter name, price, and stock count');
      return;
    }

    try {
      if (editingProduct) {
        const res = await api.put(`/api/products/${editingProduct._id}`, productForm);
        if (res.data.success) toast.success('Product updated successfully');
      } else {
        const res = await api.post('/api/products', productForm);
        if (res.data.success) toast.success('Product created successfully!');
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/api/products/${productId}`);
      if (res.data.success) {
        toast.success('Product deleted successfully');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  // Banner Save Handler
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!bannerForm.image) {
      toast.error('Banner image URL is required');
      return;
    }

    if (bannerForm.redirectType === 'category' && !bannerForm.redirectTarget) {
      toast.error('Please select a target category for the banner redirect action.');
      return;
    }

    try {
      if (editingBanner) {
        await api.put(`/api/banners/admin/${editingBanner._id}`, bannerForm);
        toast.success('Banner updated successfully');
      } else {
        await api.post('/api/banners/admin', bannerForm);
        toast.success('Banner created successfully');
      }
      setShowBannerModal(false);
      setEditingBanner(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving banner');
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validate file format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file format. Only JPG, JPEG, PNG, and WEBP formats are allowed.');
      return;
    }

    // 2. Validate file size (20 MB)
    const maxSize = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSize) {
      toast.error('File size exceeds the 20 MB limit.');
      return;
    }

    // 3. Perform upload
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'banners');

    setUploadingBanner(true);
    setUploadProgress(0);

    const loadingToast = toast.loading('Uploading banner image to Cloudinary...');

    try {
      const response = await api.post('/api/upload/banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.success && response.data.url) {
        setBannerForm((prev) => ({ ...prev, image: response.data.url }));
        toast.success('Banner creative uploaded successfully!', { id: loadingToast });
      } else {
        throw new Error(response.data.message || 'Failed to get image URL.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to upload creative.';
      toast.error(`Upload failed: ${errMsg}`, { id: loadingToast });
    } finally {
      setUploadingBanner(false);
      setUploadProgress(0);
    }
  };

  const handleToggleBannerActive = async (banner) => {
    try {
      const res = await api.put(`/api/banners/admin/${banner._id}`, {
        isActive: !banner.isActive
      });
      if (res.data.success) {
        toast.success(`Banner is now ${!banner.isActive ? 'visible' : 'hidden'}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update banner status');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Delete this promotional banner?')) return;
    try {
      await api.delete(`/api/banners/admin/${id}`);
      toast.success('Banner deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete banner');
    }
  };

  // Section Save Handler
  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.title) {
      toast.error('Section title is required');
      return;
    }

    try {
      if (editingSection) {
        await api.put(`/api/sections/admin/${editingSection._id}`, sectionForm);
        toast.success('Home section updated successfully');
      } else {
        await api.post('/api/sections/admin', sectionForm);
        toast.success('Home section created successfully');
      }
      setShowSectionModal(false);
      setEditingSection(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving home section');
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Delete this home page dynamic section?')) return;
    try {
      await api.delete(`/api/sections/admin/${id}`);
      toast.success('Home section deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete home section');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory._id}`, categoryForm);
        toast.success('Category updated successfully');
      } else {
        await api.post('/api/categories', categoryForm);
        toast.success('Category created successfully');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Active products in this category will remain, but the category listing itself will be removed.')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success('Category deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };


  const handleToggleProductInSection = (productId) => {
    const current = [...sectionForm.products];
    const index = current.indexOf(productId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(productId);
    }
    setSectionForm({ ...sectionForm, products: current });
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const normalizeStatus = (status) => {
    if (status === 'Preparing') return 'Packing';
    return status;
  };

  const activeOrders = orders.filter(o =>
    ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.orderStatus)
  );

  const pendingOrders = orders.filter(o => o.orderStatus === 'Order Placed');

  const printRequests = orders.filter(o => o.products?.some(p => p.type === 'printout'));

  const filteredOrders = orders.filter(o => {

    // 1. Status Filter
    if (orderStatusFilter !== 'All' && normalizeStatus(o.orderStatus) !== orderStatusFilter) {
      return false;
    }

    // 2. Date Filter (applicable only when status is 'Delivered' and filter !== 'all')
    if (normalizeStatus(o.orderStatus) === 'Delivered' && deliveredDateFilter !== 'all') {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (deliveredDateFilter === 'today') {
        if (orderDate < startOfToday) return false;
      } else if (deliveredDateFilter === 'yesterday') {
        if (orderDate < startOfYesterday || orderDate >= startOfToday) return false;
      } else if (deliveredDateFilter === 'week') {
        if (orderDate < startOfWeek) return false;
      } else if (deliveredDateFilter === 'month') {
        if (orderDate < startOfMonth) return false;
      } else if (deliveredDateFilter === 'custom') {
        if (customStartDate) {
          const sDate = new Date(customStartDate);
          sDate.setHours(0, 0, 0, 0);
          if (orderDate < sDate) return false;
        }
        if (customEndDate) {
          const eDate = new Date(customEndDate);
          eDate.setHours(23, 59, 59, 999);
          if (orderDate > eDate) return false;
        }
      }
    }

    // 3. Search Query Filter (Order ID, Customer Name, Phone Number)
    if (orderSearchQuery.trim() !== '') {
      const query = orderSearchQuery.toLowerCase().trim();
      const orderIdStr = (o._id || '').toLowerCase();
      const customIdStr = (o.customId || '').toLowerCase();
      const customerName = (o.user?.name || o.address?.name || '').toLowerCase();
      const customerPhone = (o.user?.phone || o.address?.phone || '').toLowerCase();

      const matchesId = orderIdStr.includes(query) || customIdStr.includes(query);
      const matchesName = customerName.includes(query);
      const matchesPhone = customerPhone.includes(query);

      if (!matchesId && !matchesName && !matchesPhone) {
        return false;
      }
    }

    return true;
  });


  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">

      {/* Header Tab Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-sys-surface border border-sys-border p-4 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <ShieldCheck size={20} className="text-primary-500" />
            <h1 className="text-base sm:text-lg font-black text-sys-text-primary">Admin Operations</h1>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              title="Refresh Orders, Products & Analytics"
              className="p-1.5 px-2.5 rounded-lg bg-sys-surface-secondary text-sys-text-secondary hover:text-primary-500 hover:bg-sys-border transition-all disabled:opacity-50 flex items-center space-x-1.5 text-xs font-bold"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-primary-500' : ''} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
          <p className="text-xs text-sys-text-secondary mt-0.5">
            Order and Content management system.
          </p>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex bg-sys-surface-secondary p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === 'orders' ? 'bg-primary-500 text-white shadow-xs' : 'text-sys-text-secondary hover:text-sys-text-primary'
              }`}
          >
            <ShoppingBag size={14} />
            <span>Dashboard ({orders.filter(o => !o.products?.some(p => p.type === 'printout')).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('print_requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === 'print_requests' ? 'bg-primary-500 text-white shadow-xs' : 'text-sys-text-secondary hover:text-sys-text-primary'
              }`}
          >
            <Layers size={14} />
            <span>Print Requests ({orders.filter(o => o.products?.some(p => p.type === 'printout')).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === 'products' ? 'bg-primary-500 text-white shadow-xs' : 'text-sys-text-secondary hover:text-sys-text-primary'
              }`}
          >
            <Package size={14} />
            <span>Products</span>
          </button>

          <button
            onClick={() => setActiveTab('banners')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === 'banners' ? 'bg-primary-500 text-white shadow-xs' : 'text-sys-text-secondary hover:text-sys-text-primary'
              }`}
          >
            <Image size={14} />
            <span>Banners</span>
          </button>

          <button
            onClick={() => setActiveTab('sections')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === 'sections' ? 'bg-primary-500 text-white shadow-xs' : 'text-sys-text-secondary hover:text-sys-text-primary'
              }`}
          >
            <Layers size={14} />
            <span>Sections</span>
          </button>

          <button
            onClick={() => setActiveTab('store_profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === 'store_profile' ? 'bg-primary-500 text-white shadow-xs' : 'text-sys-text-secondary hover:text-sys-text-primary'
              }`}
          >
            <Store size={14} />
            <span>Store & Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === 'categories' ? 'bg-primary-500 text-white shadow-xs' : 'text-sys-text-secondary hover:text-sys-text-primary'
              }`}
          >
            <Layers size={14} />
            <span>Categories</span>
          </button>


          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === 'analytics' ? 'bg-primary-500 text-white shadow-xs' : 'text-sys-text-secondary hover:text-sys-text-primary'
              }`}
          >
            <BarChart3 size={14} />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OPERATIONS DASHBOARD & HUB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <NotificationPermissionPrompt />

          {/* Primary Operations Hub Card */}
          <div className="bg-sys-surface border border-sys-border rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center text-xl font-black border border-primary-500/20 shadow-inner">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'A'}
              </div>
              <div>
                <h3 className="text-base font-black text-sys-text-primary">Welcome, {user?.name || 'Admin Manager'}</h3>
                <p className="text-xs text-sys-text-secondary mt-0.5">Order Management system</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => setActiveTab('store_profile')}
                    className="flex items-center space-x-1 text-[10px] font-extrabold text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 px-2.5 py-1 rounded-lg border border-primary-500/20"
                  >
                    <UserIcon size={12} />
                    <span>Quick Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-[10px] font-extrabold text-sys-error bg-sys-error/5 hover:bg-sys-error/10 px-2.5 py-1 rounded-lg border border-sys-error/20"
                  >
                    <LogOut size={12} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* Store Status Toggle */}
              <div className="bg-sys-surface-secondary border border-sys-border px-4 py-3 rounded-2xl flex flex-col justify-between flex-1 md:flex-initial">
                <span className="text-[9px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1.5">Store Status</span>
                <button
                  onClick={handleToggleStoreStatus}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-xs transition-all ${storeInfo.isOpen
                    ? 'bg-sys-success text-white hover:bg-sys-success/90'
                    : 'bg-sys-error text-white hover:bg-sys-error/90'
                    }`}
                >
                  <Power size={13} />
                  <span>{storeInfo.isOpen ? 'STORE OPEN' : 'STORE CLOSED'}</span>
                </button>
              </div>

              {/* Active Orders Info */}
              <div className="bg-sys-surface-secondary border border-sys-border px-4 py-3 rounded-2xl flex flex-col justify-between flex-1 md:flex-initial text-center min-w-[90px]">
                <span className="text-[9px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1">Active Orders</span>
                <p className="text-xl font-black text-primary-500 font-mono">{activeOrders.length}</p>
              </div>

              {/* Pending Orders Info */}
              <div className="bg-sys-surface-secondary border border-sys-border px-4 py-3 rounded-2xl flex flex-col justify-between flex-1 md:flex-initial text-center min-w-[90px]">
                <span className="text-[9px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1">Pending Check</span>
                <p className={`text-xl font-black font-mono ${pendingOrders.length > 0 ? 'text-amber-500 animate-pulse' : 'text-sys-text-primary'}`}>
                  {pendingOrders.length}
                </p>
              </div>
            </div>
          </div>

          {/* Operational Orders List */}
          <div className="space-y-4">

            {/* Order Status Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide">
              {['All', 'Order Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatusFilter(status)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border whitespace-nowrap ${orderStatusFilter === status
                    ? 'bg-[#40A2E3] text-white border-[#40A2E3] shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-[#64748B] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Order Search & Delivered Date Filters */}
            <div className="space-y-3 bg-sys-surface border border-sys-border p-4 rounded-2xl shadow-xs">
              {/* Text Search Bar */}
              <div className="relative flex items-center w-full">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target ? e.target.value : e)}
                  placeholder="Search orders by ID, customer name, or phone number..."
                  className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3] placeholder-slate-400 shadow-inner"
                />
              </div>

              {/* Date Filters (Only shown when filter is 'Delivered') */}
              {orderStatusFilter === 'Delivered' && (
                <div className="pt-2 border-t border-sys-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Completed Date Filter:</span>
                    <button
                      onClick={() => {
                        setDeliveredDateFilter('all');
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      className="text-[10px] font-bold text-primary-500 hover:underline"
                    >
                      Reset Filter
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'all', label: 'All Time' },
                      { key: 'today', label: 'Today' },
                      { key: 'yesterday', label: 'Yesterday' },
                      { key: 'week', label: 'This Week' },
                      { key: 'month', label: 'This Month' },
                      { key: 'custom', label: 'Custom Range' }
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        type="button"
                        onClick={() => setDeliveredDateFilter(btn.key)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap ${deliveredDateFilter === btn.key
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-sys-surface-secondary border-sys-border text-sys-text-secondary'
                          }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Inputs */}
                  {deliveredDateFilter === 'custom' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 block mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-xs font-mono text-sys-text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 block mb-1">End Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-xs font-mono text-sys-text-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>


            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const normalizedStatus = normalizeStatus(order.orderStatus);
                  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={order._id}
                      className="bg-sys-surface border border-sys-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 animate-fade-in"
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-sys-border pb-3">
                        <div>
                          <span className="text-xs font-black text-sys-text-primary font-mono">
                            Order ID: {order.customId || `LPR-${order._id.slice(-6).toUpperCase()}`}
                          </span>
                          <p className="text-[10px] text-sys-text-secondary">{orderDate}</p>
                        </div>

                        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 border border-primary-500/20">
                          Status: {normalizedStatus}
                        </span>
                      </div>

                      {/* Customer & Address Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-sys-surface-secondary p-3 rounded-xl text-xs">
                        <div>
                          <p className="font-bold text-sys-text-primary">Customer Info</p>
                          <p className="text-sys-text-secondary font-medium">{order.user?.name || order.address?.name}</p>
                          <a href={`tel:${order.address?.phone}`} className="text-primary-500 font-mono font-bold flex items-center mt-0.5 hover:underline">
                            <Phone size={12} className="mr-1" />
                            {order.address?.phone || order.user?.phone}
                          </a>
                        </div>

                        <div>
                          <p className="font-bold text-sys-text-primary flex items-center justify-between">
                            <span>Delivery Location</span>
                          </p>
                          <p className="text-sys-text-secondary font-medium">
                            {order.address?.houseNumber}, {order.address?.street}, {order.address?.city}
                          </p>
                          <a
                            href={
                              order.customerLocation?.lat && order.customerLocation?.lng
                                ? `https://www.google.com/maps/dir/?api=1&destination=${order.customerLocation.lat},${order.customerLocation.lng}`
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address?.houseNumber || ''} ${order.address?.street || ''} ${order.address?.city || ''}`)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-primary-500 bg-primary-500/10 hover:bg-primary-500/20 px-2.5 py-1 rounded-lg border border-primary-500/20 mt-1.5 active:scale-95 transition-all"
                          >
                            <Navigation size={12} />
                            <span>Open in Maps</span>
                          </a>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 text-xs">
                        <p className="font-bold text-sys-text-primary mb-1">Items Ordered:</p>
                        {order.products?.map((item, idx) => {
                          const isPrintout = item.type === 'printout';
                          return (
                            <div key={idx} className="flex flex-col text-sys-text-secondary pb-1 border-b border-sys-border/30 last:border-0 last:pb-0">
                              <div className="flex justify-between">
                                <span className="font-semibold">{item.quantity}x {item.name || (isPrintout ? 'Printout' : 'Item')}</span>
                                <span className="font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                              {isPrintout && (
                                <div className="mt-1 ml-3 p-2 bg-sys-surface-secondary rounded-xl border border-sys-border/50 space-y-1.5">
                                  <p className="text-[10px] text-sys-text-secondary">
                                    Specs: {item.paperSize} • {item.printMode === 'double' ? 'Double' : 'Single'} • {item.colorPages > 0 ? 'Color' : 'B&W'} • {item.pages} pgs • {item.copies} cps{item.binding && item.binding !== 'none' ? ` • ${item.binding} binding` : ''}{item.extras?.includes('lamination') ? ' • Laminated' : ''}
                                  </p>
                                  <a
                                    href={item.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="inline-flex items-center text-[10px] font-extrabold text-[#40A2E3] hover:underline"
                                  >
                                    Download Document
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Total & Action Status Transitions */}
                      <div className="pt-3 border-t border-sys-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <span className="text-[10px] text-sys-text-secondary font-bold uppercase">Total Payable</span>
                          <p className="text-base font-black text-sys-text-primary font-mono">
                            ₹{order.totalPrice?.toFixed(2)}
                          </p>
                        </div>

                        {/* Status Action Buttons */}
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          {order.orderStatus === 'Order Placed' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'accept')}
                              className="bg-sys-success text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs active:scale-95 transition-all"
                            >
                              Accept Order
                            </button>
                          )}

                          {order.products?.some(p => p.type === 'printout') && order.orderStatus === 'Confirmed' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'print')}
                              className="bg-primary-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs active:scale-95 transition-all"
                            >
                              Start Printing
                            </button>
                          )}

                          {order.products?.some(p => p.type === 'printout') && order.orderStatus === 'Printing' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'pack')}
                              className="bg-purple-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs active:scale-95 transition-all"
                            >
                              Mark Ready (Prepared)
                            </button>
                          )}

                          {!order.products?.some(p => p.type === 'printout') && ['Order Placed', 'Confirmed'].includes(order.orderStatus) && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'pack')}
                              className="bg-primary-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs active:scale-95 transition-all"
                            >
                              Mark Packing
                            </button>
                          )}

                          {order.orderStatus === 'Preparing' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'out-for-delivery')}
                              className="bg-purple-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs active:scale-95 transition-all"
                            >
                              Dispatch Order
                            </button>
                          )}

                          {order.orderStatus === 'Out for Delivery' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'deliver')}
                              className="bg-sys-success text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs active:scale-95 transition-all"
                            >
                              Mark Delivered
                            </button>
                          )}

                          {!['Delivered', 'Cancelled'].includes(order.orderStatus) && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'cancel')}
                              className="bg-sys-error/10 text-sys-error font-extrabold text-xs px-3 py-2 rounded-xl hover:bg-sys-error/20 active:scale-95 transition-all"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-sys-surface rounded-2xl border border-sys-border">
                <ShoppingBag size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-sys-text-primary">No orders matching status filter</p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB: PRINT REQUESTS */}
      {activeTab === 'print_requests' && (
        <div className="space-y-4">
          <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-black text-sys-text-primary">Print Requests</h3>
                <p className="text-xs text-sys-text-secondary mt-0.5">
                  Manage student print requests, download files, and track status.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-sys-text-secondary">Filter Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-sys-border bg-sys-surface text-sys-text-primary focus:outline-none"
                >
                  <option value="All">All</option>
                  <option value="Order Placed">Pending</option>
                  <option value="Confirmed">Accepted</option>
                  <option value="Printing">Printing</option>
                  <option value="Preparing">Ready</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-sys-border text-sys-text-secondary font-extrabold text-[10px] uppercase bg-sys-surface-secondary">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Uploaded File</th>
                    <th className="py-3 px-4 text-center">Copies</th>
                    <th className="py-3 px-4 text-center">Size</th>
                    <th className="py-3 px-4">Color</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {printRequests
                    .filter(o => {
                      if (orderStatusFilter === 'All') return true;
                      return normalizeStatus(o.orderStatus) === orderStatusFilter;
                    })
                    .map((order) => {
                      const printItem = order.products?.find(p => p.type === 'printout');
                      if (!printItem) return null;

                      const studentName = order.user?.name || order.address?.name || 'Student';
                      const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={order._id} className="border-b border-sys-border hover:bg-sys-surface-hover transition-colors">
                          <td className="py-3.5 px-4 font-bold text-sys-text-primary">
                            <div>
                              <p>{studentName}</p>
                              <a href={`tel:${order.address?.phone}`} className="text-[10px] text-primary-500 font-mono font-bold hover:underline">
                                📞 {order.address?.phone || order.user?.phone}
                              </a>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-sys-text-secondary">
                            {order.customId || `LPR-${order._id.slice(-6).toUpperCase()}`}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col max-w-[200px]">
                              <span className="truncate font-semibold text-sys-text-primary" title={printItem.pdfName}>
                                {printItem.pdfName || 'document.pdf'}
                              </span>
                              <span className="text-[10px] text-sys-text-secondary font-mono">
                                Size: {printItem.pdfSize || 'N/A'} • {printItem.pages || 1} pgs
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            {printItem.copies || 1}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            {printItem.paperSize || 'A4'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-sys-text-secondary">
                            {printItem.printMode === 'double' ? 'Double' : 'Single'} • {printItem.colorPages > 0 ? 'Color' : 'B&W'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              order.orderStatus === 'Delivered'
                                ? 'bg-sys-success/10 text-sys-success border-sys-success/20'
                                : order.orderStatus === 'Cancelled'
                                ? 'bg-sys-error/10 text-sys-error border-sys-error/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {normalizeStatus(order.orderStatus)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-sys-text-secondary font-medium">
                            {orderDate}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex flex-wrap gap-1.5 justify-end">
                              {/* Download File */}
                              <a
                                href={printItem.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-[#40A2E3] bg-[#40A2E3]/10 hover:bg-[#40A2E3]/20 px-2.5 py-1 rounded-lg border border-[#40A2E3]/20 transition-all active:scale-95"
                              >
                                <span>Download</span>
                              </a>

                              {/* State Transition Actions */}
                              {order.orderStatus === 'Order Placed' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'accept')}
                                  className="text-[10px] font-extrabold text-white bg-sys-success hover:bg-sys-success/90 px-2.5 py-1 rounded-lg shadow-xs active:scale-95 transition-all"
                                >
                                  Accept
                                </button>
                              )}

                              {['Order Placed', 'Confirmed'].includes(order.orderStatus) && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'print')}
                                  className="text-[10px] font-extrabold text-white bg-primary-500 hover:bg-primary-500/90 px-2.5 py-1 rounded-lg shadow-xs active:scale-95 transition-all"
                                >
                                  Print
                                </button>
                              )}

                              {order.orderStatus === 'Printing' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'pack')}
                                  className="text-[10px] font-extrabold text-white bg-purple-600 hover:bg-purple-700 px-2.5 py-1 rounded-lg shadow-xs active:scale-95 transition-all"
                                >
                                  Mark Ready
                                </button>
                              )}

                              {order.orderStatus === 'Preparing' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'out-for-delivery')}
                                  className="text-[10px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-lg shadow-xs active:scale-95 transition-all"
                                >
                                  Dispatch
                                </button>
                              )}

                              {order.orderStatus === 'Out for Delivery' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'deliver')}
                                  className="text-[10px] font-extrabold text-white bg-sys-success hover:bg-sys-success/90 px-2.5 py-1 rounded-lg shadow-xs active:scale-95 transition-all"
                                >
                                  Deliver
                                </button>
                              )}

                              {!['Delivered', 'Cancelled'].includes(order.orderStatus) && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'cancel')}
                                  className="text-[10px] font-extrabold text-sys-error bg-sys-error/10 hover:bg-sys-error/20 px-2.5 py-1 rounded-lg border border-sys-error/20 transition-all active:scale-95"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {printRequests.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-12 text-sys-text-secondary font-bold">
                        No print requests available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS CATALOG MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search catalog products..."
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-sys-border bg-sys-surface text-sys-text-primary focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  description: '',
                  category: 'Snacks',
                  price: '',
                  discount: 0,
                  stock: 10,
                  unit: 'unit',
                  image: '',
                  brand: 'Generic'
                });
                setShowProductModal(true);
              }}
              className="bg-primary-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => (
              <div
                key={prod._id}
                className="bg-sys-surface border border-sys-border rounded-2xl p-3 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-2">
                  <img src={prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e'} alt={prod.name} className="w-full aspect-square rounded-xl object-cover bg-sys-surface-secondary" />
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold text-primary-500 uppercase bg-primary-500/10 px-2 py-0.5 rounded-full">
                      {prod.category}
                    </span>
                    <h4 className="text-xs font-bold text-sys-text-primary truncate mt-1">{prod.name}</h4>
                    <p className="text-xs font-black text-sys-text-primary font-mono mt-0.5">
                      ₹{prod.price} <span className="text-[10px] text-slate-400 font-normal">({prod.unit})</span>
                    </p>
                    <p className={`text-[10px] font-bold mt-1 ${prod.stock <= 5 ? 'text-sys-error' : 'text-emerald-500'}`}>
                      Stock: {prod.stock} units
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 mt-2 border-t border-sys-border">
                  <button
                    onClick={() => {
                      setEditingProduct(prod);
                      setProductForm({
                        name: prod.name,
                        description: prod.description || '',
                        category: prod.category || 'Snacks',
                        price: prod.price,
                        discount: prod.discount || 0,
                        stock: prod.stock,
                        unit: prod.unit || 'unit',
                        image: prod.image || '',
                        brand: prod.brand || 'Generic'
                      });
                      setShowProductModal(true);
                    }}
                    className="p-1.5 text-primary-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDeleteProduct(prod._id)} className="p-1.5 text-sys-error hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 3: PROMOTIONAL BANNERS CMS */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-sys-surface border border-sys-border p-4 rounded-2xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-sys-text-primary uppercase tracking-wider">
                Marketing Banner Creatives
              </h3>
              <p className="text-[11px] text-sys-text-secondary mt-0.5">
                Upload 2.4:1 aspect ratio marketing creatives (designed in Figma/Canva) and configure click navigation.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingBanner(null);
                setBannerForm({
                  image: '',
                  altText: '',
                  redirectType: 'none',
                  redirectTarget: '',
                  displayOrder: 0,
                  isActive: true
                });
                setShowBannerModal(true);
              }}
              className="bg-primary-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 active:scale-95 transition-all shrink-0"
            >
              <Plus size={16} />
              <span>Create Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((banner) => (
              <div
                key={banner._id}
                className="bg-sys-surface border border-sys-border rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs"
              >
                {/* 2.4:1 Aspect Ratio Creative Image Thumbnail */}
                <div className="relative w-full aspect-[2.4/1] rounded-xl overflow-hidden bg-slate-900 border border-sys-border">
                  <img src={banner.image} alt={banner.altText || 'Promotional Banner'} className="w-full h-full object-cover" />
                  <span className={`absolute top-2 right-2 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs ${
                    banner.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {banner.isActive ? 'Visible / Active' : 'Hidden'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-sys-text-primary block truncate max-w-[200px]">
                      {banner.altText || 'Marketing Banner'}
                    </span>
                    <span className="text-[10px] text-primary-500 font-mono font-bold block mt-0.5">
                      Redirect: <span className="capitalize">{banner.redirectType || 'none'}</span> {banner.redirectTarget ? `(${banner.redirectTarget})` : ''}
                    </span>
                  </div>
                  <span className="text-[10px] text-sys-text-secondary font-mono">
                    Order: {banner.displayOrder}
                  </span>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-sys-border">
                  <button
                    type="button"
                    onClick={() => handleToggleBannerActive(banner)}
                    className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                      banner.isActive ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {banner.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    <span>{banner.isActive ? 'Hide' : 'Show'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingBanner(banner);
                      setBannerForm({
                        image: banner.image || '',
                        altText: banner.altText || '',
                        redirectType: banner.redirectType || (banner.category ? 'category' : 'none'),
                        redirectTarget: banner.redirectTarget || banner.category || '',
                        displayOrder: banner.displayOrder || 0,
                        isActive: banner.isActive !== undefined ? banner.isActive : true
                      });
                      setShowBannerModal(true);
                    }}
                    className="p-1.5 text-primary-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(banner._id)}
                    className="p-1.5 text-sys-error hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DYNAMIC HOME PAGE SECTIONS & COLLECTIONS */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-sys-text-primary">Dynamic Sections & Collections</h3>
            <button
              onClick={() => {
                setEditingSection(null);
                setSectionForm({
                  title: '',
                  displayOrder: 0,
                  products: [],
                  isActive: true
                });
                setShowSectionModal(true);
              }}
              className="bg-primary-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Create Custom Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sections.map((section) => (
              <div
                key={section._id}
                className="bg-sys-surface border border-sys-border rounded-2xl p-5 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-sys-text-primary uppercase tracking-wider">{section.title}</h4>
                    <p className="text-[10px] text-sys-text-secondary mt-0.5">
                      Order: {section.displayOrder} • {section.products?.length || 0} Products Selected
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${section.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {section.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingSection(section);
                        setSectionForm({
                          title: section.title,
                          displayOrder: section.displayOrder,
                          products: section.products?.map(p => typeof p === 'object' ? p._id : p) || [],
                          isActive: section.isActive
                        });
                        setShowSectionModal(true);
                      }}
                      className="p-1 text-primary-500"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDeleteSection(section._id)} className="p-1 text-sys-error">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Section Products Horizontal Scroll */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                  {section.products?.map((prod) => (
                    <div key={prod._id} className="bg-sys-surface-secondary border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center space-x-2 flex-shrink-0">
                      <span>{prod.name}</span>
                      <span className="text-[#64748B] font-mono">(₹{prod.price})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: STORE SETTINGS & GENERAL PROFILE EDITOR */}
      {activeTab === 'store_profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Global Store Open/Closed & Hours Control */}
          <div className="bg-sys-surface border border-sys-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-sys-border pb-3">
              <div className="flex items-center space-x-2">
                <Store size={18} className="text-primary-500" />
                <h3 className="text-xs font-black text-sys-text-primary">Store Availability & Hours</h3>
              </div>
              <button
                onClick={handleToggleStoreStatus}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-xs ${storeInfo.isOpen
                  ? 'bg-sys-success text-white hover:bg-sys-success/90'
                  : 'bg-sys-error text-white hover:bg-sys-error/90'
                  }`}
              >
                <Power size={13} />
                <span>{storeInfo.isOpen ? 'STORE OPEN' : 'STORE CLOSED'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveStoreSettings} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-sys-text-primary block mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={storeInfo.storeName}
                  onChange={(e) => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Opening Time</label>
                  <input
                    type="text"
                    required
                    value={storeInfo.openingTime}
                    onChange={(e) => setStoreInfo({ ...storeInfo, openingTime: e.target.value })}
                    placeholder="e.g. 07:00 AM"
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Closing Time</label>
                  <input
                    type="text"
                    required
                    value={storeInfo.closingTime}
                    onChange={(e) => setStoreInfo({ ...storeInfo, closingTime: e.target.value })}
                    placeholder="e.g. 02:00 AM"
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-500 text-white font-black py-2.5 rounded-xl shadow-md flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
              >
                <Save size={15} />
                <span>Save Store Hours</span>
              </button>
            </form>
          </div>

          {/* Admin Profile Form */}
          <div className="bg-sys-surface border border-sys-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-sys-border pb-3">
              <ShieldCheck size={18} className="text-primary-500" />
              <h3 className="text-xs font-black text-sys-text-primary">Admin Profile & Security</h3>
            </div>

            <form onSubmit={handleSaveAdminProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-sys-text-primary block mb-1">Admin Name</label>
                <input
                  type="text"
                  required
                  value={adminProfileForm.name}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    required
                    value={adminProfileForm.phone}
                    onChange={(e) => setAdminProfileForm({ ...adminProfileForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={adminProfileForm.email}
                    onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-sys-border space-y-2">
                <p className="font-bold text-sys-text-primary flex items-center text-[11px]">
                  <Key size={13} className="mr-1 text-primary-500" />
                  Change Password (Optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={adminProfileForm.currentPassword}
                    onChange={(e) => setAdminProfileForm({ ...adminProfileForm, currentPassword: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={adminProfileForm.newPassword}
                    onChange={(e) => setAdminProfileForm({ ...adminProfileForm, newPassword: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-primary-500 text-white font-black py-2.5 rounded-xl shadow-md flex items-center justify-center space-x-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={15} />
                <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 6: ADVANCED ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-4">

          <div className="flex justify-between items-center bg-sys-surface border border-sys-border p-3 rounded-2xl shadow-xs">
            <h3 className="text-xs font-black text-sys-text-primary uppercase tracking-wider">
              Business Performance & Metrics
            </h3>

            <div className="flex bg-sys-surface-secondary p-1 rounded-xl">
              {['daily', 'weekly', 'monthly'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeRange(tf)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold capitalize transition-all ${timeRange === tf
                    ? 'bg-primary-500 text-white shadow-xs'
                    : 'text-sys-text-secondary hover:text-sys-text-primary'
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            <div className="bg-sys-surface border border-sys-border p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-sys-text-secondary uppercase">
                {timeRange === 'daily' ? "Today's Revenue" : timeRange === 'weekly' ? 'Weekly Revenue' : 'Monthly Revenue'}
              </span>
              <p className="text-xl font-black text-primary-500 font-mono mt-1">
                ₹{timeRange === 'daily'
                  ? analytics.revenue?.today?.toFixed(2)
                  : timeRange === 'weekly'
                    ? analytics.revenue?.weekly?.toFixed(2)
                    : analytics.revenue?.monthly?.toFixed(2)}
              </p>
              <p className="text-[10px] text-sys-success font-bold mt-1 flex items-center">
                <TrendingUp size={12} className="mr-0.5" /> Total: ₹{analytics.revenue?.total?.toFixed(2)}
              </p>
            </div>

            <div className="bg-sys-surface border border-sys-border p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-sys-text-secondary uppercase">
                {timeRange === 'daily' ? 'Orders Today' : timeRange === 'weekly' ? 'Orders This Week' : 'Orders This Month'}
              </span>
              <p className="text-xl font-black text-sys-text-primary font-mono mt-1">
                {timeRange === 'daily'
                  ? analytics.orders?.today
                  : timeRange === 'weekly'
                    ? analytics.orders?.thisWeek
                    : analytics.orders?.thisMonth}
              </p>
              <p className="text-[10px] text-sys-text-secondary font-bold mt-1">
                Total All Time: {analytics.summary?.totalOrders}
              </p>
            </div>

            <div className="bg-sys-surface border border-sys-border p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-sys-text-secondary uppercase">Completed / Delivered</span>
              <p className="text-xl font-black text-sys-success font-mono mt-1">{analytics.summary?.completedOrders}</p>
              <p className="text-[10px] text-sys-error font-bold mt-1">
                Cancelled: {analytics.summary?.cancelledOrders}
              </p>
            </div>

            <div className="bg-sys-surface border border-sys-border p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-sys-text-secondary uppercase">Average Order Value</span>
              <p className="text-xl font-black text-sys-text-primary font-mono mt-1">₹{analytics.revenue?.averageOrderValue}</p>
              <p className="text-[10px] text-primary-500 font-bold mt-1">
                Repeat Rate: {analytics.customers?.repeatCustomerPercentage}%
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="bg-sys-surface border border-sys-border p-4 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-black text-sys-text-primary flex items-center">
                <TrendingUp size={16} className="text-sys-success mr-1.5" />
                Best Selling Campus Products
              </h3>
              <div className="space-y-2 text-xs">
                {analytics.products?.bestSellers?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-2 border-b border-sys-border last:border-0">
                    <span className="font-bold text-sys-text-primary truncate max-w-[60%]">{item.name}</span>
                    <span className="font-mono text-primary-500 font-bold">{item.totalQuantitySold} sold (₹{item.totalRevenueGenerated?.toFixed(2)})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-sys-surface border border-sys-border p-4 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-black text-sys-text-primary flex items-center">
                <AlertTriangle size={16} className="text-amber-500 mr-1.5" />
                Low & Out of Stock Alerts (≤ 5 units)
              </h3>
              <div className="space-y-2 text-xs">
                {analytics.products?.lowStockAlerts?.length > 0 ? (
                  analytics.products.lowStockAlerts.map((prod) => (
                    <div key={prod._id} className="flex justify-between items-center pb-2 border-b border-sys-border last:border-0">
                      <span className="font-bold text-sys-text-primary">{prod.name}</span>
                      <span className={`font-mono font-bold ${prod.stock === 0 ? 'text-red-600 bg-red-100 px-2 py-0.5 rounded-full' : 'text-amber-500'}`}>
                        {prod.stock === 0 ? 'OUT OF STOCK' : `${prod.stock} left`}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#64748B] text-center py-4">All catalog items have healthy stock levels.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 7: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-sys-surface border border-sys-border p-4 rounded-2xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-sys-text-primary uppercase tracking-wider">
                Category Manager
              </h3>
              <p className="text-[11px] text-sys-text-secondary mt-0.5">
                Disable categories to instantly hide them from customer UI without deleting products.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({
                  name: '',
                  description: '',
                  icon: '',
                  isActive: true
                });
                setShowCategoryModal(true);
              }}
              className="bg-primary-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="bg-sys-surface border border-sys-border rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <img 
                      src={
                        (cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/')))
                          ? cat.icon 
                          : ({
                              'Snacks': 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png',
                              'Beverages': 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png',
                              'Dairy': 'https://cdn-icons-png.flaticon.com/512/3050/3050158.png',
                              'Groceries': 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png',
                              'Household': 'https://cdn-icons-png.flaticon.com/512/995/995053.png',
                              'Fast Food': 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
                              'Vegetables': 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png',
                              'Fruits': 'https://cdn-icons-png.flaticon.com/512/3194/3194766.png',
                              'Electronics': 'https://cdn-icons-png.flaticon.com/512/3659/3659899.png',
                            }[cat.name] || 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png')
                      } 
                      alt={cat.name} 
                      className="w-8 h-8 object-contain filter drop-shadow-xs" 
                    />
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${cat.isActive
                      ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-100 dark:bg-sys-error/10 text-sys-error border border-sys-error/20'
                      }`}>
                      {cat.isActive ? 'Active / Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-sys-text-primary mt-2 uppercase tracking-wide">
                    {cat.name}
                  </h4>
                  <p className="text-[10px] text-sys-text-secondary mt-1 line-clamp-2">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-sys-border">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setCategoryForm({
                        name: cat.name,
                        description: cat.description || '',
                        icon: cat.icon || '',
                        isActive: cat.isActive
                      });
                      setShowCategoryModal(true);
                    }}
                    className="p-1.5 text-primary-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-xs font-extrabold flex items-center space-x-1"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat._id)}
                    className="p-1.5 text-sys-error hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg text-xs font-extrabold flex items-center space-x-1"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-sys-surface rounded-2xl max-w-md w-full p-6 shadow-2xl border border-sys-border space-y-4">
            <div className="flex justify-between items-center border-b border-sys-border pb-3">
              <h3 className="text-sm font-bold text-sys-text-primary">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-sys-text-primary block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Beverages"
                  className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-sys-text-primary block mb-1">Description</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="e.g. Coffee, tea, soft drinks"
                  className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-sys-text-primary block mb-1">Category Icon (Flaticon Image URL or Emoji)</label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  placeholder="e.g. https://cdn-icons-png.flaticon.com/512/2553/2553691.png"
                  className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="categoryActive"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-700 text-primary-500 focus:ring-[#40A2E3]"
                />
                <label htmlFor="categoryActive" className="font-bold text-sys-text-primary">
                  Active (Visible on Customer App)
                </label>
              </div>

              <div className="pt-3 border-t border-sys-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary-500 text-white rounded-xl shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Edit/Create Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">

          <div className="bg-sys-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-sys-border space-y-4">
            <div className="flex justify-between items-center border-b border-sys-border pb-3">
              <h3 className="text-sm font-bold text-sys-text-primary">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-sys-text-primary block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                />
              </div>

              <div>
                <label className="font-bold text-sys-text-primary block mb-1">Description</label>
                <input
                  type="text"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="e.g. Crispy potato chips 50g"
                  className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  >
                    {['Snacks', 'Beverages', 'Dairy', 'Groceries', 'Vegetables', 'Fruits', 'Household', 'Fast Food', 'Electronics'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Stock Count *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Unit Tag (e.g. 500g, 1 pack)</label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-sys-text-primary block mb-1">Image URL</label>
                <input
                  type="text"
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                />
              </div>

              <div className="pt-3 border-t border-sys-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary-500 text-white rounded-xl shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refactored Pure Asset Banner Create/Edit Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-sys-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-sys-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-sys-border pb-3">
              <h3 className="text-sm font-bold text-sys-text-primary">
                {editingBanner ? 'Edit Promotional Banner Asset' : 'Create New Banner Asset'}
              </h3>
              <button onClick={() => setShowBannerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-sys-text-primary block mb-1">Banner Creative Image * (Recommended 1200×500 / 2.4:1 ratio)</label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      value={bannerForm.image}
                      onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                      placeholder="Paste image URL or choose a file to upload"
                      disabled={uploadingBanner}
                      className="flex-1 p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none text-xs"
                    />
                    <label className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-md select-none transition-all duration-200 hover:shadow-lg shrink-0 flex items-center space-x-1">
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleBannerUpload}
                        disabled={uploadingBanner}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {/* Upload Progress & Pulsing Loading Indicator */}
                  {uploadingBanner && (
                    <div className="space-y-1.5 p-3 bg-primary-50/50 dark:bg-slate-800/50 border border-primary-100 dark:border-slate-700 rounded-xl">
                      <div className="flex justify-between items-center text-[10px] font-black text-primary-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                          </span>
                          <span>Uploading Creative to Cloudinary...</span>
                        </div>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-500 h-full rounded-full transition-all duration-300 shadow-xs" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-sys-text-secondary">
                    Supported formats: JPG, JPEG, PNG, WEBP. Max size: 20 MB.
                  </p>
                </div>
              </div>

              {/* Live 2.4:1 Creative Aspect Ratio Preview Box */}
              {bannerForm.image && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-sys-text-secondary uppercase">Live Creative Preview (2.4:1 Ratio)</span>
                  <div className="relative w-full aspect-[2.4/1] rounded-2xl overflow-hidden bg-slate-900 border border-sys-border">
                    <img src={bannerForm.image} alt="Creative Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-sys-text-primary block mb-1">Alt Text / Accessibility Label (Optional)</label>
                <input
                  type="text"
                  value={bannerForm.altText}
                  onChange={(e) => setBannerForm({ ...bannerForm, altText: e.target.value })}
                  placeholder="e.g. Exam Week Special Combo 30% Off"
                  className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Redirect Action Type *</label>
                  <select
                    value={bannerForm.redirectType}
                    onChange={(e) => setBannerForm({ ...bannerForm, redirectType: e.target.value, redirectTarget: '' })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none"
                  >
                    <option value="none">None (Display Only)</option>
                    <option value="category">Category Page</option>
                    <option value="product">Product Search / Item</option>
                    <option value="external">External Website URL</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={bannerForm.displayOrder}
                    onChange={(e) => setBannerForm({ ...bannerForm, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Redirect Target Field */}
              {bannerForm.redirectType === 'category' && (
                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Select Target Category *</label>
                  <select
                    value={bannerForm.redirectTarget}
                    onChange={(e) => setBannerForm({ ...bannerForm, redirectTarget: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((cat) => (
                      <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {bannerForm.redirectType === 'product' && (
                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Target Product Search Term or Name *</label>
                  <input
                    type="text"
                    value={bannerForm.redirectTarget}
                    onChange={(e) => setBannerForm({ ...bannerForm, redirectTarget: e.target.value })}
                    placeholder="e.g. Lays, Red Bull, Maggi..."
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none"
                  />
                </div>
              )}

              {bannerForm.redirectType === 'external' && (
                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">External Target URL *</label>
                  <input
                    type="url"
                    value={bannerForm.redirectTarget}
                    onChange={(e) => setBannerForm({ ...bannerForm, redirectTarget: e.target.value })}
                    placeholder="https://example.com/promo"
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="bannerActive"
                  checked={bannerForm.isActive}
                  onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-700 text-primary-500 focus:ring-[#40A2E3]"
                />
                <label htmlFor="bannerActive" className="font-bold text-sys-text-primary">Visible / Active on Customer Home page</label>
              </div>

              <div className="pt-3 border-t border-sys-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  disabled={uploadingBanner}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingBanner}
                  className="px-4 py-2 text-xs font-bold bg-primary-500 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingBanner ? 'Uploading...' : 'Save Banner Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Section Create/Edit Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-sys-surface rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-sys-border space-y-4">
            <div className="flex justify-between items-center border-b border-sys-border pb-3">
              <h3 className="text-sm font-bold text-sys-text-primary">
                {editingSection ? 'Edit Custom Home Section' : 'Create Custom Home Section'}
              </h3>
              <button onClick={() => setShowSectionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Section Title *</label>
                  <input
                    type="text"
                    required
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                    placeholder="e.g. Budget Picks"
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-sys-text-primary block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={sectionForm.displayOrder}
                    onChange={(e) => setSectionForm({ ...sectionForm, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-sys-text-primary block mb-1.5">
                  Select Products to Include in Section
                </label>
                <div className="border border-sys-border rounded-2xl p-3 max-h-52 overflow-y-auto space-y-2">
                  {products.map((prod) => {
                    const isSelected = sectionForm.products.includes(prod._id);
                    return (
                      <div
                        key={prod._id}
                        onClick={() => handleToggleProductInSection(prod._id)}
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${isSelected
                          ? 'border-primary-500 bg-primary-500/5 text-primary-500'
                          : 'border-sys-border text-slate-600 dark:text-slate-400'
                          }`}
                      >
                        <span className="font-bold truncate max-w-[70%]">{prod.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400">({prod.category})</span>
                          {isSelected && <Check size={14} className="stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sectionActive"
                  checked={sectionForm.isActive}
                  onChange={(e) => setSectionForm({ ...sectionForm, isActive: e.checked })}
                  className="rounded border-slate-300 dark:border-slate-700 text-primary-500 focus:ring-[#40A2E3]"
                />
                <label htmlFor="sectionActive" className="font-bold text-sys-text-primary">Active (Visible on Customer Home page)</label>
              </div>

              <div className="pt-3 border-t border-sys-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary-500 text-white rounded-xl shadow-md"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
