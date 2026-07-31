import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Check, AlertCircle, Loader } from 'lucide-react';
import { useToast } from './ToastContext';
import API from '../../services/api';

const PaymentProofUpload = ({ orderId, onSuccess }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [screenshot, setScreenshot] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('File size must be less than 5MB', 'error');
      return;
    }

    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!screenshot) {
      toast('Please select a screenshot', 'error');
      return;
    }

    if (!utrNumber.trim()) {
      toast('Please enter UTR/Transaction ID', 'error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('utrNumber', utrNumber);
      formData.append('paymentScreenshot', screenshot);
      formData.append('notes', notes);

      const response = await API.post('/payment/upload-proof', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast('Your payment proof has been submitted successfully. Our team will verify your payment and process your order.', 'success');
        setScreenshot(null);
        setUtrNumber('');
        setNotes('');
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      toast(error.response?.data?.message || 'Error uploading payment proof', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-2xl p-8 shadow-2xl"
    >
      <div className="mb-8">
        <h3 className="text-2xl font-black mb-2">Upload Payment Proof</h3>
        <p className="text-slate-400">
          Upload your payment screenshot to verify the transaction
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* FILE UPLOAD (Drag & Drop) */}
        <div>
          <label className="block text-sm font-bold mb-3">Payment Screenshot *</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all text-center ${
              isDragging 
                ? 'border-cyan-400 bg-cyan-500/20 scale-[1.01]' 
                : 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/60 hover:bg-cyan-500/10'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-32 h-32 mx-auto rounded-lg object-cover"
                />
                <p className="text-sm text-cyan-400 font-bold">Click or drop to change image</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className={`w-12 h-12 mx-auto text-cyan-400 ${isDragging ? 'animate-bounce' : ''}`} />
                <p className="text-sm text-slate-300 font-bold">
                  {isDragging ? 'Drop your screenshot here!' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-slate-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* UTR NUMBER */}
        <div>
          <label className="block text-sm font-bold mb-3">
            UTR / Transaction ID *
          </label>
          <input
            type="text"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
            placeholder="e.g., 202406011234567890"
            className="w-full h-12 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 outline-none focus:border-cyan-500 placeholder-slate-500"
          />
          <p className="text-xs text-slate-500 mt-2">
            Enter the UTR or transaction ID from your payment receipt
          </p>
        </div>

        {/* NOTES (OPTIONAL) */}
        <div>
          <label className="block text-sm font-bold mb-3">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details or messages here..."
            rows={3}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3 outline-none focus:border-cyan-500 placeholder-slate-500 resize-none"
          />
        </div>

        {/* INFO BOX */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            Make sure your screenshot clearly shows the transaction amount and UTR number for quick verification.
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || !screenshot || !utrNumber.trim()}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Submit Payment Proof
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default PaymentProofUpload;
