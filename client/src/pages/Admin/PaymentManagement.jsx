import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Check, 
  X, 
  Eye, 
  Download, 
  AlertCircle, 
  Loader, 
  Filter, 
  Calendar, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Inbox,
  User,
  ShoppingBag,
  Clock,
  CheckCircle,
  FileText,
  Truck,
  XCircle,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../../components/common/ToastContext';
import AdminLayout from '../../layouts/AdminLayout';
import API, { resolveImage } from '../../services/api';

const AdminPaymentManagement = () => {
  const { toast } = useToast();

  const [paymentFilter, setPaymentFilter] = useState('');
  const [orderFilter, setOrderFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [paymentFilter, orderFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = `page=${currentPage}&limit=10&searchTerm=${searchTerm}`;
      if (paymentFilter) query += `&paymentStatus=${paymentFilter}`;
      if (orderFilter) query += `&orderStatus=${orderFilter}`;
      
      const response = await API.get(`/payment/orders/all?${query}`);
      if (response.data.success) {
        let fetchedOrders = response.data.data;
        
        if (startDate || endDate) {
          fetchedOrders = fetchedOrders.filter(order => {
            const orderDate = new Date(order.submittedAt || order.createdAt);
            if (startDate && orderDate < new Date(startDate)) return false;
            if (endDate) {
              const endLimit = new Date(endDate);
              endLimit.setHours(23, 59, 59, 999);
              if (orderDate > endLimit) return false;
            }
            return true;
          });
        }
        
        setOrders(fetchedOrders);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await API.get('/payment/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleApprovePayment = async (orderId) => {
    try {
      setProcessingOrder(orderId);
      const response = await API.post('/payment/approve', { orderId });

      if (response.data.success) {
        toast('Payment verified and order confirmed successfully!', 'success');
        setShowModal(false);
        fetchOrders();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      toast(error.response?.data?.message || 'Failed to verify payment', 'error');
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleRejectPayment = async (orderId) => {
    if (!rejectionReason.trim()) {
      toast('Please enter rejection reason', 'error');
      return;
    }

    try {
      setProcessingOrder(orderId);
      const response = await API.post('/payment/reject', {
        orderId,
        rejectionReason
      });

      if (response.data.success) {
        toast('Payment rejected and customer notified successfully.', 'info');
        setShowModal(false);
        setRejectionReason('');
        setSelectedOrder(null);
        fetchOrders();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast(error.response?.data?.message || 'Failed to reject payment', 'error');
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setProcessingOrder(orderId);
      const response = await API.put(`/admin/orders/${orderId}`, { status: newStatus });
      if (response.data.success) {
        toast(`Order status marked as ${newStatus} successfully!`, 'success');
        if (selectedOrder) {
          setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
        }
        fetchOrders();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast(error.response?.data?.message || 'Failed to update order status', 'error');
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleResetFilters = () => {
    setPaymentFilter('');
    setOrderFilter('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const stats = useMemo(() => {
    if (!statistics) return [];
    return [
      { label: 'Pending Verification', value: statistics.verificationPending || 0, icon: Clock, color: 'amber' },
      { label: 'Verified Payments', value: statistics.verifiedPayments || 0, icon: CheckCircle, color: 'emerald' },
      { label: 'Rejected Payments', value: statistics.rejectedPayments || 0, icon: XCircle, color: 'rose' },
      { label: 'Delivered Orders', value: statistics.deliveredOrders || 0, icon: Truck, color: 'cyan' },
    ];
  }, [statistics]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-black uppercase tracking-widest mb-4">
            <TrendingUp className="w-4 h-4" />
            Payment Verification
          </div>
          <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-black tracking-tight text-white">
            Payment Dashboard
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl text-sm">
            Review UPI payment proofs, verify transactions, and manage order workflows.
          </p>
        </div>
      </div>

      {/* Stats */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const colorMap = {
              amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
              emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
              rose: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
              cyan: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
            };
            return (
              <div key={idx} className={`rounded-[2rem] border p-6 backdrop-blur-md transition-all ${colorMap[stat.color]}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mb-1">{stat.label}</p>
                    <p className="text-3xl font-black">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-5 border border-white/5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by customer, UTR, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all"
            />
          </div>

          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="appearance-none pl-4 pr-9 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer min-w-[150px]"
            >
              <option value="" className="bg-slate-900">All Payment Status</option>
              <option value="Pending" className="bg-slate-900">Pending</option>
              <option value="Verification Pending" className="bg-slate-900">Verification Pending</option>
              <option value="Verified" className="bg-slate-900">Verified</option>
              <option value="Rejected" className="bg-slate-900">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
              className="appearance-none pl-4 pr-9 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer min-w-[150px]"
            >
              <option value="" className="bg-slate-900">All Order Status</option>
              <option value="Pending" className="bg-slate-900">Pending</option>
              <option value="Confirmed" className="bg-slate-900">Confirmed</option>
              <option value="Processing" className="bg-slate-900">Processing</option>
              <option value="Shipped" className="bg-slate-900">Shipped</option>
              <option value="Delivered" className="bg-slate-900">Delivered</option>
              <option value="Completed" className="bg-slate-900">Completed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer min-w-[150px]"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer min-w-[150px]"
            />
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="ml-3 text-slate-400 text-sm">Loading transactions...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm font-semibold">No matching records found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-950/50">
                    <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Order ID</th>
                    <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Customer</th>
                    <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Product</th>
                    <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                    <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">UTR Number</th>
                    <th className="text-center px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Proof</th>
                    <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Submitted</th>
                    <th className="text-center px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="text-center px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((order) => (
                    <tr key={order._id} className="group hover:bg-white/[0.02] transition-all">
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-cyan-400 text-sm">#{order._id?.slice(-8).toUpperCase()}</span>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-white text-sm">{order.user?.name || 'Guest'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{order.user?.email}</p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-400 max-w-[180px] truncate" title={order.orderItems?.map(i => i.name).join(', ')}>
                          {order.orderItems?.map(i => i.name).join(', ') || '-'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-black text-emerald-400">₹{order.totalPrice.toFixed(2)}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-slate-400">{order.transactionId || order.utrNumber || '-'}</p>
                      </td>

                      <td className="px-5 py-4 text-center">
                        {order.paymentScreenshot ? (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowModal(true);
                            }}
                            className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all mx-auto"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 uppercase tracking-wider">None</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs text-slate-500">
                          {order.submittedAt || order.createdAt ? new Date(order.submittedAt || order.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : '-'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {(() => {
                          const statusStyles = {
                            'Verification Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                            'Verified': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                            'Rejected': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                            'Pending': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                          };
                          const style = statusStyles[order.paymentStatus] || statusStyles['Pending'];
                          return (
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${style}`}>
                              {order.paymentStatus}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowModal(true);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {order.paymentStatus === 'Verification Pending' && (
                            <>
                              <button
                                onClick={() => handleApprovePayment(order._id)}
                                disabled={processingOrder === order._id}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowModal(true);
                                  setRejectionReason('');
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 transition-all"
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-white/5 bg-slate-950/30">
                <p className="text-xs text-slate-500">
                  Page <span className="font-bold text-white">{pagination.currentPage}</span> of <span className="font-bold text-white">{pagination.pages}</span>
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-400 hover:text-white flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                    className="px-4 py-2 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-400 hover:text-white flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => { setShowModal(false); setRejectionReason(''); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 rounded-[2.5rem] border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-5">
                  <div>
                    <h2 className="text-2xl font-black text-white">Payment Details</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Order: <span className="font-mono text-cyan-400">{selectedOrder._id}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowModal(false); setRejectionReason(''); }}
                    className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left - Customer & Payment Info */}
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cyan-400">Customer</h3>
                      <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-black text-slate-300 border border-white/5">
                            {selectedOrder.user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{selectedOrder.user?.name || 'Guest'}</p>
                            <p className="text-[10px] text-slate-500">{selectedOrder.user?.email}</p>
                          </div>
                        </div>
                        {selectedOrder.user?.phone && (
                          <p className="text-xs text-slate-400 pt-2 border-t border-white/5">
                            <span className="text-slate-500 font-bold">Phone:</span> {selectedOrder.user.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cyan-400">Payment Details</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Amount</p>
                          <p className="text-xl font-black text-emerald-400 mt-1">₹{selectedOrder.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Method</p>
                          <p className="text-sm font-bold text-white mt-1.5">{selectedOrder.paymentMethod}</p>
                        </div>
                      </div>
                      <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">UTR / Transaction ID</p>
                        <p className="font-mono text-sm font-bold text-cyan-400 mt-1">{selectedOrder.transactionId || selectedOrder.utrNumber || 'N/A'}</p>
                        {selectedOrder.notes && (
                          <div className="border-t border-white/5 pt-2 mt-2">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Customer Notes</p>
                            <p className="text-xs text-slate-400 italic mt-1 bg-slate-800/50 p-2.5 rounded-lg">"{selectedOrder.notes}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Status Controls */}
                    <div className="space-y-3">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cyan-400">Order Status</h3>
                      <div className="flex flex-wrap gap-2">
                        {['Processing', 'Shipped', 'Delivered'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateOrderStatus(selectedOrder._id, status)}
                            disabled={processingOrder === selectedOrder._id}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                              selectedOrder.orderStatus === status
                                ? status === 'Processing' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                                : status === 'Shipped' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            Mark {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right - Screenshot */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cyan-400">Payment Screenshot</h3>
                      {selectedOrder.paymentScreenshot && (
                        <div className="flex gap-2">
                          <a 
                            href={resolveImage(selectedOrder.paymentScreenshot)} 
                            download={`order_${selectedOrder._id}_proof.jpg`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-[10px] text-cyan-400 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 font-bold transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                          <button
                            onClick={() => setShowImageModal(true)}
                            className="flex items-center gap-1.5 text-[10px] text-cyan-400 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 font-bold transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Fullscreen
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedOrder.paymentScreenshot ? (
                      <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-950/50">
                        <img
                          src={resolveImage(selectedOrder.paymentScreenshot)}
                          alt="Receipt"
                          className="w-full max-h-64 object-contain mx-auto cursor-zoom-in"
                          onClick={() => setShowImageModal(true)}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-600 bg-slate-950/30">
                        <AlertCircle className="w-10 h-10 mb-2" />
                        <p className="text-sm font-semibold">No screenshot uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                {selectedOrder.orderItems?.length > 0 && (
                  <div className="border-t border-white/5 pt-5 space-y-3">
                    <h3 className="font-black text-xs uppercase tracking-widest text-cyan-400">Order Items</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedOrder.orderItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-950/50 border border-white/5 p-3 rounded-2xl">
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-xs truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                          </div>
                          <p className="text-xs font-black text-cyan-400">₹{(item.quantity * item.price).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {rejectionReason !== null && (
                  <div className="border-t border-white/5 pt-5 space-y-3">
                    <label className="block text-xs font-black text-rose-400 uppercase tracking-widest">Rejection Reason *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="State why this payment is rejected..."
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 outline-none focus:border-rose-500 text-sm text-white placeholder-slate-600 resize-none"
                    />
                  </div>
                )}

                {/* Actions */}
                {selectedOrder.paymentStatus === 'Verification Pending' && (
                  <div className="border-t border-white/5 pt-5 flex flex-wrap gap-3 justify-end">
                    <button
                      onClick={() => { setShowModal(false); setRejectionReason(''); }}
                      className="px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 text-slate-300 transition-all text-xs"
                    >
                      Close
                    </button>

                    {rejectionReason === '' ? (
                      <>
                        <button
                          onClick={() => handleApprovePayment(selectedOrder._id)}
                          disabled={processingOrder === selectedOrder._id}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-lg transition-all flex items-center gap-1.5 text-xs disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Verify Payment
                        </button>
                        <button
                          onClick={() => setRejectionReason(' ')}
                          className="px-6 py-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 font-bold hover:bg-rose-500/20 transition-all flex items-center gap-1.5 text-xs"
                        >
                          <X className="w-4 h-4" />
                          Reject Payment
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRejectPayment(selectedOrder._id)}
                          disabled={processingOrder === selectedOrder._id || !rejectionReason.trim()}
                          className="px-6 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 disabled:opacity-50 transition-all text-xs"
                        >
                          Confirm Rejection
                        </button>
                        <button
                          onClick={() => setRejectionReason('')}
                          className="px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 text-slate-300 transition-all text-xs"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {showImageModal && selectedOrder && selectedOrder.paymentScreenshot && (
          <div 
            className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setShowImageModal(false)}
          >
            <div className="absolute top-5 right-5 flex gap-3 z-50">
              <a 
                href={resolveImage(selectedOrder.paymentScreenshot)} 
                download={`order_${selectedOrder._id}_proof_full.jpg`}
                target="_blank"
                rel="noreferrer"
                className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => setShowImageModal(false)}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-all font-bold text-sm w-11 h-11 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={resolveImage(selectedOrder.paymentScreenshot)}
              alt="Payment proof full screen"
              className="max-w-full max-h-screen object-contain rounded-lg"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPaymentManagement;
