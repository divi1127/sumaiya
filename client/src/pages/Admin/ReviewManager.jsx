import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAdminReviews,
  adminRespondToReview,
  adminDeleteReviewResponse,
  adminDeleteReview
} from '../../redux/slices/adminSlice';
import { useToast } from '../../components/common/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  Star,
  Search,
  ChevronDown,
  X,
  Send,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  Calendar,
  RefreshCw,
  AlertCircle,
  Eye,
} from 'lucide-react';

const AdminReviewManager = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const { reviews, reviewsPagination, reviewsLoading, reviewsActionLoading, error } = useSelector(
    (state) => state.admin
  );

  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [responseModal, setResponseModal] = useState({ open: false, reviewId: null, text: '' });
  const [viewModal, setViewModal] = useState({ open: false, review: null });

  useEffect(() => {
    dispatch(fetchAdminReviews({
      search,
      rating: ratingFilter,
      sort: sortBy,
      page: currentPage,
      limit: 10
    }));
  }, [search, ratingFilter, sortBy, currentPage, dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, ratingFilter, sortBy]);

  const handleResponseSubmit = (e) => {
    e.preventDefault();
    if (!responseModal.text.trim()) {
      toast('Please enter a response', 'error');
      return;
    }
    dispatch(adminRespondToReview({
      reviewId: responseModal.reviewId,
      responseText: responseModal.text
    })).unwrap()
      .then(() => {
        toast('Response sent successfully', 'success');
        setResponseModal({ open: false, reviewId: null, text: '' });
        setViewModal(prev => prev.review?._id === responseModal.reviewId ? { open: false, review: null } : prev);
      })
      .catch((err) => toast(err || 'Failed to send response', 'error'));
  };

  const handleDeleteResponse = (reviewId) => {
    if (window.confirm('Are you sure you want to remove this admin response?')) {
      dispatch(adminDeleteReviewResponse(reviewId))
        .unwrap()
        .then(() => toast('Response removed', 'success'))
        .catch((err) => toast(err || 'Failed to remove response', 'error'));
    }
  };

  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Are you sure you want to permanently delete this review? This action cannot be undone.')) {
      dispatch(adminDeleteReview(reviewId))
        .unwrap()
        .then(() => toast('Review deleted', 'success'))
        .catch((err) => toast(err || 'Failed to delete review', 'error'));
    }
  };

  const openViewModal = (review) => setViewModal({ open: true, review });
  const openResponseModal = (review) => setResponseModal({
    open: true,
    reviewId: review._id,
    text: review.adminResponse?.text || ''
  });

  const clearFilters = () => {
    setSearch('');
    setRatingFilter('');
    setSortBy('-createdAt');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || ratingFilter || sortBy !== '-createdAt';

  const StarDisplay = ({ rating, size = 'w-3.5 h-3.5' }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
        />
      ))}
    </div>
  );

  const getRatingBadge = (rating) => {
    const colors = {
      5: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      4: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
      3: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
      2: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
      1: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    };
    return colors[rating] || colors[3];
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-widest mb-4">
            <MessageSquare className="w-4 h-4" />
            Review Management
          </div>
          <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-black tracking-tight text-slate-900 dark:text-white">
            Customer Reviews
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl text-sm">
            Review and respond to customer feedback. Maintain professional communication with your buyers.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-5 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-lg">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by customer name, review text, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all"
            />
          </div>

          {/* Rating Filter */}
          <div className="relative">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="appearance-none pl-4 pr-9 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer min-w-[130px]"
            >
              <option value="" className="bg-white dark:bg-slate-900">All Ratings</option>
              <option value="5" className="bg-white dark:bg-slate-900">5 Stars</option>
              <option value="4" className="bg-white dark:bg-slate-900">4 Stars</option>
              <option value="3" className="bg-white dark:bg-slate-900">3 Stars</option>
              <option value="2" className="bg-white dark:bg-slate-900">2 Stars</option>
              <option value="1" className="bg-white dark:bg-slate-900">1 Star</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-9 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer min-w-[150px]"
            >
              <option value="-createdAt" className="bg-white dark:bg-slate-900">Newest First</option>
              <option value="createdAt" className="bg-white dark:bg-slate-900">Oldest First</option>
              <option value="-rating" className="bg-white dark:bg-slate-900">Highest Rating</option>
              <option value="rating" className="bg-white dark:bg-slate-900">Lowest Rating</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
            {search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-300">
                Search: "{search}"
                <button onClick={() => setSearch('')} className="hover:text-rose-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            {ratingFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400">
                {ratingFilter} Stars
                <button onClick={() => setRatingFilter('')} className="hover:text-rose-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            {sortBy !== '-createdAt' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-300">
                Sort: {sortBy.replace('-', '').replace('createdAt', 'Date').replace('rating', 'Rating')}
                <button onClick={() => setSortBy('-createdAt')} className="hover:text-rose-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {reviewsLoading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error */}
      {error && !reviewsLoading && (
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
          <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
          <div>
            <p className="font-bold text-rose-600 dark:text-rose-400 text-sm">Error loading reviews</p>
            <p className="text-xs text-rose-500/70 dark:text-rose-400/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!reviewsLoading && reviews.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10">
          <div className="w-20 h-20 mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Reviews Found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {hasActiveFilters ? 'Try adjusting your search or filters.' : 'No customer reviews have been submitted yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50">
                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">Customer</th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">Product</th>
                    <th className="text-center px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">Rating</th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">Review</th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">Date</th>
                    <th className="text-center px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">Response</th>
                    <th className="text-center px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {reviews.map((review) => {
                    const hasResponse = review.adminResponse?.text;
                    const truncatedComment = review.comment?.length > 50
                      ? review.comment.substring(0, 50) + '...'
                      : review.comment;

                    return (
                      <tr
                        key={review._id}
                        className={`group transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
                          hasResponse ? 'bg-amber-50/50 dark:bg-amber-500/[0.02]' : ''
                        }`}
                      >
                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-300 flex-shrink-0 border border-slate-300 dark:border-white/5">
                              {review.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[120px]">
                                {review.name}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium truncate max-w-[120px]">
                                {review.user?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Product */}
                        <td className="px-4 py-3.5">
                          {review.product?.slug ? (
                            <Link
                              to={`/product/${review.product.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 min-w-[140px] group/link"
                            >
                              <Package className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 group-hover/link:text-amber-500 transition-colors" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover/link:text-amber-600 dark:group-hover/link:text-amber-400 transition-colors" title={review.product?.name}>
                                {review.product?.name || 'Unknown'}
                              </span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 min-w-[140px]">
                              <Package className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={review.product?.name}>
                                {review.product?.name || 'Unknown'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center gap-1">
                            <StarDisplay rating={review.rating} size="w-3 h-3" />
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getRatingBadge(review.rating)}`}>
                              {review.rating}/5
                            </span>
                          </div>
                        </td>

                        {/* Review */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[160px] truncate" title={review.comment}>
                            "{truncatedComment}"
                          </p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </td>

                        {/* Response Status */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {hasResponse ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                Replied
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase tracking-wider">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => openViewModal(review)}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {hasResponse ? (
                                <button
                                  onClick={() => handleDeleteResponse(review._id)}
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all"
                                  title="Remove Response"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => openResponseModal(review)}
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                                  title="Respond"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReview(review._id)}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                title="Delete Review"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {reviewsPagination && reviewsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/30">
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * reviewsPagination.limit + 1}</span> to{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.min(currentPage * reviewsPagination.limit, reviewsPagination.total)}
                  </span>{' '}
                  of <span className="font-bold text-slate-900 dark:text-white">{reviewsPagination.total}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 rounded-md border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: reviewsPagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (reviewsPagination.totalPages <= 7) return true;
                      if (page === 1 || page === reviewsPagination.totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => {
                      const showEllipsisBefore = idx > 0 && arr[idx - 1] !== page - 1;
                      const showEllipsisAfter = idx < arr.length - 1 && arr[idx + 1] !== page + 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span className="w-7 h-7 flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs">…</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                              currentPage === page
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                : 'border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {page}
                          </button>
                          {showEllipsisAfter && (
                            <span className="w-7 h-7 flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs">…</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, reviewsPagination.totalPages))}
                    disabled={currentPage === reviewsPagination.totalPages}
                    className="w-7 h-7 rounded-md border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* View Detail Modal */}
      {viewModal.open && viewModal.review && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-md px-4" onClick={() => setViewModal({ open: false, review: null })}>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full" />

            <div className="relative p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Review Details</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Complete review information</p>
                </div>
                <button
                  onClick={() => setViewModal({ open: false, review: null })}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all text-slate-400 dark:text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xl font-black text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/5">
                    {viewModal.review.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{viewModal.review.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{viewModal.review.user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarDisplay rating={viewModal.review.rating} size="w-3.5 h-3.5" />
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">{viewModal.review.rating}/5</span>
                    </div>
                  </div>
                </div>

                {/* Product */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5">
                  <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-500">Product</p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{viewModal.review.product?.name || 'Unknown Product'}</p>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-500 mb-2">Review Comment</p>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">"{viewModal.review.comment}"</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reviewed on {new Date(viewModal.review.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>

                {/* Admin Response */}
                {viewModal.review.adminResponse?.text ? (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/5 dark:to-yellow-500/5 border border-amber-200 dark:border-amber-500/10">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Admin Response</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {viewModal.review.adminResponse.respondedAt && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">
                            {new Date(viewModal.review.adminResponse.respondedAt).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setViewModal({ open: false, review: null });
                            setTimeout(() => openResponseModal(viewModal.review), 100);
                          }}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors border border-slate-200 dark:border-white/5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{viewModal.review.adminResponse.text}</p>
                    {viewModal.review.adminResponse.respondedByName && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-2.5 font-medium">— {viewModal.review.adminResponse.respondedByName}</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setViewModal({ open: false, review: null });
                      setTimeout(() => openResponseModal(viewModal.review), 100);
                    }}
                    className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 dark:hover:border-amber-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Write a Response
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {responseModal.open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-md px-4" onClick={() => setResponseModal({ open: false, reviewId: null, text: '' })}>
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full" />

            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    {responseModal.text ? 'Edit Response' : 'Write Response'}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Your response will be visible to the customer on the product page.
                  </p>
                </div>
                <button
                  onClick={() => setResponseModal({ open: false, reviewId: null, text: '' })}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all text-slate-400 dark:text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResponseSubmit} className="space-y-5">
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-500 mb-3 block">
                    Your Response
                  </label>
                  <textarea
                    rows={5}
                    value={responseModal.text}
                    onChange={(e) => setResponseModal(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Write a professional and helpful response to this customer's review..."
                    className="w-full rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 p-5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all resize-none text-sm leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResponseModal({ open: false, reviewId: null, text: '' })}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewsActionLoading || !responseModal.text.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-500 text-white font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
                  >
                    {reviewsActionLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {responseModal.text ? 'Update Response' : 'Send Response'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewManager;
