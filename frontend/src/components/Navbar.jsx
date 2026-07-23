import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { useTheme } from '../context/ThemeContext.jsx';
import Logo from './Logo.jsx';
import { ShoppingCart, User, LogOut, Sun, Moon, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});
  const cartItems = useSelector((state) => state.cart?.items || []);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const cartItemsCount = Array.isArray(cartItems)
    ? cartItems.reduce((total, item) => total + (Number(item?.quantity) || 0), 0)
    : 0;

  const isAdmin = user?.role === 'admin';

  // Defensive User Initials Generator
  const getUserInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'U';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setDropdownOpen(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-sys-surface border-b border-sys-border shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative gap-2">
        {/* Left: Brand Logo */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <Link to={isAdmin ? "/app/admin/orders" : "/app"} className="flex items-center" aria-label="Loopers Home">
            <Logo size="normal" iconOnly={true} />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-sys-text-secondary hover:text-sys-text-primary hover:bg-sys-surface-hover rounded-xl transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {/* Cart Icon Link (Customer Only) */}
          {!isAdmin && (
            <Link
              to="/app/cart"
              className="relative p-2 text-sys-text-secondary hover:text-primary-500 hover:bg-sys-surface-hover rounded-xl transition-colors flex items-center justify-center"
              aria-label={`Shopping Cart with ${cartItemsCount} items`}
            >
              <ShoppingCart size={19} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-extrabold text-white animate-scale">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          )}

          {/* User Profile dropdown or Sign In */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="User profile menu"
                className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
                  isAdmin 
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:border-amber-500'
                    : 'border-sys-border bg-primary-500/10 text-primary-500 hover:border-primary-500'
                }`}
              >
                <span className="text-xs font-bold font-sans uppercase">
                  {getUserInitials(user?.name)}
                </span>
              </button>

              {dropdownOpen && (
                <>
                  <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-40 bg-transparent"></div>
                  <div className="absolute right-0 mt-2 w-56 bg-sys-surface rounded-2xl shadow-xl border border-sys-border py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-sys-border mb-1 flex justify-between items-start">
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-sys-text-primary truncate">{user?.name || (isAdmin ? 'Admin' : 'Customer')}</p>
                        <p className="text-[10px] font-medium text-sys-text-secondary truncate">{user?.email || ''}</p>
                      </div>
                      {isAdmin && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ml-1">
                          Admin
                        </span>
                      )}
                    </div>

                    {isAdmin ? (
                      <Link
                        to="/app/admin/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-semibold text-sys-text-secondary hover:text-sys-text-primary hover:bg-sys-surface-hover transition-colors"
                      >
                        <ShoppingBag size={15} className="mr-2 text-amber-500" />
                        Admin Operations
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/app/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-semibold text-sys-text-secondary hover:text-sys-text-primary hover:bg-sys-surface-hover transition-colors"
                        >
                          <ShoppingBag size={15} className="mr-2 text-primary-500" />
                          My Orders
                        </Link>
                        <Link
                          to="/app/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-semibold text-sys-text-secondary hover:text-sys-text-primary hover:bg-sys-surface-hover transition-colors"
                        >
                          <User size={15} className="mr-2 text-primary-500" />
                          My Profile
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center px-4 py-2 text-xs font-semibold text-sys-error hover:bg-sys-error/5 transition-colors border-t border-sys-border mt-1"
                    >
                      <LogOut size={15} className="mr-2" />
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold bg-primary-500 text-white hover:bg-primary-500/90 px-3.5 py-1.5 rounded-xl shadow-sm transition-all font-sans"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
