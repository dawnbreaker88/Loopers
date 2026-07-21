import React from 'react';
import { Zap, ShieldCheck, Clock, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-sys-surface border-t border-sys-border mt-12 transition-colors">
      
      {/* 4 Loopers Features Only */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#40A2E3]/10 text-[#40A2E3] flex items-center justify-center flex-shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">10 Min Delivery</h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Direct to your hostel room</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center flex-shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">Late Night Hours</h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Open till 2:00 AM</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">Zero Min Order</h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Order even 1 pen</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#40A2E3]/10 text-[#40A2E3] flex items-center justify-center flex-shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">Campus Dark Store</h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Located on Main Gate</p>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-[#E2E8F0] dark:border-[#334155] flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} Loopers. Built for Campus Life.</p>
          <p className="mt-1 sm:mt-0">Fast • Reliable • Local</p>
        </div>
      </div>

    </footer>
  );
}
