import React from 'react';
import Logo from './Logo.jsx';

export default function BrandedLoader({ message = 'Loading Loopers...' }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full select-none animate-fade-in">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 bg-[#40A2E3]/20 rounded-full animate-ping"></div>
          <Logo iconOnly size="large" className="relative z-10" />
        </div>

        <div className="text-center">
          <p className="text-xs font-black text-[#0F172A] dark:text-white tracking-widest uppercase">
            Loopers
          </p>
          <p className="text-[10px] font-extrabold text-[#40A2E3] mt-1 tracking-wider animate-pulse">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
