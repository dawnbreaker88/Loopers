import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice.js';
import authService from '../services/authService.js';
import Logo from '../components/Logo.jsx';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      if (data.success) {
        dispatch(loginSuccess({ token: data.accessToken, user: data.user }));
        toast.success(`Welcome back, ${data.user.name}!`);

        if (data.user.role === 'admin') {
          navigate('/app/admin/orders');
        } else {
          navigate('/app');
        }
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8">

      {/* Logo Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <Logo size="large" className="mb-3" />
        <h2 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight">Fast. Fresh. Loopers.</h2>
        <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mt-0.5">Delivery fees just ₹1</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-sys-surface rounded-3xl border border-sys-border shadow-soft p-6 sm:p-8 animate-fade-in">
        <form onSubmit={handleLogin} className="space-y-4">

          <div className="flex flex-col">
            <label className="text-xs font-bold text-[#0F172A] dark:text-white mb-1.5 flex items-center">
              <User size={13} className="mr-1 text-[#40A2E3]" />
              Email or Phone
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" your email"
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center">
                <Lock size={13} className="mr-1 text-[#40A2E3]" />
                Password
              </label>
              <button
                type="button"
                onClick={() => toast.error('Reset instructions sent to email')}
                className="text-[10px] font-bold text-[#40A2E3] hover:underline"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-[#40A2E3] border-[#E2E8F0] dark:border-slate-700 rounded"
            />
            <label htmlFor="remember" className="text-xs font-semibold text-[#64748B] dark:text-slate-400 select-none cursor-pointer">
              Remember this device
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#40A2E3] text-white py-3.5 rounded-xl text-xs font-black shadow-md shadow-[#40A2E3]/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-1"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>


      </div>

      <p className="text-xs font-bold text-[#64748B] dark:text-slate-400 mt-6">
        New to Loopers?{' '}
        <Link to="/signup" className="text-[#40A2E3] hover:underline">
          Create Account
        </Link>
      </p>

    </div>
  );
}
