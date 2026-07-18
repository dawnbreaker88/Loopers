import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { changeUserPassword } from '../store/authSlice.js';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await dispatch(changeUserPassword({ currentPassword, newPassword, confirmPassword })).unwrap();
      toast.success(res.message || 'Password updated successfully');
      // Reset state and close
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      toast.error(err || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-card border border-[#E5E7EB] flex flex-col">
        {/* Header */}
        <div class="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <Lock class="w-5 h-5 text-[#22C55E]" />
            <h3 class="font-extrabold text-sm uppercase tracking-wider">Change Password</h3>
          </div>
          <button onClick={onClose} class="text-[#9CA3AF] hover:text-white transition-colors" disabled={loading}>
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} class="p-6 space-y-4">
          <div class="space-y-3.5 text-xs font-semibold text-[#6B7280]">
            <div class="space-y-1">
              <label class="text-[9px] uppercase tracking-wider block pl-0.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter current password"
                class="w-full bg-slate-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#22C55E] disabled:opacity-60"
              />
            </div>

            <div class="space-y-1">
              <label class="text-[9px] uppercase tracking-wider block pl-0.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter new password (min 8 chars)"
                class="w-full bg-slate-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#22C55E] disabled:opacity-60"
              />
            </div>

            <div class="space-y-1">
              <label class="text-[9px] uppercase tracking-wider block pl-0.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Confirm new password"
                class="w-full bg-slate-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#22C55E] disabled:opacity-60"
              />
            </div>
          </div>

          <div class="pt-4 border-t border-[#E5E7EB]/50 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              class="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold py-3 rounded-xl transition-all text-xs uppercase tracking-wider disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              class="flex-1 bg-slate-100 hover:bg-slate-200 text-[#111827] font-extrabold py-3 rounded-xl transition-all text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
