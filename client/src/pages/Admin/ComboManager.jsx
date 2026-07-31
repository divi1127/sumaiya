import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, Package } from 'lucide-react';
import API, { resolveImage } from '../../services/api';
import { useToast } from '../../components/common/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SERVER_BASE = API.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

const ComboManager = () => {
  const { toast } = useToast();
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [comboName, setComboName] = useState('');
  const [comboDescription, setComboDescription] = useState('');
  const [comboImage, setComboImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [status, setStatus] = useState('Active');

  useEffect(() => {
    fetchCombos();
    fetchProducts();
  }, []);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/combos/admin/all');
      setCombos(data.data);
    } catch (error) {
      toast('Failed to load combos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products?limit=100');
      setProducts(data.data);
    } catch (error) {
      toast('Failed to load products', 'error');
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setComboName('');
    setComboDescription('');
    setComboImage('');
    setSelectedProducts([]);
    setDiscountType('percentage');
    setDiscountValue('');
    setStatus('Active');
    setShowModal(true);
  };

  const handleOpenEdit = (combo) => {
    setEditingId(combo._id);
    setComboName(combo.comboName);
    setComboDescription(combo.comboDescription || '');
    setComboImage(combo.comboImage || '');
    setSelectedProducts(combo.products.map(p => p._id));
    setDiscountType(combo.discountType || 'percentage');
    setDiscountValue(combo.discountValue.toString());
    setStatus(combo.status);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length < 2) {
      toast('A combo must include at least 2 products.', 'error');
      return;
    }
    const payload = {
      comboName,
      comboSlug: comboName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      comboDescription,
      comboImage: comboImage || 'https://placehold.co/600x400/0f172a/94a3b8?text=Combo',
      products: selectedProducts,
      discountType,
      discountValue: Number(discountValue),
      status
    };

    try {
      if (editingId) {
        await API.put(`/combos/${editingId}`, payload);
        toast('Combo updated successfully', 'success');
      } else {
        await API.post('/combos', payload);
        toast('Combo created successfully', 'success');
      }
      setShowModal(false);
      fetchCombos();
    } catch (error) {
      toast('Failed to save combo', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this combo?')) return;
    try {
      await API.delete(`/combos/${id}`);
      toast('Combo deleted', 'success');
      fetchCombos();
    } catch (error) {
      toast('Failed to delete combo', 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;
    const formData = new FormData();
    formData.append('images', files[0]);
    setUploadingImage(true);
    try {
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setComboImage(`${SERVER_BASE}${data.data[0]}`);
      toast('Image uploaded', 'success');
    } catch (error) {
      toast('Upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="space-y-6 pb-16 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Combo Offers</h1>
          <p className="text-sm text-slate-500 mt-1">Bundle products together for discounted prices.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Combo</span>
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.map(combo => (
            <div key={combo._id} className="glass-panel border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg p-5">
              <div className="flex justify-between items-start mb-4">
                <img src={resolveImage(combo.comboImage)} alt={combo.comboName} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(combo)} className="p-2 text-cyan-500 hover:bg-cyan-500/10 rounded-full">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(combo._id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg">{combo.comboName}</h3>
              <p className="text-sm text-slate-400 mb-3">{combo.products.length} Products Included</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {combo.products.map((p, i) => i < 3 && (
                  <span key={p._id} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{p.name.substring(0, 15)}...</span>
                ))}
                {combo.products.length > 3 && <span className="text-xs text-slate-500">+{combo.products.length - 3} more</span>}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${combo.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                  {combo.status}
                </span>
                <span className="font-bold text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full text-sm">
                  {combo.discountType === 'percentage' ? `${combo.discountValue}% OFF` : `₹${combo.discountValue} OFF`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2rem] bg-white dark:bg-slate-950 flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Combo' : 'Create Combo'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold block mb-2">Combo Name *</label>
                    <input type="text" required value={comboName} onChange={e => setComboName(e.target.value)} className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4" />
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-2">Description</label>
                    <textarea rows="3" value={comboDescription} onChange={e => setComboDescription(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold block mb-2">Discount Type *</label>
                      <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4">
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold block mb-2">Discount Value *</label>
                      <input type="number" required min="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-2">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-2">Banner Image</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm" />
                    {comboImage && <img src={resolveImage(comboImage)} alt="Banner" className="mt-2 h-20 rounded-lg object-cover" />}
                  </div>
                </div>
                <div className="border-l border-slate-200 dark:border-slate-800 pl-6 h-full flex flex-col">
                  <label className="text-sm font-bold block mb-2">Select Products * ({selectedProducts.length} selected)</label>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-2 border border-slate-200 dark:border-slate-700 rounded-xl p-2 max-h-[400px]">
                    {products.map(p => (
                      <div 
                        key={p._id} 
                        onClick={() => toggleProduct(p._id)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${selectedProducts.includes(p._id) ? 'bg-cyan-500/10 border border-cyan-500' : 'hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent'}`}
                      >
                        <img src={resolveImage(p.images[0])} className="w-10 h-10 rounded-md object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{p.name}</p>
                          <p className="text-xs text-slate-400">₹{p.price}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedProducts.includes(p._id) ? 'bg-cyan-500 border-cyan-500' : 'border-slate-400'}`}>
                          {selectedProducts.includes(p._id) && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl font-bold border border-slate-300 dark:border-slate-600">Cancel</button>
              <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl font-bold bg-cyan-500 text-white shadow-lg">Save Combo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComboManager;
