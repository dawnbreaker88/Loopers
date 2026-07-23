import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCartLocal } from '../store/cartSlice.js';
import { ShieldCheck, Loader2, ArrowRight, XCircle, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { orderId, amount } = location.state || {};
  const [paymentState, setPaymentState] = useState('processing');
  
  const upiId = import.meta.env.VITE_UPI_ID || '';
  const upiLink = upiId 
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Loopers&am=${amount}&tn=Order ${orderId}` 
    : '';

  useEffect(() => {
    if (!orderId) {
      toast.error('No active order context found');
      navigate('/app');
      return;
    }

    // Auto verify and mark success after 10 seconds of scanning/initiation
    const timer = setTimeout(() => {
      handleConfirmSuccess();
    }, 10000);

    return () => clearTimeout(timer);
  }, [orderId, navigate, dispatch]);

  const handleConfirmSuccess = () => {
    setPaymentState('success');
    dispatch(clearCartLocal());
    toast.success('Payment verified!');
    
    setTimeout(() => {
      navigate(`/app/tracking/${orderId}`);
    }, 1500);
  };

  const handleCancelPayment = () => {
    setPaymentState('failed');
    toast.error('Payment cancelled');
    setTimeout(() => {
      navigate('/app/checkout');
    }, 1500);
  };

  const handleCopyUpi = () => {
    if (!upiId) {
      toast.error('UPI ID is not configured.');
      return;
    }
    navigator.clipboard.writeText(upiId);
    toast.success('UPI ID copied to clipboard!');
  };

  const handlePayNow = () => {
    if (!upiLink) {
      toast.error('UPI payment is currently unavailable.');
      return;
    }
    window.location.href = upiLink;
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
          <p className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Amount to Pay</p>
          <p className="text-2xl font-black text-[#0F172A] dark:text-white font-mono mt-1">₹{(amount || 0).toFixed(2)}</p>
        </div>

        {paymentState === 'processing' && (
          <div className="space-y-4 py-2 flex flex-col items-center">
            {/* UPI QR Display */}
            {upiId ? (
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=${encodeURIComponent(upiId)}&pn=Loopers&am=${amount}&tn=Order%20${orderId}&cu=INR`}
                  alt="Loopers UPI QR"
                  className="w-28 h-28 object-contain"
                />
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-xl w-full">
                UPI QR Code unavailable (No merchant UPI ID configured)
              </div>
            )}

            {/* UPI ID Display & Copy */}
            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-[#64748B] dark:text-slate-300 w-full justify-center">
              <span>{upiId || 'No UPI ID configured'}</span>
              {upiId && (
                <button 
                  type="button" 
                  onClick={handleCopyUpi} 
                  className="text-[#40A2E3] hover:text-[#40A2E3]/80 p-0.5 rounded transition-colors"
                >
                  <Copy size={13} />
                </button>
              )}
            </div>

            {/* Pay Now Button */}
            <button
              type="button"
              onClick={handlePayNow}
              disabled={!upiId}
              className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98] ${
                upiId 
                  ? 'bg-[#40A2E3] hover:bg-[#38bdf8] text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>Pay Now</span>
            </button>

            {/* Verification State / Cancel */}
            <div className="pt-4 w-full space-y-2.5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-center space-x-2 text-[#40A2E3]">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-xs font-black">Waiting for payment...</span>
              </div>
              <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Once paid, the payment will be verified.
              </p>
              
              <div className="flex items-center justify-center space-x-4 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmSuccess}
                  className="text-[11px] font-bold text-[#22C55E] hover:underline"
                >
                  Verify Instantly
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={handleCancelPayment}
                  className="text-[11px] font-bold text-[#EF4444] hover:underline"
                >
                  Cancel Transaction
                </button>
              </div>
            </div>
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
