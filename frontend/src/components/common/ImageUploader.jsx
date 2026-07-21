import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { uploadImage, createCancelTokenSource } from '../../services/uploadService.js';
import { toast } from 'react-hot-toast';
import { X, Check } from 'lucide-react';

export default function ImageUploader({ value, onChange, onUploadingStateChange, folder }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState(value ? 'success' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const cancelTokenSourceRef = useRef(null);

  // Synchronize status with external value change (e.g. when opening/closing modals or changing records)
  useEffect(() => {
    if (!value) {
      setStatus('idle');
      setUploadProgress(0);
    } else {
      setStatus('success');
    }
  }, [value]);

  // Clean up any pending upload request on unmount
  useEffect(() => {
    return () => {
      if (cancelTokenSourceRef.current) {
        cancelTokenSourceRef.current.cancel('Upload component unmounted.');
      }
    };
  }, []);

  const handleFile = (file) => {
    if (!file) return;

    // Validate image mime type
    if (!file.type.startsWith('image/')) {
      const err = 'Invalid file type. Only image files (JPG, JPEG, PNG, WEBP, GIF) are allowed.';
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    // Validate file size limit (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      const err = 'File is too large. Maximum allowed size is 5 MB.';
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    setErrorMsg('');
    startUpload(file);
  };

  const startUpload = async (file) => {
    // Abort active upload if user changes file during upload
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel('Upload aborted due to a new selection.');
    }

    cancelTokenSourceRef.current = createCancelTokenSource();
    setStatus('uploading');
    setUploadProgress(0);
    onUploadingStateChange(true);

    try {
      const data = await uploadImage(
        file,
        (progress) => setUploadProgress(progress),
        cancelTokenSourceRef.current.token,
        folder
      );

      if (data.success && data.url) {
        setStatus('success');
        onChange(data.url);
        toast.success('Image uploaded successfully!');
      } else {
        throw new Error(data.message || 'Image upload failed.');
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Upload cancelled:', error.message);
      } else {
        console.error('Upload error:', error);
        setStatus('error');
        const msg = error.response?.data?.message || error.message || 'Failed to upload image.';
        setErrorMsg(msg);
        toast.error(msg);
      }
    } finally {
      onUploadingStateChange(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerFileSelect();
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel('Upload cancelled by user.');
    }
    onChange('');
    setStatus('idle');
    setUploadProgress(0);
    setErrorMsg('');
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          handleFile(blob);
          break;
        }
      }
    }
  };

  return (
    <div className="w-full text-xs">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={triggerFileSelect}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="Image uploader. Drag and drop an image or click to browse files."
        className={`relative w-full min-h-[140px] rounded-xl border border-dashed p-4 flex flex-col items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
          dragActive
            ? 'border-primary-500 bg-primary-500/5'
            : 'border-sys-border bg-sys-surface-secondary hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        {status === 'idle' && (
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500 text-lg">
              📁
            </div>
            <div>
              <p className="font-bold text-sys-text-primary">
                Drag & Drop Image
              </p>
              <p className="text-[10px] text-sys-text-secondary mt-0.5">
                or <span className="text-primary-500 font-extrabold hover:underline">Browse Files</span>
              </p>
            </div>
            <p className="text-[9px] text-[#64748B]">
              Supports JPG, JPEG, PNG, WEBP, GIF (Max 5 MB)
            </p>
          </div>
        )}

        {status === 'uploading' && (
          <div className="w-full text-center space-y-3 px-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center space-x-2 text-primary-500">
              <span className="animate-spin text-xs font-black">Uploading...</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-sys-text-secondary">
              <span>{uploadProgress}%</span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-sys-error font-extrabold hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {status === 'success' && value && (
          <div className="relative w-full flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-sys-border bg-sys-surface shrink-0">
              <img
                src={value}
                alt="Upload Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-bold text-sys-success flex items-center text-[11px]">
                <Check size={14} className="mr-1 stroke-[3]" />
                Uploaded Successfully
              </p>
              <p className="text-[10px] text-sys-text-secondary truncate font-mono">
                {value}
              </p>
              <button
                type="button"
                onClick={handleRemove}
                className="text-sys-error hover:underline font-extrabold text-[10px]"
              >
                Replace Image
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/20 text-sys-error flex items-center justify-center mx-auto">
              <X size={20} />
            </div>
            <div>
              <p className="font-bold text-sys-error">Upload Failed</p>
              <p className="text-[10px] text-[#ef4444] mt-0.5 px-4 line-clamp-2">
                {errorMsg}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-primary-500 font-extrabold hover:underline text-[10px]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
