import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import orderService from '../services/orderService.js';
import AddressCard from '../components/AddressCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { User, Mail, Phone, Shield, MapPin, HandCoins, Lock, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logoutUser, updateProfile } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await orderService.getOrders();
        if (res.success) {
          // Filter orders that have simulated payment status Completed/Pending
          const completed = (res.orders || []).filter(o => o.paymentId || o.paymentMethod === 'COD');
          setPayments(completed);
        }
      } catch (err) {
        console.error('Failed to load transaction history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const handleLogout = () => {
    logoutUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (!phone.trim()) {
      toast.error('Phone contact cannot be empty');
      return;
    }

    try {
      setUpdating(true);
      await updateProfile({ name, phone }).unwrap();
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && payments.length === 0) return <LoadingSpinner message="Opening profile registry..." />;
  if (!user) return null;

  return (
    <div class="max-w-4xl mx-auto py-4 space-y-8">
      {/* Page Title */}
      <div class="pl-1">
        <h2 class="text-2xl font-black text-[#111827]">Account Settings</h2>
        <p class="text-xs text-[#6B7280] font-semibold mt-0.5">Manage your personal settings, addresses, and transaction logs.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Profile Details (Form if editing, else view) */}
        <div class="md:col-span-4 bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-soft space-y-6">
          {isEditing ? (
            <form onSubmit={handleSaveProfile} class="space-y-4">
              <div class="flex flex-col items-center text-center space-y-3 pb-4 border-b border-[#E5E7EB]/50">
                <div class="w-16 h-16 rounded-2xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center font-black text-xl shadow-inner uppercase">
                  {name ? name.split(' ').map(n=>n[0]).join('') : 'U'}
                </div>
                <h3 class="font-extrabold text-[#111827] text-sm uppercase tracking-wider">Edit Profile</h3>
              </div>

              <div class="space-y-3 text-xs font-semibold text-[#6B7280]">
                <div class="space-y-1">
                  <label class="text-[9px] uppercase tracking-wider block pl-0.5">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={updating}
                    class="w-full bg-slate-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#22C55E] disabled:opacity-60"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-[9px] uppercase tracking-wider block pl-0.5">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={updating}
                    class="w-full bg-slate-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#22C55E] disabled:opacity-60"
                  />
                </div>
              </div>

              <div class="pt-4 border-t border-[#E5E7EB]/50 flex gap-2">
                <button 
                  type="submit"
                  disabled={updating}
                  class="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider disabled:opacity-60"
                >
                  {updating ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setName(user.name);
                    setPhone(user.phone);
                    setIsEditing(false);
                  }}
                  disabled={updating}
                  class="flex-1 bg-slate-50 hover:bg-slate-100 border text-[#111827] font-extrabold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div class="flex flex-col items-center text-center space-y-3 pb-6 border-b border-[#E5E7EB]/50">
                <div class="w-16 h-16 rounded-2xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center font-black text-xl shadow-inner uppercase">
                  {user.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h3 class="font-extrabold text-[#111827] text-md leading-tight">{user.name}</h3>
                  <span class="text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">{user.role} Identity</span>
                </div>
              </div>

              {/* Details list */}
              <div class="space-y-4 text-xs font-semibold text-[#6B7280]">
                <div class="flex items-center gap-3">
                  <Mail class="w-4 h-4 text-[#6B7280]" />
                  <div class="min-w-0 flex-grow">
                    <span class="text-[9px] uppercase block tracking-wider text-[#6B7280]">Email Address</span>
                    <span class="text-[#111827] truncate block">{user.email}</span>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <Phone class="w-4 h-4 text-[#6B7280]" />
                  <div>
                    <span class="text-[9px] uppercase block tracking-wider text-[#6B7280]">Phone Contact</span>
                    <span class="text-[#111827] block">{user.phone}</span>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <Shield class="w-4 h-4 text-[#6B7280]" />
                  <div>
                    <span class="text-[9px] uppercase block tracking-wider text-[#6B7280]">Platform Role</span>
                    <span class="text-[#22C55E] font-black uppercase text-[10px] block">{user.role}</span>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-[#E5E7EB]/50 space-y-2.5">
                <button 
                  onClick={() => setIsEditing(true)}
                  class="w-full bg-slate-50 hover:bg-slate-100 border text-[#111827] font-extrabold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <User class="w-3.5 h-3.5" /> Edit Profile
                </button>
                <button 
                  onClick={() => toast.success('Password update placeholder triggered')}
                  class="w-full bg-slate-50 hover:bg-slate-100 border text-[#111827] font-extrabold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Lock class="w-3.5 h-3.5" /> Change Password
                </button>
                <button 
                  onClick={handleLogout}
                  class="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#EF4444] font-extrabold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm shadow-rose-500/5"
                >
                  <LogOut class="w-3.5 h-3.5" /> Log Out Session
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Side: Addresses & Payments */}
        <div class="md:col-span-8 space-y-6">
          {/* Addresses */}
          <div class="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-soft space-y-4">
            <div class="flex justify-between items-center pl-0.5 border-b pb-2">
              <div class="flex items-center gap-1.5">
                <MapPin class="w-4.5 h-4.5 text-[#22C55E]" />
                <h3 class="font-extrabold text-sm text-[#111827] uppercase tracking-wider">Address Book</h3>
              </div>
            </div>

            {user.addresses && user.addresses.length > 0 ? (
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.addresses.map((addr) => (
                  <AddressCard 
                    key={addr._id}
                    address={addr}
                    isSelected={addr.isDefault}
                  />
                ))}
              </div>
            ) : (
              <p class="text-xs text-[#6B7280] font-semibold italic text-center py-6">No delivery addresses configured. Add one on the checkout screen.</p>
            )}
          </div>

          {/* Payment History */}
          <div class="bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-soft space-y-4">
            <div class="flex items-center gap-1.5 pl-0.5 border-b pb-2">
              <HandCoins class="w-4.5 h-4.5 text-[#22C55E]" />
              <h3 class="font-extrabold text-sm text-[#111827] uppercase tracking-wider">Simulated Settlements Logs</h3>
            </div>

            {payments.length === 0 ? (
              <p class="text-xs text-[#6B7280] font-semibold italic text-center py-8">No transaction logs recorded yet.</p>
            ) : (
              <div class="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {payments.map((p) => (
                  <div key={p._id} class="p-4 rounded-xl border border-[#E5E7EB] bg-slate-50 flex justify-between items-center text-xs text-[#6B7280] font-semibold">
                    <div class="space-y-1">
                      <p class="font-bold text-[#111827]">Order #{p._id.slice(-8)}</p>
                      <span class="text-[9px] font-mono block">Txn ID: {p.paymentId || 'COD_PENDING'}</span>
                      <span class="text-[10px] text-[#6B7280] font-medium block">{new Date(p.createdAt).toLocaleString()}</span>
                    </div>

                    <div class="text-right space-y-1">
                      <span class="text-xs font-black text-[#111827]">₹{p.totalPrice}</span>
                      <span class={`text-[9px] font-black uppercase px-2 py-0.5 rounded block ${p.paymentStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.paymentStatus} ({p.paymentMethod})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
