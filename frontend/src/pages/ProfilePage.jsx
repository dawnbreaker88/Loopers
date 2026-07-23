import React, { useState } from 'react';
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
  Edit2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, token } = useSelector((state) => state.auth);

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

  const handleLogout = () => {
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
