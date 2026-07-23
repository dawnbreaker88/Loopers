import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, loginSuccess } from '../store/authSlice.js';
import { useTheme } from '../context/ThemeContext.jsx';
import api from '../services/api.js';
import {
  User,
  MapPin,
  ShoppingBag,
  LogOut,
  Sun,
  Moon,
  Plus,
  Trash2,
  ShieldCheck,
  ChevronRight,
  Phone,
  Mail,
  CreditCard,
  Settings,
  Key,
  Save,
  Edit2,
  Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, token } = useSelector((state) => state.auth);

  // Permission & PWA States
  const [notifState, setNotifState] = useState('default'); // 'default', 'granted', 'denied', 'unsupported'
  const [hasPushSub, setHasPushSub] = useState(false);
  const [locState, setLocState] = useState('prompt'); // 'prompt', 'granted', 'denied', 'unsupported', 'fetching'
  const [locLoading, setLocLoading] = useState(false);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const syncBrowserStates = async () => {
    // 1. Notification Permission & Subscription State
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifState('unsupported');
    } else {
      setNotifState(Notification.permission);
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const sub = await registration.pushManager.getSubscription();
          setHasPushSub(!!sub);
        } else {
          setHasPushSub(false);
        }
      } catch (e) {
        setHasPushSub(false);
      }
    }

    // 2. Geolocation State
    if (!('navigator' in window) || !('geolocation' in navigator)) {
      setLocState('unsupported');
    } else if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocState(result.state);
        
        result.onchange = () => {
          setLocState(result.state);
        };
      } catch (err) {
        setLocState('prompt');
      }
    } else {
      // Safari fallback
      const coords = user?.location;
      if (coords && coords.latitude && coords.longitude) {
        setLocState('granted');
      } else {
        setLocState('prompt');
      }
    }
  };

  useEffect(() => {
    syncBrowserStates();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncBrowserStates();
      }
    };
    window.addEventListener('focus', syncBrowserStates);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', syncBrowserStates);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const handleEnableLocation = () => {
    if (!('navigator' in window) || !('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser.');
      setLocState('unsupported');
      return;
    }

    if (locLoading) return;
    setLocLoading(true);
    setLocState('fetching');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await api.put('/api/auth/location', { latitude, longitude });
          if (res.data.success) {
            dispatch(loginSuccess({ token, user: { ...user, location: res.data.location } }));
            toast.success('Location acquired and saved!');
          }
        } catch (err) {
          toast.success('Location acquired!');
        } finally {
          setLocLoading(false);
          syncBrowserStates();
        }
      },
      (error) => {
        setLocLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocState('denied');
            toast.error('Location permission denied. Please allow location access in browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocState('prompt');
            if (!navigator.onLine) {
              toast.error('Location unavailable. You are currently offline. Please check your internet connection.');
            } else {
              toast.error('Location unavailable. Your device GPS or location service might be disabled.');
            }
            break;
          case error.TIMEOUT:
            setLocState('prompt');
            toast.error('Location request timed out. Please ensure GPS is enabled and try again.');
            break;
          default:
            setLocState('prompt');
            toast.error(`Location error: ${error.message || 'Failed to acquire location.'}`);
            break;
        }
        syncBrowserStates();
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      toast.error('Notifications not supported on this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifState(permission);
      if (permission !== 'granted') {
        toast.error('Notifications permission was denied. Please unlock in browser settings.');
        return;
      }

      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      const isAdminUser = user?.role === 'admin';
      const keyEndpoint = isAdminUser ? '/api/admin/vapid-public-key' : '/api/auth/vapid-public-key';
      const subEndpoint = isAdminUser ? '/api/admin/subscribe' : '/api/auth/subscribe';

      const keyRes = await api.get(keyEndpoint);
      if (!keyRes.data?.success || !keyRes.data?.publicKey) {
        throw new Error('Failed to retrieve server encryption key.');
      }

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.data.publicKey)
      };

      const subscription = await registration.pushManager.subscribe(subscribeOptions);

      await api.post(subEndpoint, { subscription });
      
      toast.success('Notifications enabled successfully!');
      syncBrowserStates();
    } catch (err) {
      console.error('[Notification Enable Error]', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to enable notifications.');
    }
  };

  const handleDisableNotifications = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const isAdminUser = user?.role === 'admin';
        const subEndpoint = isAdminUser ? '/api/admin/unsubscribe' : '/api/auth/unsubscribe';
        await api.post(subEndpoint, { endpoint: subscription.endpoint }).catch(() => {});
        await subscription.unsubscribe();
        toast.success('Notifications disabled successfully.');
      }
      syncBrowserStates();
    } catch (err) {
      console.error('Disable notifications error:', err);
      toast.error('Failed to disable notifications.');
    }
  };

  const handleOpenSettingsGuide = (type) => {
    const text = type === 'location' 
      ? 'To allow location: Tap the lock icon in your browser URL bar and change Location permission to Allow.'
      : 'To allow notifications: Tap the lock icon in your browser URL bar and change Notifications permission to Allow.';
    toast.error(text, { id: 'settings-guide-toast', duration: 6000 });
  };

  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    houseNumber: '',
    street: '',
    city: 'Hyderabd',
    state: 'Telengana',
    pincode: '500088',
    landmark: '',
    latitude: '',
    longitude: ''
  });

  // Admin Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const handleLogout = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            const isAdminUser = user?.role === 'admin';
            const endpoint = isAdminUser ? '/api/admin/unsubscribe' : '/api/auth/unsubscribe';
            await api.post(endpoint, { endpoint: subscription.endpoint }).catch(() => {});
            await subscription.unsubscribe().catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn('Failed to unsubscribe push on logout:', e);
    }
    dispatch(logout());
    toast.success('Logged out');
    navigate('/login');
  };

  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      // 1. Update basic info (Name, Phone, Email)
      const res = await api.put('/api/auth/profile', {
        name: profileForm.name,
        phone: profileForm.phone,
        email: profileForm.email
      });

      // 2. Change password if filled
      if (profileForm.newPassword) {
        if (!profileForm.currentPassword) {
          toast.error('Current password required to set new password');
          setUpdatingProfile(false);
          return;
        }
        await api.put('/api/auth/change-password', {
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword
        });
      }

      if (res.data.success) {
        dispatch(loginSuccess({ token, user: res.data.user }));
        toast.success('Profile updated successfully!');
        setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const openAddressModal = (addr = null) => {
    if (addr) {
      setEditingAddressId(addr._id);
      setAddressForm({
        name: addr.name || '',
        phone: addr.phone || '',
        houseNumber: addr.houseNumber || '',
        street: addr.street || '',
        city: addr.city || 'Campus',
        state: addr.state || 'State',
        pincode: addr.pincode || '560001',
        landmark: addr.landmark || '',
        latitude: addr.latitude || '',
        longitude: addr.longitude || ''
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        name: '',
        phone: user?.phone || '',
        houseNumber: '',
        street: '',
        city: 'Campus',
        state: 'State',
        pincode: '560001',
        landmark: '',
        latitude: '',
        longitude: ''
      });

      // Fetch dynamic GPS coords to populate default address coords
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setAddressForm(prev => ({
              ...prev,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            }));
          },
          null,
          { enableHighAccuracy: true }
        );
      }
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingAddressId) {
        res = await api.put(`/api/auth/address/${editingAddressId}`, addressForm);
        toast.success('Address updated successfully');
      } else {
        res = await api.post('/api/auth/address', addressForm);
        toast.success('Address added to account');
      }

      if (res.data.success) {
        setAddresses(res.data.addresses || []);
        // Trigger redux store sync
        const profileRes = await api.get('/api/auth/profile');
        if (profileRes.data.success) {
          dispatch(loginSuccess({ token, user: profileRes.data.user }));
        }
        setShowAddressModal(false);
        setEditingAddressId(null);
      }
    } catch (err) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await api.delete(`/api/auth/address/${addressId}`);
      if (res.data.success) {
        toast.success('Address removed');
        setAddresses(res.data.addresses || []);
        // Trigger redux store sync
        const profileRes = await api.get('/api/auth/profile');
        if (profileRes.data.success) {
          dispatch(loginSuccess({ token, user: profileRes.data.user }));
        }
      }
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-base font-black text-[#0F172A] dark:text-white">
          {isAdmin ? 'Admin Profile & Settings' : 'My Account Profile'}
        </h1>
        {isAdmin && (
          <span className="text-xs font-extrabold bg-[#40A2E3] text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
            Campus Admin
          </span>
        )}
      </div>

      {/* User Info Header Card */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-4">
        <div className="w-14 h-14 rounded-full bg-[#40A2E3]/15 text-[#40A2E3] flex items-center justify-center font-black text-xl flex-shrink-0">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-[#0F172A] dark:text-white truncate">{user?.name}</h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 flex items-center mt-0.5">
            <Mail size={12} className="mr-1" />
            {user?.email}
          </p>
          <p className="text-xs text-[#64748B] dark:text-slate-400 flex items-center mt-0.5 font-mono">
            <Phone size={12} className="mr-1" />
            {user?.phone}
          </p>
        </div>
      </div>

      {/* ADMIN EDIT PROFILE SECTION (If user is Admin) */}
      {isAdmin && (
        <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ShieldCheck size={18} className="text-[#40A2E3]" />
            <h3 className="text-xs font-black text-[#0F172A] dark:text-white">Update Admin Account Details</h3>
          </div>

          <form onSubmit={handleUpdateAdminProfile} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#0F172A] dark:text-white block mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] dark:text-white block mb-1">Mobile Contact Number</label>
                <input
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#0F172A] dark:text-white block mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="font-bold text-[#0F172A] dark:text-white flex items-center text-[11px]">
                <Key size={13} className="mr-1 text-[#40A2E3]" />
                Change Password (Optional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={profileForm.currentPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full bg-[#40A2E3] hover:bg-[#40A2E3]/90 text-white font-black py-3 rounded-xl shadow-md flex items-center justify-center space-x-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save size={15} />
              <span>{updatingProfile ? 'Saving Changes...' : 'Save Admin Profile'}</span>
            </button>
          </form>
        </div>
      )}

      {/* REQUIRED CUSTOMER MENU OPTIONS */}
      {!isAdmin && (
        <div className="bg-sys-surface border border-sys-border rounded-2xl p-2 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">

          {/* 1. My Orders */}
          <button
            onClick={() => navigate('/app/orders')}
            className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <div className="flex items-center space-x-3">
              <ShoppingBag size={18} className="text-[#40A2E3]" />
              <span>My Orders</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          {/* 2. Saved Addresses */}
          <button
            onClick={() => openAddressModal()}
            className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <div className="flex items-center space-x-3">
              <MapPin size={18} className="text-[#22C55E]" />
              <span>Saved Addresses ({addresses.length})</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          {/* 4. Settings (Dark Mode Toggle) */}
          <div className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-white">
            <div className="flex items-center space-x-3">
              <Settings size={18} className="text-amber-500" />
              <span>Dark Mode Appearance</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${isDarkMode ? 'bg-[#40A2E3] justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </button>
          </div>

        </div>
      )}

      {/* Saved Addresses Summary List (Customer Only) */}
      {!isAdmin && (
        <div className="bg-sys-surface border border-sys-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MapPin size={18} className="text-[#40A2E3]" />
              <h3 className="text-xs font-black text-[#0F172A] dark:text-white">Saved Addresses</h3>
            </div>
            <button
              onClick={() => openAddressModal()}
              className="text-xs font-bold text-[#40A2E3] hover:underline flex items-center"
            >
              <Plus size={14} className="mr-0.5" />
              Add New
            </button>
          </div>

          <div className="space-y-2">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className="p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700/70 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-bold text-[#0F172A] dark:text-white">
                    {addr.name}, {addr.houseNumber}
                  </span>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                    {addr.street}, {addr.city} {addr.landmark ? `(Landmark: ${addr.landmark})` : ''}
                  </p>
                  {addr.latitude && (
                    <p className="text-[9px] text-[#40A2E3] font-mono mt-0.5">GPS: {addr.latitude?.toFixed(4)}, {addr.longitude?.toFixed(4)}</p>
                  )}
                </div>

                <div className="flex space-x-1.5">
                  <button
                    onClick={() => openAddressModal(addr)}
                    className="p-1.5 text-[#40A2E3] hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr._id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Permissions & Settings Card */}
      <div className="bg-sys-surface border border-sys-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-sys-border pb-3">
          <Settings size={18} className="text-[#40A2E3]" />
          <h3 className="text-xs font-black text-[#0F172A] dark:text-white">System Permissions & PWA Settings</h3>
        </div>

        <div className="space-y-4 text-xs font-semibold">
          {/* Notifications Permission */}
          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <span className="text-[#0F172A] dark:text-white font-bold">Push Notifications</span>
              <p className="text-[10px] text-[#64748B] dark:text-slate-400">
                {notifState === 'granted' && hasPushSub && <span className="text-emerald-500 font-extrabold">✅ Enabled</span>}
                {notifState === 'granted' && !hasPushSub && <span className="text-amber-500 font-extrabold">⚠️ Out of Sync (Recreating...)</span>}
                {notifState === 'denied' && <span className="text-red-500 font-extrabold">❌ Permission Denied</span>}
                {notifState === 'default' && <span className="text-slate-500 font-extrabold">Disabled</span>}
                {notifState === 'unsupported' && <span className="text-slate-400 font-extrabold">Unsupported on this Browser</span>}
              </p>
            </div>
            
            {notifState === 'unsupported' ? (
              <span className="text-slate-400 text-[11px]">N/A</span>
            ) : notifState === 'denied' ? (
              <button
                type="button"
                onClick={() => handleOpenSettingsGuide('notifications')}
                className="py-1.5 px-3 rounded-lg bg-amber-500 text-white text-[10px] font-black hover:bg-amber-600 transition-colors"
              >
                Open Settings
              </button>
            ) : notifState === 'granted' && hasPushSub ? (
              <button
                type="button"
                onClick={handleDisableNotifications}
                className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[10px] font-black transition-colors"
              >
                Disable
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="py-1.5 px-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-black shadow-xs transition-colors"
              >
                Enable
              </button>
            )}
          </div>

          {/* Location Permission */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800/60 pt-3">
            <div className="space-y-0.5">
              <span className="text-[#0F172A] dark:text-white font-bold">Precise Location</span>
              <p className="text-[10px] text-[#64748B] dark:text-slate-400">
                {locState === 'granted' && <span className="text-emerald-500 font-extrabold">✅ Enabled</span>}
                {locState === 'denied' && <span className="text-red-500 font-extrabold">❌ Permission Denied</span>}
                {locState === 'fetching' && <span className="text-[#40A2E3] font-extrabold animate-pulse">Acquiring GPS Coords...</span>}
                {(locState === 'prompt' || locState === 'default') && <span className="text-slate-500 font-extrabold">Disabled</span>}
                {locState === 'unsupported' && <span className="text-slate-400 font-extrabold">Unsupported on this Browser</span>}
              </p>
            </div>

            {locState === 'unsupported' ? (
              <span className="text-slate-400 text-[11px]">N/A</span>
            ) : locState === 'denied' ? (
              <button
                type="button"
                onClick={() => handleOpenSettingsGuide('location')}
                className="py-1.5 px-3 rounded-lg bg-amber-500 text-white text-[10px] font-black hover:bg-amber-600 transition-colors"
              >
                Open Settings
              </button>
            ) : locState === 'granted' ? (
              <button
                type="button"
                onClick={handleEnableLocation}
                disabled={locLoading}
                className="py-1.5 px-3 rounded-lg bg-[#40A2E3]/10 hover:bg-[#40A2E3]/20 text-[#40A2E3] border border-[#40A2E3]/20 text-[10px] font-black transition-colors"
              >
                Refresh GPS
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnableLocation}
                disabled={locLoading}
                className="py-1.5 px-3 rounded-lg bg-[#40A2E3] hover:bg-[#2E94D9] text-white text-[10px] font-black shadow-xs transition-colors"
              >
                Enable Location
              </button>
            )}
          </div>

          {/* Unified Dark Mode Control */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800/60 pt-3">
            <span className="text-[#0F172A] dark:text-white font-bold">Dark Mode Theme</span>
            <button
              type="button"
              onClick={toggleTheme}
              className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${isDarkMode ? 'bg-[#40A2E3] justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'}`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black py-3.5 rounded-2xl border border-red-500/20 flex items-center justify-center space-x-2 active:scale-[0.99] transition-all"
      >
        <LogOut size={16} />
        <span>Log Out of Account</span>
      </button>

      {/* Add / Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                {editingAddressId ? 'Edit Campus Location' : 'Add Campus Location'}
              </h3>
              <button onClick={() => setShowAddressModal(false)} className="text-slate-400 font-bold text-xs">Close</button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] dark:text-white block mb-1">Location Label (e.g. pincode , Library)</label>
                <input
                  type="text"
                  required
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  placeholder="e.g. Hostel name "
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] dark:text-white block mb-1">Room / House / Apartment No.</label>
                <input
                  type="text"
                  required
                  value={addressForm.houseNumber}
                  onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
                  placeholder="e.g. Room 304"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] dark:text-white block mb-1">Block / Street / Landmark</label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}

                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] dark:text-white block mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] dark:text-white block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#40A2E3] text-white rounded-xl shadow-md"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
