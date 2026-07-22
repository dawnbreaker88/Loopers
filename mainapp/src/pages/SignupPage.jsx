import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice.js';
import authService from '../services/authService.js';
import Logo from '../components/Logo.jsx';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updatePWAEngagement } from '../components/PWAInstallModal.jsx';

export default function SignupPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.register({
        name,
        email,
        phone,
        password,
        role: 'customer'
      });

      if (data.success) {
        dispatch(loginSuccess({ token: data.accessToken, user: data.user }));
        updatePWAEngagement('login');
        toast.success(`Account created successfully! Welcome, ${data.user.name}`);
        navigate('/');
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account. Email might be in use.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8">
      
      <div className="flex flex-col items-center mb-6 text-center">
        <Logo size="large" className="mb-3" />
        <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">delivery in 10 minutes.</p>
      </div>

      <div className="w-full max-w-md bg-sys-surface rounded-3xl border border-sys-border shadow-soft p-6 sm:p-8 animate-fade-in">
        <h2 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight mb-1">Create an Account</h2>
        <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 mb-6">Join the fastest delivery network on campus.</p>

        <form onSubmit={handleSignup} className="space-y-4">
          
          <div className="flex flex-col">
            <label className="text-xs font-bold text-[#0F172A] dark:text-white mb-1.5 flex items-center">
              <User size={13} className="mr-1 text-[#40A2E3]" />
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-[#0F172A] dark:text-white mb-1.5 flex items-center">
              <Mail size={13} className="mr-1 text-[#40A2E3]" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-[#0F172A] dark:text-white mb-1.5 flex items-center">
              <Phone size={13} className="mr-1 text-[#40A2E3]" />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 99999 99999"
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:border-[#40A2E3]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-[#0F172A] dark:text-white mb-1.5 flex items-center">
              <Lock size={13} className="mr-1 text-[#40A2E3]" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#40A2E3] text-white py-3.5 rounded-xl text-xs font-black shadow-md shadow-[#40A2E3]/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-1"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>      </div>

      <p className="text-xs font-bold text-[#64748B] dark:text-slate-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-[#40A2E3] hover:underline">
          Login
        </Link>
      </p>

    </div>
  );
}
