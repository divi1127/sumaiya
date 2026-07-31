import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMyOrders, cancelMyOrder, markOrderDelivered } from '../../redux/slices/orderSlice';
import { useToast } from '../../components/common/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShoppingBag,
  Truck,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Sparkles,
  Star,
  CheckCircle2,
} from 'lucide-react';
import API from '../../services/api';
import { io } from "socket.io-client";

// Timeline Component
const OrderTimeline = ({ orderStatus, paymentStatus }) => {
  const stages = [
    { label: "Pending", desc: "Awaiting confirmation" },
    { label: "Processing", desc: "Items being prepared" },
    { label: "Out For Delivery", desc: "Order is in transit" },
    { label: "Delivered", desc: "Ready to confirm receipt" },
  ];

  // Helper to determine the current stage index
  const getStageIndex = () => {
    if (orderStatus === 'Delivered') return 3;
    if (orderStatus === 'Out For Delivery') return 2;
    if (orderStatus === 'Processing') return 1;
    return 0; // Pending
  };

  const currentIndex = getStageIndex();

  return (
    <div className="w-full py-8 px-4 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 rounded-3xl mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
        {/* Line divider for desktop */}
        <div className="hidden md:block absolute left-6 right-6 top-[22px] h-0.5 bg-slate-800 z-0 rounded-full" />
        <div 
          className="hidden md:block absolute left-6 top-[22px] h-0.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 z-0 rounded-full transition-all duration-500" 
          style={{ width: `calc(${(currentIndex / 4) * 100}% - 40px)` }}
        />

        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIndex || orderStatus === 'Delivered';
          const isCurrent = idx === currentIndex && orderStatus !== 'Delivered';
          const isActive = idx <= currentIndex || orderStatus === 'Delivered';

          return (
            <div key={idx} className="flex md:flex-col items-center md:items-center gap-4 md:gap-2 z-10 flex-1 relative">
              {/* Dot */}
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20" 
                     : isCurrent 
                       ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black ring-4 ring-yellow-500/30 shadow-lg shadow-yellow-500/30 animate-pulse"
                      : "bg-slate-900 text-slate-500 border border-black/10 dark:border-white/10"
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              
              {/* Label & Description */}
              <div className="text-left md:text-center">
                <p 
                  className={`text-xs font-black transition-all ${
                    isCurrent 
                      ? "text-yellow-400 scale-105" 
                      : isActive 
                        ? "text-slate-200" 
                        : "text-slate-600"
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-[10px] text-slate-500 md:hidden lg:block mt-0.5">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrdersHistory = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const { orders, loading } = useSelector((state) => state.orders);

  /* ---------------- Pagination & States ---------------- */
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewForm, setReviewForm] = useState({}); // { [orderId-productId]: { rating, comment, submitted } }
  const ordersPerPage = 5;

  // Poll orders history every 10 seconds for real-time status updates
  useEffect(() => {
    dispatch(fetchMyOrders());
    
    // Socket.io real-time connection
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true
    });
    
    socket.on('orderStatusUpdated', () => {
      dispatch(fetchMyOrders());
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return orders.slice(startIndex, startIndex + ordersPerPage);
  }, [orders, currentPage]);

  const handleCancelOrder = async (orderId) => {
    if (
      !window.confirm(
        'Are you absolutely sure you want to cancel this order? This will restore product stock.'
      )
    ) {
      return;
    }

    try {
      await dispatch(cancelMyOrder(orderId)).unwrap();
      toast('Order cancelled successfully. Stock restored.', 'info');
    } catch (err) {
      toast(err || 'Failed to cancel order.', 'error');
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    if (window.confirm('Have you received your order successfully?')) {
      try {
        await dispatch(markOrderDelivered(orderId)).unwrap();
        toast('Delivery confirmed successfully! Your order is complete.', 'success');
        dispatch(fetchMyOrders());
      } catch (err) {
        toast(err || 'Failed to confirm delivery.', 'error');
      }
    }
  };

  const handleReviewSubmit = async (orderId, productId, feedback) => {
    const key = `${orderId}-${productId}`;
    try {
      const response = await API.post(`/reviews/${productId}`, {
        rating: feedback.rating,
        comment: feedback.comment
      });
      if (response.data.success) {
        toast('Product review submitted successfully!', 'success');
        setReviewForm(prev => ({
          ...prev,
          [key]: { ...feedback, submitted: true }
        }));
      }
    } catch (err) {
      toast(err.response?.data?.message || 'You have already reviewed this product.', 'error');
      setReviewForm(prev => ({
        ...prev,
        [key]: { ...feedback, submitted: true } // Mark as done to prevent spamming
      }));
    }
  };

  const statusBadges = {
    Pending: (
      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Pending
      </span>
    ),
    Processing: (
      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        Processing
      </span>
    ),
    'Out For Delivery': (
      <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        Out For Delivery
      </span>
    ),
    Delivered: (
      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Delivered
      </span>
    ),
    Cancelled: (
      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Cancelled
      </span>
    ),
  };

  if (loading && orders.length === 0) return <LoadingSpinner />;

  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 text-center space-y-6 max-w-md mx-auto">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-black/10 dark:border-white/10 flex items-center justify-center text-5xl shadow-xl">
          📦
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            No Orders Yet
          </h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            You haven't placed any orders yet. Start shopping to see your order history here.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold transition-all shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Start Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-yellow-500 font-bold mb-2">Order Management</p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            My Orders
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Track your shipments and manage your purchase history.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-lg text-center">
            <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-black">Total</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{orders.length}</h3>
          </div>
          <div className="px-5 py-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-lg text-center">
            <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-black">Delivered</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {orders.filter(o => o.orderStatus === 'Delivered').length}
            </h3>
          </div>
          <div className="px-5 py-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-lg text-center">
            <p className="text-[10px] uppercase tracking-widest text-amber-500 font-black">Active</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {orders.filter(o => !['Delivered', 'Cancelled'].includes(o.orderStatus)).length}
            </h3>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-6">
        {paginatedOrders.map((order) => (
          <div
            key={order._id}
            className="relative overflow-hidden rounded-[2rem] border border-black/10 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl"
          >
            {/* Top color accent based on status */}
            <div className={`h-1 w-full ${
              order.orderStatus === 'Delivered' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
              order.orderStatus === 'Out For Delivery' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
              order.orderStatus === 'Processing' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              order.orderStatus === 'Cancelled' ? 'bg-gradient-to-r from-rose-500 to-pink-500' :
              'bg-gradient-to-r from-slate-500 to-slate-600'
            }`} />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 pb-6 border-b border-black/10 dark:border-white/10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-xs flex-1">
                  <div>
                    <span className="text-slate-500 font-medium block mb-1.5 uppercase tracking-wider text-[10px]">Order ID</span>
                    <span className="font-black text-slate-900 dark:text-white font-mono text-sm">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1.5 uppercase tracking-wider text-[10px]">Date</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1.5 uppercase tracking-wider text-[10px]">Payment</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 uppercase">
                      {order.paymentMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1.5 uppercase tracking-wider text-[10px]">Total</span>
                    <span className="font-black text-cyan-600 dark:text-cyan-400 text-base">
                      ₹{order.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:flex-col xl:items-end">
                  {statusBadges[order.orderStatus] || statusBadges['Pending']}
                  <Link
                    to={`/order/invoice/${order._id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-500 hover:border-cyan-500/20 text-slate-500 font-bold transition-all text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Invoice
                  </Link>
                </div>
              </div>

              {/* Timeline */}
              <OrderTimeline
                orderStatus={order.orderStatus}
                paymentStatus={order.paymentInfo?.status}
              />

              {/* Products */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {order.orderItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex gap-4 p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/30 dark:bg-black/20 hover:bg-white/50 dark:hover:bg-white/5 hover:shadow-lg transition-all"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-2xl object-cover border border-black/10 dark:border-white/10 group-hover:scale-105 transition-transform flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">
                        {item.name}
                      </h4>
                      {item.variant && (
                        <p className="text-[11px] text-cyan-500 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-full w-fit">
                          {item.variant}
                        </p>
                      )}
                      <p className="text-slate-500 text-xs">Qty: {item.quantity}</p>
                      <p className="font-black text-indigo-500 text-sm">₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Proof */}
              {order.paymentProof && (
                <div className="mt-6 p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                  <p className="text-[11px] uppercase tracking-widest text-cyan-500 font-bold mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Payment Proof Submitted
                  </p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <a href={order.paymentProof} target="_blank" rel="noopener noreferrer">
                      <img
                        src={order.paymentProof}
                        alt="Payment Proof"
                        className="h-24 w-24 object-cover rounded-xl border border-black/10 dark:border-white/10 hover:scale-105 transition-transform cursor-pointer shadow-lg"
                      />
                    </a>
                    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      {order.transactionId && (
                        <p><span className="text-slate-500 text-xs">Transaction ID:</span><br /><span className="font-mono font-bold">{order.transactionId}</span></p>
                      )}
                      {order.paymentNotes && (
                        <p><span className="text-slate-500 text-xs">Notes:</span><br />{order.paymentNotes}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Reviews (only for Delivered orders) */}
              {order.orderStatus === 'Delivered' && (
                <div className="mt-6 border-t border-black/10 dark:border-white/10 pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="text-sm font-black uppercase tracking-wider">Rate Your Purchase</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.orderItems.map((item) => {
                      const key = `${order._id}-${item.product}`;
                      const feedback = reviewForm[key] || { rating: 5, comment: '', submitted: false };

                      if (feedback.submitted) {
                        return (
                          <div key={item.product} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>Review submitted for <strong>{item.name}</strong>!</span>
                          </div>
                        );
                      }

                      return (
                        <div key={item.product} className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/10 dark:bg-white/5 space-y-3">
                          <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-200">{item.name}</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, [key]: { ...feedback, rating: star } })}
                                className="focus:outline-none transition-transform active:scale-125"
                              >
                                <Star className={`w-5 h-5 ${star <= feedback.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            placeholder="Share your thoughts about this product..."
                            value={feedback.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, [key]: { ...feedback, comment: e.target.value } })}
                            rows={2}
                            className="w-full text-xs rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-2 outline-none focus:border-cyan-500 text-slate-900 dark:text-slate-200 placeholder-slate-500 resize-none transition-all"
                          />
                          <button
                            onClick={() => handleReviewSubmit(order._id, item.product, feedback)}
                            disabled={!feedback.comment.trim()}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-xs font-bold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            Submit Review
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer — address + actions */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6 pt-6 border-t border-black/10 dark:border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Shipping Address</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.zipCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Cancel Button */}
                  {order.orderStatus === 'Pending' && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="flex items-center gap-2 px-5 py-2.5 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-bold rounded-full transition-all text-sm"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Cancel Order
                    </button>
                  )}

                  {/* Received Button */}
                  {order.orderStatus === 'Out For Delivery' && (
                    <button
                      onClick={() => handleConfirmDelivery(order._id)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-full transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Received
                    </button>
                  )}

                  {/* Delivered badge */}
                  {order.orderStatus === 'Delivered' && (
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-500 font-bold rounded-full border border-emerald-500/20 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Order Complete
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * ordersPerPage + 1}</span>
            {" "}–{" "}
            <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * ordersPerPage, orders.length)}</span>
            {" "}of{" "}
            <span className="font-bold text-slate-900 dark:text-white">{orders.length}</span> orders
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
              className="w-11 h-11 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-cyan-500/10 hover:text-cyan-500 hover:border-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {[...Array(totalPages)].map((_, idx) => {
              const page = idx + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-11 h-11 rounded-2xl font-bold text-sm transition-all ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20'
                      : 'border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-500 hover:border-cyan-500/20'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages}
              className="w-11 h-11 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-cyan-500/10 hover:text-cyan-500 hover:border-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersHistory;
