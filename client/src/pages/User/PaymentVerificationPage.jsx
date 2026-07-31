import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, Loader } from 'lucide-react';
import { useToast } from '../../components/common/ToastContext';
import PaymentProofUpload from '../../components/common/PaymentProofUpload';
import API from '../../services/api';


const PaymentVerificationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails(false);

    // Poll payment status in real-time
    const interval = setInterval(() => {
      fetchOrderDetails(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrderDetails = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const response = await API.get(`/payment/orders/${orderId}/details`);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      if (!isPolling) toast('Error loading order details', 'error');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchOrderDetails(false);
    toast('Order updated! Please wait for admin verification.', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-slate-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-slate-400">Order not found</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 px-6 py-2 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600"
          >
            Go to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 backdrop-blur-2xl p-8">
            <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center">
                  {order.paymentStatus === 'Verification Pending' ? (
                    <Clock className="w-8 h-8 text-white" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  )}
                </div>

                <div>
                  <h1 className="text-4xl font-black mb-2">
                    Payment Verification
                  </h1>
                  <p className="text-slate-400">
                    Order ID: <span className="font-mono text-cyan-400">{order._id}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Status</p>
                  <p className="text-xl font-black mt-2 text-cyan-400">
                    {order.paymentStatus}
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Amount</p>
                  <p className="text-xl font-black mt-2 text-emerald-400">
                    ₹{order.totalPrice.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Payment Method</p>
                  <p className="text-xl font-black mt-2">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT - MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            {/* PAYMENT PROOF UPLOAD */}
            {order.paymentStatus === 'Pending' || order.paymentStatus === 'Rejected' ? (
              <PaymentProofUpload
                orderId={orderId}
                onSuccess={handleUploadSuccess}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-2xl p-8"
              >
                <div className="text-center py-12">
                  {order.paymentStatus === 'Verification Pending' && (
                    <>
                      <Clock className="w-16 h-16 mx-auto mb-4 text-amber-400" />
                      <h3 className="text-2xl font-black mb-2">Verification Pending</h3>
                      <p className="text-slate-400">
                        Your payment proof has been uploaded. Admin will verify it shortly.
                      </p>
                    </>
                  )}

                  {order.paymentStatus === 'Verified' && (
                    <>
                      <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                      <h3 className="text-2xl font-black mb-2">Payment Verified!</h3>
                      <p className="text-slate-400 mb-6">
                        Your payment has been confirmed. Order is being processed.
                      </p>
                      <button
                        onClick={() => navigate('/orders')}
                        className="px-6 py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-all"
                      >
                        View All Orders
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ORDER ITEMS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-2xl p-6"
            >
              <h3 className="text-xl font-black mb-6">Order Items</h3>

              <div className="space-y-4">
                {order.orderItems?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/20"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />

                    <div className="flex-1">
                      <h4 className="font-bold mb-1">{item.name}</h4>
                      {item.variant && (
                        <p className="text-sm text-slate-400 mb-2">{item.variant}</p>
                      )}
                      <p className="text-sm text-slate-400">
                        Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-cyan-400">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT - SUMMARY */}
          <div className="sticky top-24 h-fit">
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-[2rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-2xl p-6 space-y-6"
            >
              <div>
                <h3 className="text-lg font-black mb-4">Order Summary</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span>₹{order.itemsPrice?.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Shipping</span>
                    <span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice?.toFixed(2)}`}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax</span>
                    <span>₹{order.taxPrice?.toFixed(2)}</span>
                  </div>

                  {order.discountPrice > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
                      <span>-₹{order.discountPrice?.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-black/10 dark:border-white/10 pt-3 flex justify-between font-black">
                    <span>Total</span>
                    <span className="text-cyan-400">₹{order.totalPrice?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* SHIPPING ADDRESS */}
              <div className="border-t border-black/10 dark:border-white/10 pt-6">
                <h4 className="font-bold mb-3">Delivery Address</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {order.shippingAddress?.street}<br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
                  {order.shippingAddress?.country} - {order.shippingAddress?.zipCode}
                </p>
              </div>

              {/* PAYMENT INFO */}
              {order.paymentStatus === 'Verification Pending' && (order.transactionId || order.utrNumber) && (
                <div className="border-t border-black/10 dark:border-white/10 pt-6">
                  <h4 className="font-bold mb-3">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-400">Transaction ID:</span>
                      <p className="font-mono text-cyan-400">{order.transactionId || order.utrNumber}</p>
                    </div>
                    {order.paymentScreenshot && (
                      <div>
                        <span className="text-slate-400">Screenshot Uploaded: ✓</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {order.paymentStatus === 'Rejected' && order.rejectionReason && (
                <div className="border-t border-red-500/20 pt-6 bg-red-500/10 rounded-xl p-4">
                  <h4 className="font-bold mb-2 text-red-400">Rejection Reason</h4>
                  <p className="text-sm text-slate-300">{order.rejectionReason}</p>
                  <p className="text-xs text-slate-400 mt-3">
                    Please upload correct payment proof to resubmit.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
    </div>
  );
};

export default PaymentVerificationPage;
