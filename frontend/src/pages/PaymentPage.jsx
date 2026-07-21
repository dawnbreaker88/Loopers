import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCartLocal } from '../store/cartSlice.js';
import { ShieldCheck, Loader2, ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { orderId, amount } = location.state || {};
  const [paymentState, setPaymentState] = useState('processing');

  useEffect(() => {
    if (!orderId) {
      toast.error('No active order context found');
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      setPaymentState('success');
      dispatch(clearCartLocal());
      toast.success('Payment verified!');
      
      const redirectTimer = setTimeout(() => {
        navigate(`/tracking/${orderId}`);
      }, 1500);

      return () => clearTimeout(redirectTimer);
    }, 2500);

    return () => clearTimeout(timer);
  }, [orderId, navigate, dispatch]);

  const handleCancelPayment = () => {
    setPaymentState('failed');
    toast.error('Payment cancelled');
    setTimeout(() => {
      navigate('/checkout');
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8">
      
      <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl border border-[#E2E8F0] dark:border-slate-700/80 shadow-soft p-8 text-center space-y-6 animate-fade-in">
        
        <div className="flex justify-center">
          <div className="bg-[#40A2E3]/10 p-3 rounded-2xl text-[#40A2E3]">
            <ShieldCheck size={36} />
          </div>
        </div>

        <div>
          <h2 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight">Loopers Payment Gateway</h2>
          <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400 mt-1 font-mono uppercase tracking-wider">
            TXN: {orderId?.slice(-8).toUpperCase()}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-2xl py-4">
          <p className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Amount Paid</p>
          <p className="text-2xl font-black text-[#0F172A] dark:text-white font-mono mt-1">₹{(amount || 0).toFixed(2)}</p>
        </div>

        {paymentState === 'processing' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center space-x-2 text-[#40A2E3]">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-xs font-black">Authorizing Payment...</span>
            </div>
            <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Verifying transaction with your payment provider...
            </p>
            <button
              onClick={handleCancelPayment}
              className="text-[11px] font-bold text-[#EF4444] hover:underline"
            >
              Cancel Transaction
            </button>
          </div>
        )}

        {paymentState === 'success' && (
          <div className="space-y-3 py-2 text-[#22C55E] animate-fade-in">
            <CheckCircle2 size={44} className="mx-auto" />
            <h3 className="text-sm font-black text-[#0F172A] dark:text-white">Payment Confirmed!</h3>
            <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400">Dispatching to tracking...</p>
          </div>
        )}

        {paymentState === 'failed' && (
          <div className="space-y-3 py-2 text-[#EF4444] animate-fade-in">
            <XCircle size={44} className="mx-auto" />
            <h3 className="text-sm font-black text-[#0F172A] dark:text-white">Payment Failed</h3>
            <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400">Returning to checkout...</p>
          </div>
        )}

      </div>

    </div>
  );
}
