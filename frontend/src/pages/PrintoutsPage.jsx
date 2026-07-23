import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addSingleItem } from '../store/cartSlice.js';
import api from '../services/api.js';
import { 
  UploadCloud, FileText, ChevronLeft, Trash2, Plus, Minus, Info, 
  Sparkles, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PrintoutsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Seeding rates from backend pricing config
  const [rates, setRates] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);

  // File Upload states
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState('');
  const [fileMetadata, setFileMetadata] = useState(null); // { pages, size, filename, orientation }

  // Printout Configuration states
  const [paperSize, setPaperSize] = useState('A4');
  const [colorMode, setColorMode] = useState('all-bw'); // 'all-bw', 'all-color'
  const [printMode, setPrintMode] = useState('single'); // 'single', 'double'
  const [orientation, setOrientation] = useState('Portrait');
  const [copies, setCopies] = useState(1);
  const [pageSelection, setPageSelection] = useState('all'); // 'all', 'custom'
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('1');
  const [binding, setBinding] = useState('none'); // 'none', 'spiral', 'soft'
  const [lamination, setLamination] = useState(false);
  const [notes, setNotes] = useState('');

  // Live Price Calculation states
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(false);

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch Pricing Rates on Mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await api.get('/api/printouts/pricing');
        if (res.data.success) {
          setRates(res.data.pricing);
        }
      } catch (err) {
        toast.error('Unable to fetch print rates. Fallback pricing will be used.');
        // Fallback default rates in case of error
        setRates({
          bwSingle: 2,
          bwDouble: 3,
          colorSingle: 10,
          colorDouble: 15,
          binding: { spiral: 30, soft: 20 },
          extras: { lamination: 20 },
          paperSizes: { A4: 0, A3: 5 },
          tax: 0,
          discount: 0
        });
      } finally {
        setRatesLoading(false);
      }
    };
    fetchRates();
  }, []);

  // Calculate pages to print based on Custom Range
  const getPagesToPrint = () => {
    if (!fileMetadata) return 0;
    const total = fileMetadata.pages || 1;
    if (pageSelection === 'all') {
      return total;
    }
    const start = parseInt(startPage, 10) || 1;
    const end = parseInt(endPage, 10) || total;
    if (start < 1 || end > total || start > end) return total;
    return end - start + 1;
  };

  const pagesToPrint = getPagesToPrint();

  // Call calculate-price API on config change
  useEffect(() => {
    if (!fileUrl || !fileMetadata || ratesLoading) return;

    const computePrice = async () => {
      setPriceLoading(true);
      try {
        const payload = {
          pages: pagesToPrint,
          copies,
          colorPagesList: [],
          colorMode,
          printMode,
          paperSize,
          paperQuality: 'normal',
          binding,
          extras: lamination ? ['lamination'] : []
        };
        const res = await api.post('/api/printouts/calculate-price', payload);
        if (res.data.success) {
          setCalculatedPrice(res.data.price);
        }
      } catch (err) {
        console.error('Calculation error:', err.message);
      } finally {
        setPriceLoading(false);
      }
    };

    computePrice();
  }, [
    fileUrl, fileMetadata, ratesLoading, paperSize, colorMode, 
    printMode, copies, pageSelection, startPage, endPage, binding, lamination
  ]);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (selectedFile) => {
    // Validate File Extension
    const allowedExtensions = /\.(pdf|doc|docx|ppt|pptx|png|jpg|jpeg)$/i;
    if (!allowedExtensions.test(selectedFile.name)) {
      toast.error('Unsupported format. Allowed: PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, JPEG');
      return;
    }

    // Limit to 100MB
    if (selectedFile.size > 100 * 1024 * 1024) {
      toast.error('File size exceeds the 100 MB limit.');
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setUploadProgress(10);

    // Prepare Multipart FormData Upload
    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const res = await api.post('/api/upload/pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Set standard progress capped at 95% until server response resolves
          setUploadProgress(Math.min(95, percent));
        }
      });

      if (res.data.success) {
        setUploadProgress(100);
        setFileUrl(res.data.url);
        setFileMetadata(res.data.metadata);
        setOrientation(res.data.metadata.orientation || 'Portrait');
        setEndPage(String(res.data.metadata.pages || 1));
        toast.success('Document uploaded successfully!');
      } else {
        throw new Error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'File processing failed.');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileUrl('');
    setFileMetadata(null);
    setCalculatedPrice(0);
    setCopies(1);
    setPageSelection('all');
    setBinding('none');
    setLamination(false);
    setNotes('');
  };

  const handleAddToCart = async () => {
    if (!fileUrl || !fileMetadata) {
      toast.error('Please upload a file first');
      return;
    }

    // Custom range inputs validation
    if (pageSelection === 'custom') {
      const start = parseInt(startPage, 10);
      const end = parseInt(endPage, 10);
      const maxPages = fileMetadata.pages || 1;
      if (isNaN(start) || isNaN(end) || start < 1 || end > maxPages || start > end) {
        toast.error(`Invalid page range. Ensure it is between 1 and ${maxPages}.`);
        return;
      }
    }

    try {
      const cartPayload = {
        type: 'printout',
        pdfUrl: fileUrl,
        pdfName: fileMetadata.filename || file.name,
        pdfSize: fileMetadata.size,
        pages: pagesToPrint,
        copies: copies,
        bwPages: colorMode === 'all-bw' ? pagesToPrint : 0,
        colorPages: colorMode === 'all-color' ? pagesToPrint : 0,
        binding: binding,
        extras: lamination ? ['lamination'] : [],
        price: calculatedPrice,
        specialInstructions: notes,
        orientation: orientation,
        paperSize: paperSize,
        paperQuality: 'normal',
        printMode: printMode,
        quantity: 1
      };

      await dispatch(addSingleItem(cartPayload)).unwrap();
      toast.success('Print job added to cart!');
      navigate('/app/cart');
    } catch (err) {
      toast.error(err || 'Failed to add print job to cart');
    }
  };

  // Local breakdowns calculations for summary
  const getPricingDetails = () => {
    if (!rates || !fileMetadata) return { printing: 0, service: 0 };
    const paperSizeAddon = rates.paperSizes?.[paperSize] || 0;
    const rate = colorMode === 'all-color'
      ? (printMode === 'double' ? rates.colorDouble : rates.colorSingle) + paperSizeAddon
      : (printMode === 'double' ? rates.bwDouble : rates.bwSingle) + paperSizeAddon;

    const printingCost = pagesToPrint * rate * copies;
    const bindingCost = (rates.binding?.[binding] || 0) * copies;
    const laminationCost = (lamination ? (rates.extras?.lamination || 0) : 0) * copies;

    return {
      printing: printingCost,
      service: bindingCost + laminationCost
    };
  };

  const { printing: localPrintingCost, service: localServiceCost } = getPricingDetails();

  if (ratesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40A2E3]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-24">
      {/* Header bar */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => navigate('/app')}
          className="p-1.5 rounded-xl bg-sys-surface border border-sys-border text-sys-text-primary hover:bg-sys-surface-hover"
        >
          <ChevronLeft size={16} />
        </button>
        <h1 className="text-base font-black text-sys-text-primary">Printouts Workspace</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Side: Upload Zone */}
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[260px] cursor-pointer bg-sys-surface ${
              isDragOver 
                ? 'border-[#40A2E3] bg-[#40A2E3]/5 scale-[0.99]' 
                : 'border-sys-border hover:border-[#40A2E3]/70'
            }`}
            onClick={!file && !uploading ? triggerFileSelect : undefined}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
              className="hidden"
            />

            {!file && !uploading && (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#40A2E3]/15 text-[#40A2E3] flex items-center justify-center mx-auto">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-sys-text-primary">Drag & Drop Document</p>
                  <p className="text-[10px] text-sys-text-secondary mt-1">
                    PDF, DOC, DOCX, PPT, PPTX, or Image (Max 100 MB)
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-[#40A2E3]/10 text-[#40A2E3] text-[10px] font-black px-4 py-2 rounded-xl border border-[#40A2E3]/20 hover:bg-[#40A2E3]/25"
                >
                  Choose File
                </button>
              </div>
            )}

            {uploading && (
              <div className="w-full max-w-xs space-y-4">
                <div className="w-10 h-10 border-4 border-[#40A2E3] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-sys-text-primary">Uploading & Parsing...</p>
                  <div className="w-full bg-sys-border h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#40A2E3] h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] font-mono font-bold text-[#40A2E3]">{uploadProgress}%</p>
                </div>
              </div>
            )}

            {file && !uploading && fileMetadata && (
              <div className="w-full space-y-4 text-left">
                <div className="flex items-center space-x-3 bg-sys-surface-secondary p-3 rounded-2xl border border-sys-border">
                  <div className="w-10 h-10 rounded-xl bg-[#40A2E3]/10 text-[#40A2E3] flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-sys-text-primary truncate">{fileMetadata.filename || file.name}</p>
                    <p className="text-[10px] text-sys-text-secondary font-mono mt-0.5">
                      Size: {fileMetadata.size} • Pages: {fileMetadata.pages}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="p-2 text-sys-error hover:bg-sys-error/10 rounded-xl transition-all"
                    title="Remove document"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl flex items-center space-x-2 text-[10px]">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span className="font-semibold">Document loaded successfully and ready for options.</span>
                </div>
              </div>
            )}
          </div>

          {/* Delivery disclaimer */}
          <div className="bg-[#40A2E3]/10 border border-[#40A2E3]/20 rounded-2xl p-4 flex items-start space-x-3 text-xs">
            <ShieldCheck size={18} className="text-[#40A2E3] shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sys-text-primary">Secured Print Network</p>
              <p className="text-[11px] text-sys-text-secondary mt-0.5">
                We print documents on high quality paper rolls and deliver directly to your dormitory mess or gate in a sealed protective sleeve.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Options Configuration & Pricing */}
        <div className="space-y-4">
          <div className="bg-sys-surface border border-sys-border rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black uppercase text-sys-text-secondary tracking-wider">Print Options</h3>

            {!fileUrl ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-sys-text-secondary space-y-2">
                <Info size={24} className="text-[#64748B]" />
                <p className="text-xs font-semibold">Please upload your document file to configure print settings.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Paper Size selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-sys-text-secondary">Paper Size</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['A4', 'A3'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setPaperSize(size)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          paperSize === size 
                            ? 'bg-[#40A2E3] text-white border-[#40A2E3] shadow-xs' 
                            : 'bg-sys-surface-secondary border-sys-border text-sys-text-secondary hover:text-sys-text-primary'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print Type selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-sys-text-secondary">Print Type</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'all-bw', label: 'Black & White' },
                      { key: 'all-color', label: 'Color' }
                    ].map((type) => (
                      <button
                        key={type.key}
                        onClick={() => setColorMode(type.key)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          colorMode === type.key 
                            ? 'bg-[#40A2E3] text-white border-[#40A2E3] shadow-xs' 
                            : 'bg-sys-surface-secondary border-sys-border text-sys-text-secondary hover:text-sys-text-primary'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print Sides selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-sys-text-secondary">Sides</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'single', label: 'Single Sided' },
                      { key: 'double', label: 'Double Sided' }
                    ].map((mode) => (
                      <button
                        key={mode.key}
                        onClick={() => setPrintMode(mode.key)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          printMode === mode.key 
                            ? 'bg-[#40A2E3] text-white border-[#40A2E3] shadow-xs' 
                            : 'bg-sys-surface-secondary border-sys-border text-sys-text-secondary hover:text-sys-text-primary'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orientation Selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-sys-text-secondary">Orientation</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['Portrait', 'Landscape'].map((orient) => (
                      <button
                        key={orient}
                        onClick={() => setOrientation(orient)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          orientation === orient 
                            ? 'bg-[#40A2E3] text-white border-[#40A2E3] shadow-xs' 
                            : 'bg-sys-surface-secondary border-sys-border text-sys-text-secondary hover:text-sys-text-primary'
                        }`}
                      >
                        {orient}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Selection Options */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-sys-text-secondary">Page Selection</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'all', label: 'All Pages' },
                      { key: 'custom', label: 'Custom Range' }
                    ].map((sel) => (
                      <button
                        key={sel.key}
                        onClick={() => setPageSelection(sel.key)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          pageSelection === sel.key 
                            ? 'bg-[#40A2E3] text-white border-[#40A2E3] shadow-xs' 
                            : 'bg-sys-surface-secondary border-sys-border text-sys-text-secondary hover:text-sys-text-primary'
                        }`}
                      >
                        {sel.label}
                      </button>
                    ))}
                  </div>

                  {pageSelection === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 pt-1.5">
                      <div>
                        <span className="text-[9px] font-black text-sys-text-secondary">Start Page</span>
                        <input
                          type="number"
                          min="1"
                          max={fileMetadata?.pages || 1}
                          value={startPage}
                          onChange={(e) => setStartPage(e.target.value)}
                          className="w-full text-xs font-mono font-bold p-2 border border-sys-border bg-sys-surface-secondary text-sys-text-primary rounded-xl focus:outline-none focus:border-[#40A2E3]"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-sys-text-secondary">End Page</span>
                        <input
                          type="number"
                          min="1"
                          max={fileMetadata?.pages || 1}
                          value={endPage}
                          onChange={(e) => setEndPage(e.target.value)}
                          className="w-full text-xs font-mono font-bold p-2 border border-sys-border bg-sys-surface-secondary text-sys-text-primary rounded-xl focus:outline-none focus:border-[#40A2E3]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Copies Counter */}
                <div className="flex items-center justify-between border-t border-sys-border pt-3">
                  <span className="text-[10px] font-black uppercase text-sys-text-secondary">Copies</span>
                  <div className="flex items-center bg-[#40A2E3] text-white rounded-xl p-0.5">
                    <button
                      type="button"
                      onClick={() => setCopies(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 flex items-center justify-center hover:bg-black/15 rounded-lg transition-colors"
                    >
                      <Minus size={13} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-black font-mono px-3">{copies}</span>
                    <button
                      type="button"
                      onClick={() => setCopies(prev => prev + 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-black/15 rounded-lg transition-colors"
                    >
                      <Plus size={13} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {/* Binding Dropdown Selection */}
                <div className="space-y-1.5 border-t border-sys-border pt-3">
                  <span className="text-[10px] font-black uppercase text-sys-text-secondary">Binding</span>
                  <select
                    value={binding}
                    onChange={(e) => setBinding(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none focus:border-[#40A2E3]"
                  >
                    <option value="none">None (Loose Sheets)</option>
                    <option value="spiral">Spiral Binding (+₹{rates.binding?.spiral || 30})</option>
                    <option value="soft">Soft Cover Binding (+₹{rates.binding?.soft || 20})</option>
                  </select>
                </div>

                {/* Lamination Toggle */}
                <div className="flex items-center justify-between border-t border-sys-border pt-3">
                  <span className="text-[10px] font-black uppercase text-sys-text-secondary">Lamination</span>
                  <button
                    type="button"
                    onClick={() => setLamination(!lamination)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      lamination ? 'bg-[#40A2E3]' : 'bg-sys-border'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        lamination ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Special instructions / notes */}
                <div className="space-y-1.5 border-t border-sys-border pt-3">
                  <span className="text-[10px] font-black uppercase text-sys-text-secondary">Additional Notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Please print page 1 double-sized, or spiral bind landscape mode..."
                    rows="2"
                    className="w-full text-xs p-2 rounded-xl border border-sys-border bg-sys-surface-secondary text-sys-text-primary focus:outline-none focus:border-[#40A2E3] placeholder-slate-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Checkout Summary card */}
          {fileUrl && fileMetadata && (
            <div className="bg-sys-surface border border-sys-border rounded-3xl p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-black uppercase text-sys-text-secondary tracking-wider">Bill Summary</h4>

              <div className="space-y-2 text-xs font-medium text-sys-text-secondary">
                <div className="flex justify-between">
                  <span>Printing Cost ({pagesToPrint} pages × {copies} copies)</span>
                  <span className="font-mono text-sys-text-primary">₹{localPrintingCost.toFixed(2)}</span>
                </div>
                {localServiceCost > 0 && (
                  <div className="flex justify-between">
                    <span>Additional Services (Binding/Lamination)</span>
                    <span className="font-mono text-sys-text-primary">₹{localServiceCost.toFixed(2)}</span>
                  </div>
                )}
                {rates.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Taxes ({rates.tax}%)</span>
                    <span className="font-mono text-sys-text-primary">
                      +₹{((calculatedPrice - (localPrintingCost + localServiceCost))).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-sys-border flex justify-between font-black text-sm text-sys-text-primary">
                  <span>Grand Total</span>
                  <span className="font-mono text-[#40A2E3] flex items-center">
                    {priceLoading && <RefreshCw size={12} className="animate-spin mr-1.5 text-slate-400" />}
                    ₹{calculatedPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={priceLoading || uploading}
                className="w-full bg-[#40A2E3] hover:bg-[#40A2E3]/95 text-white font-black text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-[#40A2E3]/25 flex items-center justify-center space-x-2 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <span>Add Print Job to Cart</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
