import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/productSlice.js';
import ProductCard from '../components/ProductCard.jsx';
import api from '../services/api.js';
import { Search, Package, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);

  const categoryFromUrl = searchParams.get('category') || 'All';
  const searchFromUrl = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);

  // Dynamic Categories state
  const [categories, setCategories] = useState([{ name: 'All', icon: 'https://cdn-icons-png.flaticon.com/512/616/616490.png' }]);

  const getCategoryIconUrl = (cat) => {
    const iconUrlMap = {
      'All': 'https://cdn-icons-png.flaticon.com/512/616/616490.png',
      'Snacks': 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png',
      'Beverages': 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png',
      'Dairy': 'https://cdn-icons-png.flaticon.com/512/3050/3050158.png',
      'Groceries': 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png',
      'Household': 'https://cdn-icons-png.flaticon.com/512/995/995053.png',
      'Fast Food': 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
      'Vegetables': 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png',
      'Fruits': 'https://cdn-icons-png.flaticon.com/512/3194/3194766.png',
      'Electronics': 'https://cdn-icons-png.flaticon.com/512/3659/3659899.png',
    };

    const icon = cat?.icon;
    const name = cat?.name;

    if (icon && (icon.startsWith('http') || icon.startsWith('/'))) {
      return icon;
    }
    return iconUrlMap[name] || 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png';
  };

  // Collapsible Sidebar State (Persisted in sessionStorage; defaults to collapsed on <=768px)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = sessionStorage.getItem('loopers_search_sidebar_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
      return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const nextState = !prev;
      try {
        sessionStorage.setItem('loopers_search_sidebar_collapsed', String(nextState));
      } catch (err) {
        console.warn('Could not save sidebar state to sessionStorage');
      }
      return nextState;
    });
  };

  // Fetch dynamic categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/categories');
        if (res.data.success && Array.isArray(res.data.categories)) {
          setCategories([{ name: 'All', icon: '⚡' }, ...res.data.categories]);
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic categories for sidebar');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    dispatch(fetchProducts({ category: selectedCategory === 'All' ? '' : selectedCategory, search: searchQuery }));
  }, [dispatch, selectedCategory, searchQuery]);

  const handleCategorySelect = (catName) => {
    if (catName === 'Printouts') {
      navigate('/printouts');
      return;
    }
    setSelectedCategory(catName);
    const params = new URLSearchParams(searchParams);
    if (catName === 'All') {
      params.delete('category');
    } else {
      params.set('category', catName);
    }
    setSearchParams(params);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] sm:h-[calc(100vh-140px)] max-w-7xl mx-auto overflow-hidden pb-16 sm:pb-4 space-y-3">
      
      {/* Search Bar Input (Fixed Header) */}
      <div className="flex-shrink-0 relative flex items-center w-full bg-sys-surface border border-sys-border rounded-2xl px-3.5 py-2.5 shadow-xs">
        <Search size={18} className="text-[#40A2E3] mr-2.5 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search snacks, beverages, groceries..."
          className="w-full bg-transparent text-xs font-semibold text-[#0F172A] dark:text-white placeholder-[#64748B] focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="p-1 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dual-Pane Layout: Left Sidebar + Right Product Grid */}
      <div className="flex-1 flex gap-2 sm:gap-4 min-h-0 overflow-hidden">
        
        {/* Left Collapsible Sidebar */}
        <aside 
          className={`flex-shrink-0 flex flex-col space-y-2 overflow-hidden h-full transition-[width] duration-200 ease-in-out ${
            isSidebarCollapsed ? 'w-12 sm:w-14' : 'w-24 sm:w-36'
          }`}
        >
          {/* Collapse / Expand Toggle Button Header */}
          <div className="flex items-center justify-between px-1 shrink-0">
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-extrabold uppercase text-[#64748B] dark:text-slate-400 tracking-wider truncate hidden sm:inline">
                Categories
              </span>
            )}
            <button
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? "Expand category sidebar" : "Collapse category sidebar"}
              aria-expanded={!isSidebarCollapsed}
              title={isSidebarCollapsed ? "Expand categories (▶)" : "Collapse categories (◀)"}
              className="w-full flex items-center justify-center p-1.5 rounded-xl bg-sys-surface border border-sys-border text-[#64748B] hover:text-[#40A2E3] hover:bg-sys-surface-hover transition-colors shadow-xs"
            >
              {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          {/* Vertical Scrollable Category List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5 scrollbar-hide">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  title={cat.name}
                  aria-label={cat.name}
                  className={`w-full flex items-center transition-all text-xs ${
                    isSidebarCollapsed
                      ? 'justify-center p-2 rounded-2xl'
                      : 'flex-col sm:flex-row justify-center sm:justify-start sm:space-x-2 p-2 sm:p-2.5 rounded-2xl text-center sm:text-left'
                  } ${
                    isSelected 
                      ? 'bg-[#40A2E3] text-white font-extrabold shadow-md shadow-[#40A2E3]/20' 
                      : 'bg-sys-surface border border-sys-border text-[#0F172A] dark:text-slate-300 font-semibold hover:bg-sys-surface-hover'
                  }`}
                >
                  <img 
                    src={getCategoryIconUrl(cat)} 
                    alt={cat.name} 
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 filter drop-shadow-xs" 
                  />
                  {!isSidebarCollapsed && (
                    <span className="truncate text-[9px] sm:text-xs w-full sm:w-auto mt-0.5 sm:mt-0">
                      {cat.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Product Grid Area: Automatically expands as sidebar collapses */}
        <section className="flex-1 h-full overflow-y-auto pl-0.5 pr-1 pb-4 scrollbar-hide">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-700/80 rounded-2xl p-3 animate-pulse space-y-3">
                  <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3"></div>
                  <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} isSearchPage={true} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-450 dark:text-slate-400">
              <Package size={36} className="text-[#64748B] mb-2" />
              <p className="text-xs font-bold text-[#0F172A] dark:text-white">No products found in this category</p>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Try searching for other student essentials</p>
            </div>
          )}
        </section>

      </div>
      
    </div>
  );
}
