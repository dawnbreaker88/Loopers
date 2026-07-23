import React from 'react';
import { Store, Clock, RefreshCw } from 'lucide-react';
import Logo from './Logo.jsx';

export default function StoreClosedScreen({ store, onRefresh }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 text-center select-none animate-fade-in">
      
      {/* Store Closed Banner Illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
          <Store size={48} className="animate-pulse" />
        </div>
        <span className="absolute bottom-0 right-1 bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
          Closed
        </span>
      </div>

      <Logo size="normal" className="mb-2" />

      <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
        Store Currently Closed
      </h1>

      <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
        Loopers is currently closed for new orders. Please visit again during our operating hours.
      </p>

      {/* Operating Hours Card */}
      <div className="mt-6 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-700/80 rounded-2xl p-4 max-w-xs w-full shadow-xs flex items-center justify-center space-x-3">
        <Clock size={20} className="text-[#40A2E3]" />
        <div className="text-left">
          <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider block">
            Operating Hours
          </span>
          <p className="text-xs font-black text-[#0F172A] dark:text-white font-mono">
            {store?.openingTime || '07:00 AM'} – {store?.closingTime || '02:00 AM'}
          </p>
        </div>
      </div>

      {/* Refresh Status Button */}
      <button
        onClick={onRefresh}
        className="mt-6 bg-[#40A2E3] hover:bg-[#40A2E3]/90 text-white text-xs font-black px-6 py-3 rounded-2xl shadow-md shadow-[#40A2E3]/20 flex items-center space-x-2 active:scale-95 transition-all"
      >
        <RefreshCw size={15} />
        <span>Check Store Status</span>
      </button>

    </div>
  );
}
