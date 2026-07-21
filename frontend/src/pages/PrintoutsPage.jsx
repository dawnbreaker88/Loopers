import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart } from '../store/cartSlice.js';
import api from '../services/api.js';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  FileText, UploadCloud, AlertCircle, RefreshCw, Printer, Info,
  Plus, Minus, Check, ShoppingBag, Eye, HelpCircle
} from 'lucide-react';

export default function PrintoutsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  // States
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(true);

  // File states
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfMetadata, setPdfMetadata] = useState(null); // { pages, size, filename, orientation }
  const [pdfUrl, setPdfUrl] = useState('');
  const cancelTokenRef = useRef(null);

  // Configurator states
  const [printMode, setPrintMode] = useState('single'); // single, double
  const [copies, setCopies] = useState(1);
  const [paperSize, setPaperSize] = useState('A4');
  const [paperQuality, setPaperQuality] = useState('normal');
  
  // Color mode states
  const [colorMode, setColorMode] = useState('all-bw'); // all-bw, all-color, custom
  const [customPagesInput, setCustomPagesInput] = useState('');
  const [expandedColorPages, setExpandedColorPages] = useState([]); // List of color page numbers

  // Binding & Extras
  const [binding, setBinding] = useState('none');
  const [selectedExtras, setSelectedExtras] = useState([]); // Array of extra keys
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Drag & drop state
  const [dragActive, setDragActive] = useState(false);

  // Calculation state
  const [totalPrice, setTotalPrice] = useState(0);
  const [calcBreakdown, setCalcBreakdown] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Fetch active pricing config on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await api.get('/api/printouts/pricing');
        if (res.data.success) {
          setPricing(res.data.pricing);
        }
      } catch (err) {
        console.error('Error fetching pricing details:', err);
        toast.error('Failed to load printing pricing data. Using default system rates.');
        // Fallback default pricing
        setPricing({
          bwSingle: 2,
          bwDouble: 3,
          colorSingle: 10,
          colorDouble: 15,
          binding: {
            spiral: 30,
            hard: 70,
            soft: 20,
            stickFile: 15,
            transparentFile: 10,
            clampFile: 15
          },
          extras: {
            frontTransparentSheet: 10,
            backHardSheet: 10,
            lamination: 20,
            coverPage: 15,
            pageNumbering: 5,
            watermark: 5
          },
          paperSizes: { A4: 0, A3: 5, Legal: 3, Letter: 2 },
          paperQualities: { normal: 0, premium: 5, glossy: 10 },
          tax: 0,
          discount: 0
        });
      } finally {
        setPricingLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPricing();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Parse page ranges (e.g. 1-5, 8, 10-12)
  const parsePageRange = (input, maxPages) => {
    if (!input || !maxPages) return [];
    const pages = new Set();
    const parts = input.split(',');

    for (let part of parts) {
      part = part.trim();
      if (!part) continue;

      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (!isNaN(start) && !isNaN(end) && start <= end) {
          const clampedStart = Math.max(1, Math.min(start, maxPages));
          const clampedEnd = Math.max(1, Math.min(end, maxPages));
          for (let i = clampedStart; i <= clampedEnd; i++) {
            pages.add(i);
          }
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
          pages.add(pageNum);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  // Expand custom color pages when input or metadata changes
  useEffect(() => {
    if (pdfMetadata) {
      const parsed = parsePageRange(customPagesInput, pdfMetadata.pages);
      setExpandedColorPages(parsed);
    }
  }, [customPagesInput, pdfMetadata]);

  // Live Price Calculation locally
  useEffect(() => {
    if (!pricing || !pdfMetadata) return;

    const pages = pdfMetadata.pages;
    let bwPagesCount = 0;
    let colorPagesCount = 0;

    if (colorMode === 'all-bw') {
      bwPagesCount = pages;
      colorPagesCount = 0;
    } else if (colorMode === 'all-color') {
      bwPagesCount = 0;
      colorPagesCount = pages;
    } else if (colorMode === 'custom') {
      colorPagesCount = expandedColorPages.length;
      bwPagesCount = Math.max(0, pages - colorPagesCount);
    }

    // Base rates
    let bwRate = printMode === 'double' ? pricing.bwDouble : pricing.bwSingle;
    let colorRate = printMode === 'double' ? pricing.colorDouble : pricing.colorSingle;

    // Quality & size addons
    const paperSizeAddon = pricing.paperSizes[paperSize] || 0;
    const paperQualityAddon = pricing.paperQualities[paperQuality] || 0;

    bwRate += paperSizeAddon + paperQualityAddon;
    colorRate += paperSizeAddon + paperQualityAddon;

    // Calculations
    const bwCost = bwPagesCount * bwRate;
    const colorCost = colorPagesCount * colorRate;
    const printingCost = bwCost + colorCost;

    let subTotal = printingCost * copies;

    const bindingCost = (pricing.binding[binding] || 0) * copies;
    subTotal += bindingCost;

    let extrasCost = 0;
    selectedExtras.forEach(extra => {
      extrasCost += (pricing.extras[extra] || 0);
    });
    const totalExtrasCost = extrasCost * copies;
    subTotal += totalExtrasCost;

    let discountAmount = 0;
    if (pricing.discount > 0) {
      discountAmount = subTotal * (pricing.discount / 100);
    }

    let taxAmount = 0;
    const postDiscountTotal = subTotal - discountAmount;
    if (pricing.tax > 0) {
      taxAmount = postDiscountTotal * (pricing.tax / 100);
    }

    const grandTotal = Math.round((postDiscountTotal + taxAmount) * 100) / 100;

    setTotalPrice(grandTotal);
    setCalcBreakdown({
      bwPagesCount,
      bwCost,
      colorPagesCount,
      colorCost,
      printingCost,
      bindingCost,
      totalExtrasCost,
      discountAmount,
      taxAmount,
      subTotal,
      grandTotal
    });
  }, [pricing, pdfMetadata, printMode, copies, paperSize, paperQuality, colorMode, expandedColorPages, binding, selectedExtras]);

  // Handle Drag & Drop PDF
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Unsupported file type. Only PDF (.pdf) files are allowed.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size exceeds 100 MB limit.');
      return;
    }

    setPdfFile(file);
    uploadPdfToServer(file);
  };

  // Upload PDF to backend endpoint
  const uploadPdfToServer = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    setPdfMetadata(null);
    setPdfUrl('');

    // Cancel previous upload if active
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New upload initiated');
    }
    cancelTokenRef.current = axios.CancelToken.source();

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await api.post('/api/upload/pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        cancelToken: cancelTokenRef.current.token,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      if (res.data.success) {
        setPdfUrl(res.data.url);
        setPdfMetadata(res.data.metadata);
        toast.success('PDF analyzed and uploaded successfully.');
      } else {
        toast.error(res.data.message || 'Failed to process PDF.');
        setPdfFile(null);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Upload cancelled:', err.message);
      } else {
        console.error('PDF Upload Error:', err);
        const errMsg = err.response?.data?.message || 'Failed to upload PDF. Please make sure the file is not corrupted or encrypted.';
        toast.error(errMsg);
        setPdfFile(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddExtra = (extraKey) => {
    setSelectedExtras(prev => 
      prev.includes(extraKey) 
        ? prev.filter(k => k !== extraKey)
        : [...prev, extraKey]
    );
  };

  const handleAddToCart = async () => {
    if (!pdfUrl || !pdfMetadata) {
      toast.error('Please upload a PDF file first.');
      return;
    }

    setIsAddingToCart(true);
    try {
      const cartItem = {
        type: 'printout',
        pdfUrl,
        pdfName: pdfMetadata.filename,
        pdfSize: pdfMetadata.size,
        pages: pdfMetadata.pages,
        copies,
        bwPages: colorMode === 'all-bw' ? pdfMetadata.pages : (colorMode === 'all-color' ? 0 : Math.max(0, pdfMetadata.pages - expandedColorPages.length)),
        colorPages: colorMode === 'all-color' ? pdfMetadata.pages : (colorMode === 'all-bw' ? 0 : expandedColorPages.length),
        binding,
        extras: selectedExtras,
        price: totalPrice,
        specialInstructions,
        orientation: pdfMetadata.orientation,
        paperSize,
        paperQuality,
        printMode,
        quantity: 1 // Default cart line item quantity
      };

      const res = await api.post('/api/cart/add', cartItem);
      if (res.data.success) {
        toast.success('Printout order added to cart!');
        dispatch(fetchCart());
        navigate('/cart');
      }
    } catch (error) {
      console.error('Add to Cart Error:', error);
      toast.error(error.response?.data?.message || 'Failed to add printout to cart.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (pricingLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-[#40A2E3]" size={36} />
        <p className="text-xs font-semibold text-slate-500">Loading printing preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-sys-border pb-4 gap-2">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="text-[#40A2E3]" />
            Printout Service
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload study material, notes, or office documents. Configure pages, colors, and binding. Delivered to your doorstep in minutes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: PDF Uploader & Configuration */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* PDF Uploader Area */}
          <div className="bg-sys-surface border border-sys-border rounded-3xl p-6 shadow-xs relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
              <FileText size={18} className="text-[#40A2E3]" />
              Step 1: Upload your Document
            </h3>

            {!pdfFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#40A2E3] bg-[#40A2E3]/5 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-650 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
                onClick={() => document.getElementById('pdf-file-input').click()}
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <UploadCloud className="text-[#64748B] dark:text-slate-400 mb-3 animate-bounce" size={40} />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Drag and drop your PDF here, or <span className="text-[#40A2E3] hover:underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Only PDF formats are supported. Maximum file size is 100 MB.
                </p>
              </div>
            ) : (
              <div className="border border-sys-border bg-slate-50/40 dark:bg-slate-800/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center flex-shrink-0 border border-red-100 dark:border-red-900/30">
                    <FileText className="text-red-500" size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {pdfFile.name}
                    </p>
                    {isUploading ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#40A2E3] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-[#40A2E3]">{uploadProgress}%</span>
                      </div>
                    ) : pdfMetadata ? (
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-semibold text-[#64748B] dark:text-slate-400 mt-0.5">
                        <span>{pdfMetadata.size}</span>
                        <span>•</span>
                        <span className="text-emerald-500 font-extrabold">{pdfMetadata.pages} pages</span>
                        <span>•</span>
                        <span className="uppercase">{pdfMetadata.orientation}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">Verifying file...</p>
                    )}
                  </div>
                </div>

                {!isUploading && (
                  <button
                    onClick={() => {
                      if (cancelTokenRef.current) {
                        cancelTokenRef.current.cancel('User cleared file');
                      }
                      setPdfFile(null);
                      setPdfMetadata(null);
                      setPdfUrl('');
                    }}
                    className="text-xs font-extrabold text-red-500 hover:text-red-650 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-950/50 hover:scale-[1.02] active:scale-98 transition-all shrink-0"
                  >
                    Remove File
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Configuration Form (Only visible once PDF is successfully processed) */}
          {pdfMetadata && (
            <div className="bg-sys-surface border border-sys-border rounded-3xl p-6 shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-sys-border flex items-center gap-1.5">
                <Printer size={18} className="text-[#40A2E3]" />
                Step 2: Customize Printing Options
              </h3>

              {/* Printing Mode & Copies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Printing Type & Mode */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wider block mb-2">
                      Print Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setPrintMode('single')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                          printMode === 'single'
                            ? 'border-[#40A2E3] bg-[#40A2E3]/5 text-[#40A2E3] font-black'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        Single Side
                      </button>
                      <button
                        onClick={() => setPrintMode('double')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                          printMode === 'double'
                            ? 'border-[#40A2E3] bg-[#40A2E3]/5 text-[#40A2E3] font-black'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        Double Side
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wider block mb-2">
                      Paper Size
                    </label>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value)}
                      className="w-full text-xs font-bold bg-white dark:bg-slate-800 text-slate-850 dark:text-slate-100 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl focus:outline-none focus:border-[#40A2E3]"
                    >
                      <option value="A4">A4 (Standard)</option>
                      <option value="A3">A3 (+{pricing.paperSizes.A3}₹/page)</option>
                      <option value="Legal">Legal (+{pricing.paperSizes.Legal}₹/page)</option>
                      <option value="Letter">Letter (+{pricing.paperSizes.Letter}₹/page)</option>
                    </select>
                  </div>
                </div>

                {/* Copies & Paper Quality */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wider block mb-2">
                      Copies
                    </label>
                    <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/50 p-1.5 border border-slate-200 dark:border-slate-700 rounded-xl w-32 justify-between">
                      <button
                        onClick={() => setCopies(prev => Math.max(1, prev - 1))}
                        className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:scale-105 active:scale-95 transition-all border border-slate-200 dark:border-slate-600 shadow-xs"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-xs font-extrabold text-slate-850 dark:text-slate-100 select-none">
                        {copies}
                      </span>
                      <button
                        onClick={() => setCopies(prev => prev + 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:scale-105 active:scale-95 transition-all border border-slate-200 dark:border-slate-600 shadow-xs"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wider block mb-2">
                      Paper Quality
                    </label>
                    <select
                      value={paperQuality}
                      onChange={(e) => setPaperQuality(e.target.value)}
                      className="w-full text-xs font-bold bg-white dark:bg-slate-800 text-slate-850 dark:text-slate-100 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl focus:outline-none focus:border-[#40A2E3]"
                    >
                      <option value="normal">Normal (70-80 GSM)</option>
                      <option value="premium">Premium (90 GSM +{pricing.paperQualities.premium}₹/page)</option>
                      <option value="glossy">Glossy Photo Paper (+{pricing.paperQualities.glossy}₹/page)</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Color Customization Engine */}
              <div className="space-y-4 pt-4 border-t border-sys-border">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wider block mb-3">
                    Color Customization
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setColorMode('all-bw')}
                      className={`p-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center text-center gap-1 ${
                        colorMode === 'all-bw'
                          ? 'border-[#40A2E3] bg-[#40A2E3]/5 text-[#40A2E3]'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350'
                      }`}
                    >
                      <span className="font-extrabold">Option 1</span>
                      <span className="text-[10px] text-slate-400">Entirely Black & White</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setColorMode('all-color')}
                      className={`p-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center text-center gap-1 ${
                        colorMode === 'all-color'
                          ? 'border-[#40A2E3] bg-[#40A2E3]/5 text-[#40A2E3]'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350'
                      }`}
                    >
                      <span className="font-extrabold">Option 2</span>
                      <span className="text-[10px] text-slate-400">Entirely Colour</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setColorMode('custom')}
                      className={`p-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center text-center gap-1 ${
                        colorMode === 'custom'
                          ? 'border-[#40A2E3] bg-[#40A2E3]/5 text-[#40A2E3]'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350'
                      }`}
                    >
                      <span className="font-extrabold">Option 3</span>
                      <span className="text-[10px] text-slate-400">Custom Pages</span>
                    </button>
                  </div>
                </div>

                {colorMode === 'custom' && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-750/70 space-y-3 animate-fade-in">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                        Select Colour Pages
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1-5, 8, 10-15"
                        value={customPagesInput}
                        onChange={(e) => setCustomPagesInput(e.target.value)}
                        className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl focus:outline-none focus:border-[#40A2E3]"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Input page numbers or ranges separated by commas. Remaining pages are printed Black & White.
                      </p>
                    </div>

                    {expandedColorPages.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                          <span>Colour Page Preview ({expandedColorPages.length} pages)</span>
                          <span className="text-emerald-500">{pdfMetadata.pages - expandedColorPages.length} B&W pages</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                          {Array.from({ length: pdfMetadata.pages }, (_, i) => i + 1).map(pageNum => {
                            const isColor = expandedColorPages.includes(pageNum);
                            return (
                              <span
                                key={pageNum}
                                className={`text-[9px] font-extrabold w-6 h-6 flex items-center justify-center rounded-md ${
                                  isColor
                                    ? 'bg-[#40A2E3] text-white'
                                    : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                {pageNum}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Binding Options */}
              <div className="space-y-4 pt-4 border-t border-sys-border">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wider block">
                  Binding Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { key: 'none', label: 'No Binding', cost: 0 },
                    { key: 'staple', label: 'Staple', cost: pricing.binding.transparentFile || 0 }, // Using transparentFile or custom cost
                    { key: 'spiral', label: 'Spiral Binding', cost: pricing.binding.spiral },
                    { key: 'hard', label: 'Hard Binding', cost: pricing.binding.hard },
                    { key: 'soft', label: 'Soft Binding', cost: pricing.binding.soft },
                    { key: 'stickFile', label: 'Stick File', cost: pricing.binding.stickFile },
                    { key: 'transparentFile', label: 'Transparent File', cost: pricing.binding.transparentFile },
                    { key: 'clampFile', label: 'Clamp File', cost: pricing.binding.clampFile }
                  ].map(bindItem => {
                    const isSelected = binding === bindItem.key;
                    return (
                      <button
                        key={bindItem.key}
                        type="button"
                        onClick={() => setBinding(bindItem.key)}
                        className={`p-2.5 text-xs rounded-xl border transition-all text-center flex flex-col justify-center items-center ${
                          isSelected
                            ? 'border-[#40A2E3] bg-[#40A2E3]/5 text-[#40A2E3] font-black'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-extrabold">{bindItem.label}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {bindItem.cost === 0 ? 'Free' : `+₹${bindItem.cost}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extra Finishing Addons */}
              <div className="space-y-4 pt-4 border-t border-sys-border">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wider block">
                  Addons / Finishing
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'frontTransparentSheet', label: 'Front Transparent Sheet', cost: pricing.extras.frontTransparentSheet },
                    { key: 'backHardSheet', label: 'Back Hard Sheet', cost: pricing.extras.backHardSheet },
                    { key: 'lamination', label: 'Lamination', cost: pricing.extras.lamination },
                    { key: 'coverPage', label: 'Cover Page Printing', cost: pricing.extras.coverPage },
                    { key: 'pageNumbering', label: 'Add Page Numbering', cost: pricing.extras.pageNumbering },
                    { key: 'watermark', label: 'Add Confidential Watermark', cost: pricing.extras.watermark }
                  ].map(addon => {
                    const isChecked = selectedExtras.includes(addon.key);
                    return (
                      <button
                        key={addon.key}
                        type="button"
                        onClick={() => handleAddExtra(addon.key)}
                        className={`p-3 text-xs rounded-xl border transition-all flex justify-between items-center text-left ${
                          isChecked
                            ? 'border-[#40A2E3] bg-[#40A2E3]/5 text-[#40A2E3]'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="pr-2 min-w-0">
                          <p className="font-extrabold truncate">{addon.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">+₹{addon.cost}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isChecked ? 'bg-[#40A2E3] border-[#40A2E3] text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2 pt-4 border-t border-sys-border">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wider block">
                  Special Instructions (Visible to Print Agent)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Print pages 10-15 carefully. Do not fold. Please spiral bind tightly."
                  rows={3}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-850 text-slate-850 dark:text-slate-100 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:outline-none focus:border-[#40A2E3] resize-none"
                />
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Checkout Summary (Pricing Breakdown) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-sys-surface border border-sys-border rounded-3xl p-6 shadow-soft sticky top-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-sys-border flex items-center gap-1.5">
              <ShoppingBag size={18} className="text-[#40A2E3]" />
              Order Summary
            </h3>

            {pdfMetadata ? (
              <div className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-700 space-y-1">
                  <p className="font-extrabold text-slate-850 dark:text-slate-100 truncate">
                    {pdfMetadata.filename}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {pdfMetadata.pages} pages • {copies} copies • {printMode === 'single' ? 'Single side' : 'Double side'}
                  </p>
                </div>

                {calcBreakdown && (
                  <div className="space-y-2 border-b border-dashed border-sys-border pb-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-450 dark:text-slate-400">B&W Printing ({calcBreakdown.bwPagesCount} pages)</span>
                      <span>₹{(calcBreakdown.bwPagesCount * (printMode === 'double' ? pricing.bwDouble : pricing.bwSingle) * copies).toFixed(2)}</span>
                    </div>
                    {calcBreakdown.colorPagesCount > 0 && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-450 dark:text-slate-400">Colour Printing ({calcBreakdown.colorPagesCount} pages)</span>
                        <span>₹{(calcBreakdown.colorPagesCount * (printMode === 'double' ? pricing.colorDouble : pricing.colorSingle) * copies).toFixed(2)}</span>
                      </div>
                    )}
                    {(paperSize !== 'A4' || paperQuality !== 'normal') && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-450 dark:text-slate-400">Paper Customization ({paperSize}/{paperQuality})</span>
                        <span>
                          ₹{(((pricing.paperSizes[paperSize] || 0) + (pricing.paperQualities[paperQuality] || 0)) * pdfMetadata.pages * copies).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {binding !== 'none' && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-450 dark:text-slate-400">Binding ({binding})</span>
                        <span>₹{calcBreakdown.bindingCost.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedExtras.length > 0 && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-450 dark:text-slate-400">Finishing Addons</span>
                        <span>₹{calcBreakdown.totalExtrasCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {calcBreakdown && (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-450 dark:text-slate-400">Subtotal</span>
                      <span>₹{calcBreakdown.subTotal.toFixed(2)}</span>
                    </div>
                    {pricing.discount > 0 && (
                      <div className="flex justify-between items-center text-[11px] text-emerald-500 font-extrabold">
                        <span>Discount ({pricing.discount}%)</span>
                        <span>-₹{calcBreakdown.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.tax > 0 && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-450 dark:text-slate-400">Tax ({pricing.tax}%)</span>
                        <span>₹{calcBreakdown.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-sys-border">
                      <span>Total Price</span>
                      <span className="text-[#40A2E3] text-base">₹{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || isUploading}
                  className="w-full bg-[#40A2E3] hover:bg-[#3590cc] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                >
                  {isAddingToCart ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={14} />
                      Add Custom Printout to Cart
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Info size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-[11px] font-bold">No document uploaded yet</p>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Upload a PDF document to calculate custom page options and prices in real-time.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
