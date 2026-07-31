import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Copy, Check, Loader, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/common/ToastContext';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../services/api';

const AdminPaymentSettings = () => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [settings, setSettings] = useState({
    upiId: '',
    accountHolderName: '',
    paymentInstructions: '',
    isActive: true,
    qrCode: null
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await API.get('/payment/settings');
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          upiId: data.upiId || '',
          accountHolderName: data.accountHolderName || '',
          paymentInstructions: data.paymentInstructions || '',
          isActive: data.isActive || true,
          qrCode: data.qrCode || null
        });
        if (data.qrCode) {
          setQrPreview(data.qrCode);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast('Failed to load payment settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast('Please select an image file', 'error');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast('File size must be less than 2MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setQrPreview(e.target?.result);
        setSettings({
          ...settings,
          qrCode: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!settings.upiId.trim() || !settings.accountHolderName.trim()) {
      toast('UPI ID and Account Holder Name are required', 'error');
      return;
    }

    if (!qrPreview) {
      toast('QR Code is required', 'error');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('upiId', settings.upiId);
      formData.append('accountHolderName', settings.accountHolderName);
      formData.append('paymentInstructions', settings.paymentInstructions);
      formData.append('isActive', settings.isActive);

      if (settings.qrCode instanceof File) {
        formData.append('qrCode', settings.qrCode);
      } else if (typeof settings.qrCode === 'string') {
        formData.append('qrCode', settings.qrCode);
      }

      const response = await API.put('/payment/settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast('Payment settings updated successfully!', 'success');
        await fetchSettings();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast(error.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-slate-400 text-sm">Loading payment settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-black uppercase tracking-widest mb-4">
            <AlertCircle className="w-4 h-4" />
            Configuration
          </div>
          <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-black tracking-tight text-white">
            UPI Payment Settings
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl text-sm">
            Manage payment configuration displayed to customers at checkout.
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/5 p-6 flex gap-4 items-start">
        <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-300 mb-1 text-sm">Important</h3>
          <p className="text-xs text-blue-200 leading-relaxed">
            These settings will be displayed to customers during checkout. Ensure all details are correct before saving.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT - Form Fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* UPI ID */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              UPI ID <span className="text-rose-400">*</span>
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g., 6374383385@ybl"
                value={settings.upiId}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                className="flex-1 h-12 rounded-xl border border-white/10 bg-slate-950/50 px-4 outline-none focus:border-cyan-500 text-sm text-white placeholder-slate-600 transition-all"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(settings.upiId)}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                title="Copy"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Copy className="w-5 h-5 text-slate-400" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5">
              This UPI ID will be displayed to customers for payment
            </p>
          </div>

          {/* Account Holder Name */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Account Holder Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Store Name"
              value={settings.accountHolderName}
              onChange={(e) =>
                setSettings({ ...settings, accountHolderName: e.target.value })
              }
              className="w-full h-12 rounded-xl border border-white/10 bg-slate-950/50 px-4 outline-none focus:border-cyan-500 text-sm text-white placeholder-slate-600 transition-all"
            />
            <p className="text-[10px] text-slate-500 mt-2.5">
              Name associated with the UPI account
            </p>
          </div>

          {/* Payment Instructions */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Payment Instructions
            </label>
            <textarea
              placeholder="Add any special instructions for customers (optional)"
              value={settings.paymentInstructions}
              onChange={(e) =>
                setSettings({ ...settings, paymentInstructions: e.target.value })
              }
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 outline-none focus:border-cyan-500 resize-none text-sm text-white placeholder-slate-600 transition-all"
            />
            <p className="text-[10px] text-slate-500 mt-2.5">
              These instructions will appear below the QR code at checkout
            </p>
          </div>

          {/* Status Toggle */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  Payment Status
                </label>
                <p className="text-[10px] text-slate-500">Enable or disable UPI payment</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isActive}
                  onChange={(e) =>
                    setSettings({ ...settings, isActive: e.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-14 h-8 rounded-full transition-all ${
                    settings.isActive ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full bg-white shadow-lg transform transition-transform ${
                      settings.isActive ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT - QR Code */}
        <div>
          <div className="sticky top-24 space-y-5">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  QR Code <span className="text-rose-400">*</span>
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 p-6 cursor-pointer hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all text-center"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {qrPreview ? (
                    <div className="space-y-3">
                      <img
                        src={qrPreview}
                        alt="QR Code Preview"
                        className="w-32 h-32 mx-auto rounded-xl border border-white/10"
                      />
                      <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-10 h-10 mx-auto text-cyan-400" />
                      <p className="text-sm text-slate-300 font-medium">Click to upload QR Code</p>
                      <p className="text-[10px] text-slate-500">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Status */}
              {settings.qrCode && (
                <div className="border-t border-white/5 pt-5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">QR Code Status</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">QR Code Uploaded</span>
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Yes
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Status</span>
                      <span className={`text-xs font-black ${settings.isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {settings.isActive ? '✓ Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving || !settings.upiId.trim() || !settings.accountHolderName.trim() || !qrPreview}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Settings
                  </>
                )}
              </button>

              {/* Preview */}
              <div className="border-t border-white/5 pt-5">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">Customer Preview</p>
                <div className="bg-slate-950/50 rounded-xl p-4 space-y-2 text-xs border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">UPI ID</span>
                    <span className="text-white font-mono">{settings.upiId || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Holder</span>
                    <span className="text-white">{settings.accountHolderName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className={settings.isActive ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {settings.isActive ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminPaymentSettings;
