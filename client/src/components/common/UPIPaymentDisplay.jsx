import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from './ToastContext';

const UPIPaymentDisplay = ({ paymentSettings, totalAmount, orderId }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Use demo UPI ID if settings not configured
  const demoUpiId = '6374383385@ybl';
  const demoAccountHolder = 'Demo Store';
  
  const upiId = paymentSettings?.upiId || demoUpiId;
  const accountHolder = paymentSettings?.accountHolderName || demoAccountHolder;
  const qrCode = paymentSettings?.qrCode;
  const isDemo = !paymentSettings?.upiId;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 backdrop-blur-2xl p-8 shadow-2xl"
    >
      {/* DEMO WARNING */}
      {isDemo && (
        <div className="mb-6 rounded-2xl border dark:text-amber-400 text-black border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5  flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold ">Demo Mode</p>
            <p className="text-xs ">Admin settings not configured. Using demo UPI ID for testing.</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-black mb-2 text-black dark:text-white">
          UPI Payment Details
        </h3>
        <p className="text-slate-400">
          Follow the steps below to complete your payment
        </p>
      </div>

      {/* STEPS */}
      <div className="space-y-6 mb-8">
        {/* Step 1: UPI ID */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0 font-bold text-cyan-400">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-black mb-3">UPI ID to Pay</h4>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 font-mono text-sm">
                  {upiId}
                </div>
                <button
                  onClick={() => copyToClipboard(upiId)}
                  className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
                  title="Copy UPI ID"
                >
                  <Copy className="w-5 h-5 text-cyan-400" />
                </button>
              </div>
              <p className="text-xs text-slate-400 italic">
                Payee: {accountHolder}
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: QR Code */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0 font-bold text-cyan-400">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-black mb-4">Scan QR Code</h4>
              <div className="flex justify-center mb-4">
                <div className="w-48 h-48 rounded-2xl border-4 border-cyan-500/30 bg-white p-2">
                  {qrCode ? (
                    <img
                      src={qrCode}
                      alt="UPI QR Code"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
                      <div className="text-center">
                        <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Demo QR Code</p>
                        <p className="text-xs text-slate-400">Not configured</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Scan this QR code with any UPI app to send payment
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Amount */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0 font-bold text-cyan-400">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-black mb-3">Amount to Pay</h4>
              <div className="text-3xl font-black text-cyan-400 mb-2">
                ₹{totalAmount.toFixed(2)}
              </div>
              <p className="text-sm text-slate-400">
                Order ID: <span className="font-mono text-white">{orderId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Instructions */}
        {paymentSettings?.paymentInstructions && (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0 font-bold text-cyan-400">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-black mb-3">Special Instructions</h4>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {paymentSettings.paymentInstructions}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INFO BOX */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-black dark:text-blue-200">
          Please keep the payment screenshot handy. You'll need to upload it after making the payment to verify your order.
        </div>
      </div>
    </motion.div>
  );
};

export default UPIPaymentDisplay;
