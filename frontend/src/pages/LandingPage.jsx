import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Compass, ShieldCheck, MapPin, ListPlus, ShoppingBag } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStartShopping = () => {
    if (isAuthenticated) {
      navigate('/products');
    } else {
      navigate('/login');
    }
  };

  const handleExplore = () => {
    navigate('/products');
  };

  return (
    <div class="space-y-20 py-6">
      {/* Hero Section */}
      <div class="text-center max-w-3xl mx-auto space-y-6 pt-8">
        <div class="inline-flex items-center gap-2 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-4.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider">
          ⚡ Lightning Fast Hyperlocal Grocery Delivery
        </div>
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-[#111827] tracking-tight leading-tight sm:leading-none">
          Fresh groceries.<br/>
          <span class="text-[#22C55E]">Delivered to your doorstep in minutes.</span>
        </h1>
        <p class="text-sm sm:text-md text-[#6B7280] font-semibold leading-relaxed max-w-2xl mx-auto">
          Order fresh fruits, vegetables, dairy, bakery products, snacks, and daily essentials from your nearest dark store. Enjoy quick delivery and premium service.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={handleStartShopping}
            class="w-full sm:w-auto bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold text-sm px-8 py-3.5 rounded-xl transition-all shadow-md shadow-[#22C55E]/20 uppercase tracking-wider flex items-center justify-center gap-2"
          >
            Start Shopping <ShoppingBag class="w-4 h-4" />
          </button>
          <button 
            onClick={handleExplore}
            class="w-full sm:w-auto bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#111827] font-extrabold text-sm px-8 py-3.5 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2"
          >
            Explore Products <Compass class="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div class="space-y-8">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-black text-[#111827]">Supercharge your shopping experience</h2>
          <p class="text-xs text-[#6B7280] font-bold uppercase tracking-wider">Engineered for speed, built for convenience</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-soft space-y-3">
            <div class="w-10 h-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
              <ShoppingBag class="w-5 h-5" />
            </div>
            <h3 class="font-extrabold text-[#111827] text-md">Fresh Groceries</h3>
            <p class="text-xs text-[#6B7280] font-semibold leading-relaxed">
              Choose from a curated local selection of handpicked fresh fruits, premium vegetables, and pantry items.
            </p>
          </div>

          <div class="bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-soft space-y-3">
            <div class="w-10 h-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
              <ListPlus class="w-5 h-5" />
            </div>
            <h3 class="font-extrabold text-[#111827] text-md">Easy Ordering</h3>
            <p class="text-xs text-[#6B7280] font-semibold leading-relaxed">
              Easily customize item quantities, add/remove items in your cart, and checkout with single-click simplicity.
            </p>
          </div>

          <div class="bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-soft space-y-3">
            <div class="w-10 h-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
              <MapPin class="w-5 h-5" />
            </div>
            <h3 class="font-extrabold text-[#111827] text-md">Live GPS Tracking</h3>
            <p class="text-xs text-[#6B7280] font-semibold leading-relaxed">
              Watch your delivery agent travel in real-time on our interactive Leaflet maps with live status updates.
            </p>
          </div>

          <div class="bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-soft space-y-3">
            <div class="w-10 h-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <h3 class="font-extrabold text-[#111827] text-md">Secure Deliveries</h3>
            <p class="text-xs text-[#6B7280] font-semibold leading-relaxed">
              MERN architecture secures your details, including simulated UPI and card checkout transactions.
            </p>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div class="bg-white border border-[#E5E7EB] rounded-3xl p-8 md:p-12 shadow-soft space-y-8">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-black text-[#111827]">How Loopers Works</h2>
          <p class="text-xs text-[#6B7280] font-bold uppercase tracking-wider">Five simple steps to lightning fast checkout</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-6 text-center relative">
          <div class="space-y-2 relative">
            <span class="w-8 h-8 rounded-full bg-[#22C55E] text-white font-extrabold flex items-center justify-center mx-auto shadow-sm">1</span>
            <h4 class="font-extrabold text-[#111827] text-sm">Explore Catalog</h4>
            <p class="text-[11px] text-[#6B7280] font-semibold leading-relaxed">Browse through categories or search for specific items.</p>
          </div>
          
          <div class="space-y-2">
            <span class="w-8 h-8 rounded-full bg-[#22C55E] text-white font-extrabold flex items-center justify-center mx-auto shadow-sm">2</span>
            <h4 class="font-extrabold text-[#111827] text-sm">Add to Cart</h4>
            <p class="text-[11px] text-[#6B7280] font-semibold leading-relaxed">Select items and adjust quantities directly to your cart.</p>
          </div>

          <div class="space-y-2">
            <span class="w-8 h-8 rounded-full bg-[#22C55E] text-white font-extrabold flex items-center justify-center mx-auto shadow-sm">3</span>
            <h4 class="font-extrabold text-[#111827] text-sm">Confirm Order</h4>
            <p class="text-[11px] text-[#6B7280] font-semibold leading-relaxed">Review your cart details and select a delivery address.</p>
          </div>

          <div class="space-y-2">
            <span class="w-8 h-8 rounded-full bg-[#22C55E] text-white font-extrabold flex items-center justify-center mx-auto shadow-sm">4</span>
            <h4 class="font-extrabold text-[#111827] text-sm">Checkout Order</h4>
            <p class="text-[11px] text-[#6B7280] font-semibold leading-relaxed">Make simulated Razorpay payments instantly.</p>
          </div>

          <div class="space-y-2">
            <span class="w-8 h-8 rounded-full bg-[#22C55E] text-white font-extrabold flex items-center justify-center mx-auto shadow-sm">5</span>
            <h4 class="font-extrabold text-[#111827] text-sm">Track Courier</h4>
            <p class="text-[11px] text-[#6B7280] font-semibold leading-relaxed">Watch the nearest rider move on Leaflet maps.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
