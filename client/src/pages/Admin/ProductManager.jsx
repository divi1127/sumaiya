import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addAdminProduct,
  editAdminProduct,
  deleteAdminProduct,
  fetchAdminSubCategories,
  fetchAdminCategories
} from '../../redux/slices/adminSlice';
import { fetchProducts } from '../../redux/slices/productSlice';
import { useToast } from '../../components/common/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, AlertTriangle, Sparkles, Upload } from 'lucide-react';
import API, { resolveImage } from '../../services/api';

// Derive server origin from API baseURL (strips /api suffix)
const SERVER_BASE = API.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';


const ProductManager = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const { products, loading } = useSelector((state) => state.products);
  const { categories, subcategories, actionLoading } = useSelector((state) => state.admin);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Field States
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [imagesInput, setImagesInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [colorsInput, setColorsInput] = useState('Black, Silver, Blue');
  const [productVariants, setProductVariants] = useState([]); // [{ size, color, price, stock, image }]
  const [colorMap, setColorMap] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const addVariantRow = () => setProductVariants(prev => [...prev, { size: '', color: '', price: '', stock: '', image: '' }]);
  const removeVariantRow = (i) => setProductVariants(prev => prev.filter((_, idx) => idx !== i));
  const updateVariantRow = (i, field, val) => setProductVariants(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const PRODUCTS_PER_PAGE = 10;
  useEffect(() => {
    dispatch(fetchProducts({ limit: 100 }));
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminSubCategories());
  }, [dispatch]);
  useEffect(() => {
    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

    // If current page exceeds available pages
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [products, currentPage]);
  const resetForm = () => {
    setName('');
    setPrice('');
    setCompareAtPrice('');
    setStock('');
    setCategory('');
    setSubcategory('');
    setDescription('');
    setImagesInput('');
    setUploadingImage(false);
    setColorsInput('Black, Silver, Blue');
    setProductVariants([]);
    setColorMap([]);
    setEditingId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    if (categories.length > 0) {
      setCategory(categories[0]._id);
    }
    setShowModal(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingId(p._id);
    setName(p.name);
    setPrice(p.price.toString());
    setCompareAtPrice(p.compareAtPrice ? p.compareAtPrice.toString() : '');
    setStock(p.stock.toString());
    setCategory(p.category?._id || '');
    setSubcategory(p.subcategory?._id || '');
    setDescription(p.description);
    setImagesInput(p.images.join(', '));

    const colorVar = p.variants?.find(v => v.name.toLowerCase() === 'color');
    setColorsInput(colorVar ? colorVar.options.join(', ') : '');
    setProductVariants(p.productVariants || []);
    setColorMap(p.colorImages || []);

    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !stock || !category || !description) {
      toast('Please fill out all required catalog details.', 'error');
      return;
    }

    // Validate productVariants
    if (productVariants.length > 0) {
      const variantKeys = productVariants.map(v => `${v.size.trim()}-${v.color.trim()}`).filter(k => k !== '-');
      if (new Set(variantKeys).size !== variantKeys.length) {
        toast('Duplicate Size & Color combinations are not allowed.', 'error');
        return;
      }
      for (const v of productVariants) {
        if (!v.size.trim() || !v.color.trim()) { toast('Each variant must have a size and color.', 'error'); return; }
        if (!v.price || Number(v.price) <= 0) { toast(`Price for variant must be greater than 0.`, 'error'); return; }
        if (Number(v.stock) < 0) { toast(`Stock for variant cannot be negative.`, 'error'); return; }
      }
    }

    // Process image URLs
    const images = imagesInput
      ? imagesInput.split(',').map(s => s.trim()).filter(Boolean)
      : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80']; // default headphones placeholder

    // Build variants structure
    const variants = [];
    if (colorsInput.trim()) {
      variants.push({ name: 'Color', options: colorsInput.split(',').map(s => s.trim()).filter(Boolean) });
    }
    if (productVariants.length > 0) {
      const uniqueSizes = [...new Set(productVariants.map(v => v.size.trim()).filter(Boolean))];
      if (uniqueSizes.length > 0) variants.push({ name: 'Size', options: uniqueSizes });
      const uniqueColors = [...new Set(productVariants.map(v => v.color.trim()).filter(Boolean))];
      if (uniqueColors.length > 0 && !colorsInput.trim()) variants.push({ name: 'Color', options: uniqueColors });
    }

    const productVariantsPayload = productVariants
      .filter(v => v.size.trim() && v.color.trim())
      .map(v => ({ 
        size: v.size.trim(), 
        color: v.color.trim(), 
        price: Number(v.price), 
        stock: Number(v.stock),
        image: v.image || undefined
      }));

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const productPayload = {
      name,
      slug,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      stock: Number(stock),
      category,
      subcategory,
      description,
      images,
      variants,
      productVariants: productVariantsPayload,
      colorImages: colorMap
    };

    try {
      if (editingId) {
        await dispatch(editAdminProduct({ id: editingId, productData: productPayload })).unwrap();
        toast(' product updated successfully!', 'success');
      } else {
        await dispatch(addAdminProduct(productPayload)).unwrap();
        toast('New product added to catalog successfully!', 'success');
      }
      setShowModal(false);
      resetForm();
      dispatch(fetchProducts({ limit: 10 })); // reload catalog
    } catch (err) {
      toast(err || 'Failed to persist product changes.', 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    setUploadingImage(true);
    try {
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newUrls = data.data.map(url => `${SERVER_BASE}${url}`);
      setImagesInput(prev => prev ? `${prev}, ${newUrls.join(', ')}` : newUrls.join(', '));
      toast('Images uploaded successfully', 'success');
    } catch (error) {
      toast('Failed to upload images', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredSubcategories = subcategories.filter(
    (s) => s.category?._id === category
  );
  const handleDelete = async (productId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this catalog product? This is permanent.')) {
      return;
    }

    try {
      await dispatch(deleteAdminProduct(productId)).unwrap();
      toast('Product deleted from active catalog.', 'info');
      dispatch(fetchProducts({ limit: 100 })); // reload
    } catch (err) {
      toast(err || 'Failed to delete product.', 'error');
    }
  };
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  return (
    <div className="space-y-6 pb-16 min-h-screen">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Product Catalog Editor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage active listings, inventory quantities, and variants selection.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-sm shadow-md hover:shadow-cyan-500/10 transition-all active:scale-95 self-stretch sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Main product catalog list table */}
      {/* ================= MAIN PRODUCT TABLE ================= */}
      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <div className="py-12 glass-panel border border-dashed border-slate-200 dark:border-slate-800 rounded-4xl text-center text-slate-400 text-sm">
          No catalog listings created. Click "Add New Product" to populate items.
        </div>
      ) : (
        <div className="glass-panel border border-black/10 dark:border-white/10 rounded-4xl overflow-hidden shadow-lg bg dark:bg-slate-900/40 backdrop-blur-md">

          {/* ===== Desktop Table ===== */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full min-w-275 text-left border-collapse">

              {/* Table Head */}
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-sm font-black">
                  <th className="py-5 px-6">Product</th>
                  <th className="py-5 px-6">Category</th>
                  <th className="py-5 px-6">Price</th>
                  <th className="py-5 px-6">Stock</th>
                  <th className="py-5 px-6 text-center">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                {paginatedProducts.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all"
                  >

                    {/* Product */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-4 min-w-[300px]">

                        <img
                          src={resolveImage(p.images[0])}
                          alt={p.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://placehold.co/100x100/1e293b/94a3b8?text=IMG";
                          }}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">
                            {p.name}
                          </h3>

                          <p className="text-sm text-slate-400 truncate mt-1">
                            {p.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {p.category?.name || "Unassigned"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">
                          ₹{p.price.toFixed(2)}
                        </span>

                        {p.compareAtPrice &&
                          p.compareAtPrice > p.price && (
                            <span className="text-sm text-slate-400 line-through">
                              ₹{p.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-5 px-6">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${p.stock > 10
                            ? "bg-emerald-500/10 text-emerald-500"
                            : p.stock > 0
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}
                      >
                        {p.stock > 0
                          ? `${p.stock} Units`
                          : "Out of Stock"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-3">

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ===== Mobile / Tablet Cards ===== */}
          <div className="xl:hidden p-4 sm:p-6 space-y-4">

            {paginatedProducts.map((p) => (
              <div
                key={p._id}
                className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-5 shadow-sm"
              >

                {/* Top */}
                <div className="flex gap-4">

                  <img
                    src={resolveImage(p.images[0])}
                    alt={p.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://placehold.co/100x100/1e293b/94a3b8?text=IMG";
                    }}
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />

                  <div className="flex-1 min-w-0">

                    <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white line-clamp-2">
                      {p.name}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {p.slug}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">

                      <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {p.category?.name || "Unassigned"}
                      </span>

                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${p.stock > 10
                            ? "bg-emerald-500/10 text-emerald-500"
                            : p.stock > 0
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}
                      >
                        {p.stock > 0
                          ? `${p.stock} Units`
                          : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-5 flex items-center justify-between">

                  <div>
                    <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                      ₹{p.price.toFixed(2)}
                    </p>

                    {p.compareAtPrice &&
                      p.compareAtPrice > p.price && (
                        <p className="text-sm text-slate-400 line-through">
                          ₹{p.compareAtPrice.toFixed(2)}
                        </p>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">

                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="h-11 w-11 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(p._id)}
                      className="h-11 w-11 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ===== Pagination ===== */}
          {totalPages > 1 && (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">

              {/* Left */}
              <div className="text-sm text-slate-500 font-medium text-center lg:text-left">
                Showing page{" "}
                <span className="font-bold text-cyan-500">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-bold">
                  {totalPages}
                </span>
              </div>

              {/* Pagination */}
              <div className="flex items-center flex-wrap justify-center gap-2">

                {/* Prev */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((prev) => prev - 1);

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold disabled:opacity-40 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 transition-all"
                >
                  Prev
                </button>

                {/* Numbers */}
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPage(i + 1);

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                    className={`w-11 h-11 rounded-2xl text-sm font-black transition-all ${currentPage === i + 1
                        ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}

                {/* Next */}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((prev) => prev + 1);

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold disabled:opacity-40 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ///////// */}
      {/* Add / Edit product modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">

          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal */}
          <div className="relative z-50 w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-[2rem] border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
                    {editingId ? "Edit Product" : "CreateProduct Name  Product"}
                  </h2>

                  <p className="text-sm text-slate-500 mt-0.5">
                    Manage catalog details, variants, inventory and product media
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-11 h-11 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Scroll Body */}
            <div className="overflow-y-auto px-5 sm:px-8 py-6">

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* ================= BASIC DETAILS ================= */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Basic Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Product Name */}
                    <div className="lg:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        Product Name *
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="Quantum Gaming Headset"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-900 dark:text-white dark:bg-slate-900 px-5 text-base focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        Category *
                      </label>

                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-900 dark:text-white dark:bg-slate-900 px-5 text-base focus:ring-2 focus:ring-cyan-500 outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategory */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        Subcategory
                      </label>

                      <select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-900 dark:text-white dark:bg-slate-900 px-5 text-base focus:ring-2 focus:ring-cyan-500 outline-none"
                      >
                        <option value="">Select Subcategory</option>

                        {filteredSubcategories.map((sub) => (
                          <option key={sub._id} value={sub._id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stock */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        Available Stock *
                      </label>

                      <input
                        type="number"
                        required
                        placeholder="25"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-900 dark:text-white dark:bg-slate-900 px-5 text-base focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        Price ₹ *
                      </label>

                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="99.99"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-900 dark:text-white dark:bg-slate-900 px-5 text-base focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>

                    {/* Compare Price */}
                    <div className="space-y-2 lg:col-span-2">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        Compare Price ₹
                      </label>

                      <input
                        type="number"
                        step="0.01"
                        placeholder="120.00"
                        value={compareAtPrice}
                        onChange={(e) => setCompareAtPrice(e.target.value)}
                        className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-900 dark:text-white dark:bg-slate-900 px-5 text-base focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ================= VARIANTS ================= */}
                  <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Product Variants
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Colors */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        Colors
                      </label>

                      <input
                        type="text"
                        placeholder="Black, Silver, Blue"
                        value={colorsInput}
                        onChange={(e) => setColorsInput(e.target.value)}
                        className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-900 dark:text-white dark:bg-slate-900 px-5 text-base  focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>

                    {/* Variants — Dynamic Builder */}
                    <div className="space-y-3 lg:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Detailed Variants (Size + Color)</label>
                        <button
                          type="button"
                          onClick={addVariantRow}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-500 text-xs font-bold hover:bg-cyan-500/20 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Variant
                        </button>
                      </div>

                      {productVariants.length > 0 && (
                        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                          <span className="w-20">Size</span>
                          <span className="w-24">Color</span>
                          <span className="flex-1">Price (₹)</span>
                          <span className="flex-1">Stock</span>
                          <span className="flex-1">Variant Image</span>
                          <span className="w-11"></span>
                        </div>
                      )}

                      {productVariants.length === 0 && (
                        <p className="text-xs text-slate-400 italic">No variants added. Base price and stock will be used.</p>
                      )}

                      <AnimatePresence initial={false}>
                        <div className="space-y-2">
                          {productVariants.map((row, i) => (
                            <motion.div
                              key={i}
                              layout
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25, mass: 0.8 }}
                              className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-3 py-2 shadow-sm"
                            >
                              <input
                                type="text"
                                placeholder="Size"
                                value={row.size}
                                onChange={(e) => updateVariantRow(i, 'size', e.target.value)}
                                className="w-20 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Color"
                                value={row.color}
                                onChange={(e) => updateVariantRow(i, 'color', e.target.value)}
                                className="w-24 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                              />
                              <input
                                type="number"
                                placeholder="Price"
                                min="1"
                                value={row.price}
                                onChange={(e) => updateVariantRow(i, 'price', e.target.value)}
                                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                              />
                              <input
                                type="number"
                                placeholder="Stock"
                                min="0"
                                value={row.stock}
                                onChange={(e) => updateVariantRow(i, 'stock', e.target.value)}
                                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                              />
                              <motion.label
                                whileHover={{ borderColor: 'rgba(6,182,212,0.5)' }}
                                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center px-3 text-sm text-slate-500 cursor-pointer hover:border-cyan-400 transition-all flex gap-2 overflow-hidden"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                  e.preventDefault();
                                  const file = e.dataTransfer.files?.[0];
                                  if (!file || !file.type.startsWith('image/')) return;
                                  const formData = new FormData();
                                  formData.append('images', file);
                                  setUploadingImage(true);
                                  try {
                                    const { data } = await API.post('/upload', formData, {
                                      headers: { 'Content-Type': 'multipart/form-data' }
                                    });
                                    const url = `${SERVER_BASE}${data.data[0]}`;
                                    setProductVariants(prev => prev.map((rv, idx) => idx === i ? { ...rv, image: url } : rv));
                                    toast('Variant image uploaded', 'success');
                                  } catch (err) {
                                    toast('Failed to upload variant image', 'error');
                                  } finally {
                                    setUploadingImage(false);
                                  }
                                }}
                              >
                                <Upload className="w-4 h-4 shrink-0" />
                                <span className="truncate">{row.image ? 'Change Image' : 'Upload Image'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('images', file);
                                    setUploadingImage(true);
                                    try {
                                      const { data } = await API.post('/upload', formData, {
                                        headers: { 'Content-Type': 'multipart/form-data' }
                                      });
                                      const url = `${SERVER_BASE}${data.data[0]}`;
                                      setProductVariants(prev => prev.map((rv, idx) => idx === i ? { ...rv, image: url } : rv));
                                      toast('Variant image uploaded', 'success');
                                    } catch (err) {
                                      toast('Failed to upload variant image', 'error');
                                    } finally {
                                      setUploadingImage(false);
                                    }
                                  }}
                                />
                              </motion.label>
                              <motion.div layout className="relative w-11 h-11 shrink-0">
                                {row.image ? (
                                  <img src={resolveImage(row.image)} alt="" className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-800" />
                                ) : (
                                  <div className="w-11 h-11 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                    <span className="text-[10px] font-bold">-</span>
                                  </div>
                                )}
                              </motion.div>
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                type="button"
                                onClick={() => removeVariantRow(i)}
                                className="w-11 h-11 rounded-xl flex items-center justify-center border border-rose-200 dark:border-rose-900 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* ================= IMAGES ================= */}
                <div className="space-y-5">

                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Product Images
                    </h3>
                  </div>

                  {/* Upload Box */}
                  <label className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/5 transition-all">

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />

                    <Plus className="w-10 h-10 text-cyan-500 mb-3" />

                    <h4 className="text-lg font-bold text-slate-700 dark:text-white">
                      {uploadingImage ? "Uploading Images..." : "Upload Product Images"}
                    </h4>

                    <p className="text-sm text-slate-500 mt-1">
                      Drag & drop or click to browse files
                    </p>
                  </label>

                  {/* Preview */}
                  {imagesInput.trim() && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {imagesInput
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((url, idx) => (
                          <div
                            key={idx}
                            className="relative  rounded-2xl overflow-hidden"
                          >
                            <img
                              src={resolveImage(url)}
                              alt=""
                              className="w-20 h-20 object-cover"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const urls = imagesInput
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean);

                                const filtered = urls.filter((_, i) => i !== idx);

                                setImagesInput(filtered.join(", "));
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all "
                            >
                              <X className="w-6 h-6 text-black dark:text-white" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Manual URL */}
                  <input
                    type="text"
                    placeholder="Paste image URLs separated by commas"
                    value={imagesInput}
                    onChange={(e) => setImagesInput(e.target.value)}
                    className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-black dark:text-white px-5 text-base focus:ring-2 focus:ring-cyan-500 outline-none"/>
                </div>

                {/* ================= DESCRIPTION ================= */}
                <div className="space-y-5">

                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Product Description
                    </h3>
                  </div>

                  <textarea
                    required
                    rows={6}
                    placeholder="Provide a detailed product description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-5 text-base focus:ring-2 focus:ring-cyan-500 outline-none"
                  ></textarea>
                </div>

                {/* ================= FOOTER ================= */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-950 pt-5 pb-2 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-200 dark:border-slate-800">

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="h-14 px-8 rounded-2xl border border-slate-300 text-slate-900 hover:bg-red-300 dark:border-slate-700 dark:text-white  font-bold text-base"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="h-14 px-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-base hover:scale-[1.02] transition-all disabled:opacity-60"
                  >
                    {editingId ? "Save Changes" : "Create Product"}
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

export default ProductManager;
