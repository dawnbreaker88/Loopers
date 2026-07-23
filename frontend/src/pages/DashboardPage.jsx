import React, { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function DashboardPage() {
  const { user, token } = useSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/orders" replace />;
    }
    // Default fallback for customer role
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh] bg-[#F8FAFC]">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-[#40A2E3] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">Loading Dashboard...</p>
      </div>
    </div>
  );
}
