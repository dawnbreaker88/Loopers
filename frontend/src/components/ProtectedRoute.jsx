import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import BrandedLoader from './BrandedLoader.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user, isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading && token && !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-[#F8FAFC] dark:bg-[#0F172A]">
        <BrandedLoader message="Verifying session..." />
      </div>
    );
  }

  if (!token || (!loading && !isAuthenticated)) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user) {
    if (!allowedRoles.includes(user.role)) {
      if (user.role === 'admin') {
        return <Navigate to="/admin/orders" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
