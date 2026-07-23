import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4 py-8">
      
      <div className="bg-white dark:bg-[#1E293B] p-5 rounded-full border border-[#E2E8F0] dark:border-slate-700 shadow-xs mb-5 text-[#40A2E3] animate-pulse">
        <Compass size={48} />
      </div>

      <h1 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tight">404</h1>
      <h2 className="text-sm font-black text-[#0F172A] dark:text-white mt-1">Page Not Found</h2>
      
      <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
        The page you are looking for might have been moved or is unavailable.
      </p>

      <button
        onClick={() => navigate('/app')}
        className="mt-6 bg-[#40A2E3] hover:opacity-95 text-white py-3 px-6 rounded-2xl text-xs font-black shadow-md shadow-[#40A2E3]/20 flex items-center space-x-1.5 transition-all active:scale-95"
      >
        <Home size={14} />
        <span>Back to Home</span>
      </button>

    </div>
  );
}
