import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../../redux/slices/productSlice';
import { editAdminProduct } from '../../redux/slices/adminSlice';
import { useToast } from '../../components/common/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { resolveImage } from '../../services/api';
import {
  Search,
  RotateCw,
  AlertTriangle,
  Package,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Save,
  Layers,
  Bell,
  BellRing,
} from 'lucide-react';

const StockManager = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const { products, loading } = useSelector((state) => state.products);
  const { actionLoading } = useSelector((state) => state.admin);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [refillInputs, setRefillInputs] = useState({});
  const [sizeInputs, setSizeInputs] = useState({});
  const [newAlerts, setNewAlerts] = useState([]); // newly out-of-stock since last refresh

  // Keep track of previous OOS product IDs to detect newly added ones
  const prevOosIds = useRef(new Set());
  const isFirstLoad = useRef(true);

  const loadData = () => {
    dispatch(fetchProducts({ limit: 200 }));
  };

  // Initial load + auto-refresh every 60 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Detect newly out-of-stock products after each products update
  useEffect(() => {
    if (!products.length) return;

    const currentOosIds = new Set(
      products.filter((p) => p.stock === 0).map((p) => p._id)
    );

    if (isFirstLoad.current) {
      // On first load just seed the ref — don't fire alerts
      prevOosIds.current = currentOosIds;
      isFirstLoad.current = false;
      return;
    }

    // Products that are newly out-of-stock
    const newlyOos = products.filter(
      (p) => p.stock === 0 && !prevOosIds.current.has(p._id)
    );

    if (newlyOos.length > 0) {
      newlyOos.forEach((p) => {
        toast(`⚠️ "${p.name}" is now Out of Stock!`, 'error');
      });
      setNewAlerts((prev) => [...newlyOos, ...prev]);
    }

    prevOosIds.current = currentOosIds;
  }, [products]);

  // Only show out-of-stock products, optionally filtered by search
  const outOfStockProducts = React.useMemo(() => {
    return products.filter((p) => {
      const isOos = p.stock === 0;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase());
      return isOos && matchesSearch;
    });
  }, [products, searchQuery]);

  // ── Refill handlers ──────────────────────────────────────────────────────────

  const handleRefillStock = async (product, amount) => {
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      toast('Please enter a valid stock quantity.', 'error');
      return;
    }

    try {
      const productPayload = {
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        category: product.category?._id,
        subcategory: product.subcategory?._id || undefined,
        description: product.description,
        images: product.images,
        variants: product.variants,
        sizes: product.sizes,
        colorImages: product.colorImages,
        stock: parsedAmount,
      };

      await dispatch(
        editAdminProduct({ id: product._id, productData: productPayload })
      ).unwrap();

      toast(`Stock for "${product.name}" updated to ${parsedAmount} units!`, 'success');

      setRefillInputs((prev) => {
        const copy = { ...prev };
        delete copy[product._id];
        return copy;
      });

      // Remove from alert list once refilled
      setNewAlerts((prev) => prev.filter((a) => a._id !== product._id));

      loadData();
    } catch (err) {
      toast(err || 'Failed to update stock.', 'error');
    }
  };

  const toggleSizeExpansion = (product) => {
    if (expandedProduct === product._id) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(product._id);
      const initialSizes = {};
      (product.sizes || []).forEach((s, idx) => {
        initialSizes[idx] = s.stock;
      });
      setSizeInputs((prev) => ({ ...prev, [product._id]: initialSizes }));
    }
  };

  const handleSizeStockChange = (productId, sizeIdx, val) => {
    const parsedVal = parseInt(val, 10) || 0;
    setSizeInputs((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [sizeIdx]: Math.max(0, parsedVal),
      },
    }));
  };

  const handleSaveSizesStock = async (product) => {
    const sizesState = sizeInputs[product._id] || {};
    const updatedSizes = (product.sizes || []).map((s, idx) => ({
      size: s.size,
      price: s.price,
      stock:
        typeof sizesState[idx] !== 'undefined' ? sizesState[idx] : s.stock,
    }));
    const newTotalStock = updatedSizes.reduce((sum, item) => sum + item.stock, 0);

    try {
      const productPayload = {
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        category: product.category?._id,
        subcategory: product.subcategory?._id || undefined,
        description: product.description,
        images: product.images,
        variants: product.variants,
        sizes: updatedSizes,
        colorImages: product.colorImages,
        stock: newTotalStock,
      };

      await dispatch(
        editAdminProduct({ id: product._id, productData: productPayload })
      ).unwrap();

      toast(`Size stocks for "${product.name}" updated!`, 'success');
      setNewAlerts((prev) => prev.filter((a) => a._id !== product._id));
      setExpandedProduct(null);
      loadData();
    } catch (err) {
      toast(err || 'Failed to update variant stocks.', 'error');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-16 min-h-screen relative">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full  border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Package className="w-4 h-4" />
            Out-of-Stock Control
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Stock Refill Panel
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl">
            All products currently out of stock are listed here. Refill
            quantities directly — alerts fire automatically when any item hits
            zero.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-bold text-slate-300 hover:bg-black/ dark:hover:bg-white/ transition active:scale-95 disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-yellow-500' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── NEW ALERT BANNER ────────────────────────────────────── */}
      {newAlerts.length > 0 && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 flex items-start gap-4 shadow-xl shadow-rose-500/5">
          <div className="mt-0.5 w-10 h-10 shrink-0 rounded-2xl bg-rose-500/20 flex items-center justify-center">
            <BellRing className="w-5 h-5 text-rose-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-rose-400 uppercase tracking-wider mb-1">
              Stock Alert — {newAlerts.length} item{newAlerts.length > 1 ? 's' : ''} just ran out!
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {newAlerts.map((a) => (
                <span
                  key={a._id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/20"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {a.name}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setNewAlerts([])}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-black/ dark:hover:bg-white/ transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── SUMMARY BAR ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-[2rem] border border-rose-500/10  p-6 shadow-xl backdrop-blur-xl flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest font-black text-red-700">
              Out of Stock
            </p>
            <h3 className="text-4xl font-black text-red-500">
              {outOfStockProducts.length}
            </h3>
            <p className="text-xs text-slate-500">Products need restocking</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/5 dark:border-white/5  p-6 shadow-xl backdrop-blur-xl flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-800">
              Total Catalog
            </p>
            <h3 className="text-4xl font-black">{products.length}</h3>
            <p className="text-xs text-slate-500">Active product listings</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-black/5 dark:border-white/5 flex items-center justify-center">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
        </div>
      </div>

      {/* ── SEARCH ──────────────────────────────────────────────── */}
      <div className="relative w-70">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search out-of-stock "
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900/60 rounded-2xl border border-black/10 dark:border-white/10 outline-none text-sm placeholder:text-slate-500 focus:border-rose-500 transition"
        />
      </div>

      {/* ── TABLE ───────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : outOfStockProducts.length === 0 ? (
        <div className="py-24 text-center rounded-[2.5rem] border border-dashed border-emerald-500/20 bg-emerald-500/5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <Package className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-black text-emerald-400">
            All products are in stock!
          </h3>
          <p className="text-xs text-slate-500 mt-2">
            No items are currently out of stock. This page will alert you as soon as any product runs out.
          </p>
        </div>
      ) : (
        <div className="rounded-[2.5rem] border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl">
          {/* DESKTOP TABLE */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-slate-900/80 border-b border-black/5 dark:border-white/5  text-xs font-black uppercase tracking-wider">
                  <th className="py-5 px-6 dark:text-slate-400 text-white">Product</th>
                  <th className="py-5 px-6 dark:text-slate-400 text-white">Category</th>
                  <th className="py-5 px-6 dark:text-slate-400 text-white">Status</th>
                  <th className="py-5 px-6 dark:text-slate-400 text-white">Refill Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {outOfStockProducts.map((p) => {
                  const hasSizes = p.sizes && p.sizes.length > 0;
                  const refillVal =
                    refillInputs[p._id] !== undefined
                      ? refillInputs[p._id]
                      : 1;
                  const isAlerted = newAlerts.some((a) => a._id === p._id);

                  return (
                    <React.Fragment key={p._id}>
                      <tr
                        className={`transition-colors ${isAlerted
                            ? 'bg-rose-500/5 border-l-2 border-rose-500'
                            : 'hover:bg-white/[0.02]'
                          }`}
                      >
                        {/* Product */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                              <img
                                src={resolveImage(p.images?.[0])}
                                alt={p.name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    'https://placehold.co/100x100/1a0000/ef4444?text=OOS';
                                }}
                                className="w-14 h-14 rounded-2xl object-cover border border-rose-500/20"
                              />
                              {isAlerted && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-950 animate-ping" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">
                                {p.name}
                              </h4>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {p.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-800 border border-black/5 dark:border-white/5 text-xs text-slate-300 font-bold whitespace-nowrap">
                            {p.category?.name || 'Unassigned'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-5 px-6">
                          <div className="flex flex-col gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-wide w-max">
                              <X className="w-3 h-3" />
                              Out of Stock
                            </span>
                            {hasSizes && (
                              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                <Layers className="w-3 h-3 text-yellow-500" />
                                {p.sizes.length} Size Variants
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Refill */}
                        <td className="py-5 px-6">
                          {hasSizes ? (
                            <button
                              onClick={() => toggleSizeExpansion(p)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-xs hover:bg-yellow-500/20 transition-all"
                            >
                              Manage Sizes
                              {expandedProduct === p._id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center gap-3">
                              {/* Stepper */}
                              <div className="flex items-center  rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden h-11">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRefillInputs((prev) => ({
                                      ...prev,
                                      [p._id]: Math.max(
                                        1,
                                        (prev[p._id] ?? 1) - 1
                                      ),
                                    }))
                                  }
                                  className="w-10 h-full flex items-center justify-center hover:bg-black/ dark:hover:bg-white/ border-r border-black/10 dark:border-white/10 transition"
                                >
                                  <Minus className="w-3.5 h-3.5 text-slate-800" />
                                </button>

                                <input
                                  type="number"
                                  min="1"
                                  value={refillVal}
                                  onChange={(e) =>
                                    setRefillInputs((prev) => ({
                                      ...prev,
                                      [p._id]: Math.max(
                                        1,
                                        parseInt(e.target.value, 10) || 1
                                      ),
                                    }))
                                  }
                                  className="w-16 text-center bg-transparent border-0 outline-none text-sm font-bold text-black dark:text-white  h-full"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    setRefillInputs((prev) => ({
                                      ...prev,
                                      [p._id]: (prev[p._id] ?? 1) + 1,
                                    }))
                                  }
                                  className="w-10 h-full flex items-center justify-center hover:bg-black/ dark:hover:bg-white/ border-l border-black/10 dark:border-white/10 transition"
                                >
                                  <Plus className="w-3.5 h-3.5 text-slate-800" />
                                </button>
                              </div>

                              {/* Save */}
                              <button
                                onClick={() => handleRefillStock(p, refillVal)}
                                disabled={actionLoading}
                                className="h-11 px-5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-xs transition active:scale-95 shadow-lg shadow-yellow-500/10 flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Refill
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* ── SIZE DRAWER ─────────────────────────────── */}
                      {hasSizes && expandedProduct === p._id && (
                        <tr>
                          <td
                            colSpan={4}
                            className="bg-slate-900/30 px-8 py-5 border-b border-black/5 dark:border-white/5"
                          >
                            <div className="rounded-3xl border border-black/5 dark:border-white/5 bg-slate-950/60 p-5 space-y-4 max-w-3xl">
                              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                                <h5 className="text-sm font-black text-yellow-400 flex items-center gap-2">
                                  <Layers className="w-4 h-4" />
                                  Refill Sizes — {p.name}
                                </h5>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                  Size × Stock Matrix
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {p.sizes.map((s, sIdx) => {
                                  const val =
                                    sizeInputs[p._id]?.[sIdx] !== undefined
                                      ? sizeInputs[p._id][sIdx]
                                      : s.stock;
                                  return (
                                    <div
                                      key={sIdx}
                                      className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-900 border border-black/5 dark:border-white/5"
                                    >
                                      <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">
                                          Size
                                        </p>
                                        <p className="text-base font-black text-slate-900 dark:text-white">
                                          {s.size}
                                        </p>
                                        <p className="text-[10px] text-yellow-500/70 font-semibold">
                                          ₹{s.price}
                                        </p>
                                      </div>
                                      <div className="flex items-center bg-slate-950 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden h-9">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSizeStockChange(
                                              p._id,
                                              sIdx,
                                              val - 1
                                            )
                                          }
                                          className="w-8 h-full flex items-center justify-center hover:bg-black/ dark:hover:bg-white/ border-r border-black/10 dark:border-white/10 transition"
                                        >
                                          <Minus className="w-3 h-3 text-slate-400" />
                                        </button>
                                        <input
                                          type="number"
                                          min="0"
                                          value={val}
                                          onChange={(e) =>
                                            handleSizeStockChange(
                                              p._id,
                                              sIdx,
                                              e.target.value
                                            )
                                          }
                                          className="flex-1 text-center bg-transparent border-0 outline-none text-xs font-bold text-slate-900 dark:text-white h-full"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSizeStockChange(
                                              p._id,
                                              sIdx,
                                              val + 1
                                            )
                                          }
                                          className="w-8 h-full flex items-center justify-center hover:bg-black/ dark:hover:bg-white/ border-l border-black/10 dark:border-white/10 transition"
                                        >
                                          <Plus className="w-3 h-3 text-slate-400" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
                                <button
                                  type="button"
                                  onClick={() => setExpandedProduct(null)}
                                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveSizesStock(p)}
                                  disabled={actionLoading}
                                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-xs transition active:scale-95 shadow-lg shadow-yellow-500/10 flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save Sizes
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="xl:hidden p-4 sm:p-6 space-y-4 bg-slate-50 dark:bg-slate-900/20">
            {outOfStockProducts.map((p) => {
              const hasSizes = p.sizes && p.sizes.length > 0;
              const refillVal = refillInputs[p._id] !== undefined ? refillInputs[p._id] : 1;
              const isAlerted = newAlerts.some((a) => a._id === p._id);

              return (
                <div
                  key={p._id}
                  className={`relative rounded-3xl border ${isAlerted ? 'border-rose-500/50 bg-rose-500/5' : 'border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950'} p-5 shadow-sm overflow-hidden`}
                >
                  <div className="flex gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={resolveImage(p.images?.[0])}
                        alt={p.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/100x100/1a0000/ef4444?text=OOS';
                        }}
                        className="w-20 h-20 rounded-2xl object-cover border border-rose-500/20"
                      />
                      {isAlerted && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-950 animate-ping" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {p.slug}
                      </p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                          {p.category?.name || 'Unassigned'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-wide">
                          <X className="w-3 h-3" /> OOS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 dark:border-white/5 pt-4">
                    {hasSizes ? (
                      <div className="space-y-4">
                        <button
                          onClick={() => toggleSizeExpansion(p)}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold text-sm hover:bg-yellow-500/20 transition-all"
                        >
                          Manage Sizes
                          {expandedProduct === p._id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        
                        {expandedProduct === p._id && (
                          <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-4">
                            <h5 className="text-sm font-black text-yellow-600 dark:text-yellow-400 flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-2">
                              <Layers className="w-4 h-4" />
                              Refill Sizes
                            </h5>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {p.sizes.map((s, sIdx) => {
                                const val = sizeInputs[p._id]?.[sIdx] !== undefined ? sizeInputs[p._id][sIdx] : s.stock;
                                return (
                                  <div key={sIdx} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm">
                                    <div>
                                      <p className="text-sm font-black text-slate-900 dark:text-white">{s.size}</p>
                                      <p className="text-[10px] text-yellow-600 dark:text-yellow-500/70 font-semibold">₹{s.price}</p>
                                    </div>
                                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden h-9">
                                      <button type="button" onClick={() => handleSizeStockChange(p._id, sIdx, val - 1)} className="w-8 h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/5 border-r border-slate-200 dark:border-white/10 transition">
                                        <Minus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                      </button>
                                      <input type="number" min="0" value={val} onChange={(e) => handleSizeStockChange(p._id, sIdx, e.target.value)} className="w-12 text-center bg-transparent border-0 outline-none text-xs font-bold text-slate-900 dark:text-white h-full" />
                                      <button type="button" onClick={() => handleSizeStockChange(p._id, sIdx, val + 1)} className="w-8 h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/5 border-l border-slate-200 dark:border-white/10 transition">
                                        <Plus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleSaveSizesStock(p)}
                              disabled={actionLoading}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-sm transition active:scale-95 shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                            >
                              <Save className="w-4 h-4" />
                              Save Sizes
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 flex items-center bg-slate-50 dark:bg-transparent rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden h-12">
                          <button
                            type="button"
                            onClick={() => setRefillInputs((prev) => ({ ...prev, [p._id]: Math.max(1, (prev[p._id] ?? 1) - 1) }))}
                            className="w-12 h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/5 border-r border-slate-200 dark:border-white/10 transition"
                          >
                            <Minus className="w-4 h-4 text-slate-800 dark:text-slate-400" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={refillVal}
                            onChange={(e) => setRefillInputs((prev) => ({ ...prev, [p._id]: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                            className="flex-1 text-center bg-transparent border-0 outline-none text-base font-bold text-black dark:text-white h-full"
                          />
                          <button
                            type="button"
                            onClick={() => setRefillInputs((prev) => ({ ...prev, [p._id]: (prev[p._id] ?? 1) + 1 }))}
                            className="w-12 h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/5 border-l border-slate-200 dark:border-white/10 transition"
                          >
                            <Plus className="w-4 h-4 text-slate-800 dark:text-slate-400" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRefillStock(p, refillVal)}
                          disabled={actionLoading}
                          className="h-12 sm:w-32 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-sm transition active:scale-95 shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          Refill
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AUTO-REFRESH NOTICE ─────────────────────────────────── */}
      <p className="text-center text-xs text-slate-600 flex items-center justify-center gap-1.5">
        <Bell className="w-3 h-3" />
        This page auto-refreshes every 60 seconds and alerts you when a product goes out of stock.
      </p>
    </div>
  );
};

export default StockManager;
