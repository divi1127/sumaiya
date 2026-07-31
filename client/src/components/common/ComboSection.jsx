import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ShoppingBag } from 'lucide-react';
import { resolveImage } from '../../services/api';
import { useToast } from './ToastContext';
import { addToCart } from '../../redux/slices/cartSlice';

const ComboSection = ({ combos }) => {
  const dispatch = useDispatch();
  const { toast } = useToast();

  // state to track selected variants for each combo product
  // format: { comboId: { productId: { size: 'M', color: 'Red' } } }
  const [comboSelections, setComboSelections] = useState({});

  if (!combos || combos.length === 0) return null;

  const handleSelect = (comboId, productId, type, value) => {
    setComboSelections(prev => ({
      ...prev,
      [comboId]: {
        ...(prev[comboId] || {}),
        [productId]: {
          ...(prev[comboId]?.[productId] || {}),
          [type]: value
        }
      }
    }));
  };

  const getVariant = (product, selections) => {
    if (!product.productVariants || product.productVariants.length === 0) return null;
    const selected = selections || {};
    // Find exact match or default to first
    let variant = product.productVariants.find(v => v.size === selected.size && v.color === selected.color);
    if (!variant && selected.size) variant = product.productVariants.find(v => v.size === selected.size);
    if (!variant) variant = product.productVariants[0];
    return variant;
  };

  const handleAddComboToCart = (combo) => {
    // Collect all items
    const comboItems = [];
    const selections = comboSelections[combo._id] || {};

    let totalOriginalPrice = 0;
    
    // Check stock for all items
    for (const p of combo.products) {
      const selected = selections[p._id] || {};
      let variantStr = '';
      let activePrice = p.price;
      let activeStock = p.stock;
      let selectedSize = selected.size;
      let selectedColor = selected.color;

      if (p.productVariants && p.productVariants.length > 0) {
        const v = getVariant(p, selections);
        if (v) {
          activePrice = v.price;
          activeStock = v.stock;
          selectedSize = v.size;
          selectedColor = v.color;
          variantStr = `Size: ${v.size}, Color: ${v.color}`;
        }
      } else {
        // Fallback for old products
        if (p.sizes?.length > 0) {
          const s = p.sizes.find(sz => sz.size === selectedSize) || p.sizes[0];
          activePrice = s.price;
          activeStock = s.stock;
          variantStr = `Size: ${s.size}`;
          selectedSize = s.size;
        }
      }

      if (activeStock <= 0) {
        toast(`Product ${p.name} is out of stock in selected variant.`, 'error');
        return;
      }

      totalOriginalPrice += activePrice;

      comboItems.push({
        product: p,
        variantStr,
        selectedSize,
        selectedColor,
        price: activePrice
      });
    }

    // Calculate discount per item or just add total discount
    let discountAmount = 0;
    if (combo.discountType === 'percentage') {
      discountAmount = (totalOriginalPrice * combo.discountValue) / 100;
    } else {
      discountAmount = combo.discountValue;
    }

    // Distribute discount or just attach to items (backend will recalculate, but we send it)
    const discountPerItem = discountAmount / comboItems.length;

    comboItems.forEach(item => {
      dispatch(addToCart({
        product: item.product._id,
        name: item.product.name,
        price: item.price,
        image: item.product.images?.[0],
        quantity: 1,
        stock: 999, // Bypass local strict check since backend handles it
        variant: item.variantStr,
        size: item.selectedSize,
        color: item.selectedColor,
        comboId: combo._id,
        comboName: combo.comboName,
        appliedDiscount: discountPerItem
      }));
    });

    toast('Combo added to cart!', 'success');
  };

  return (
    <section className="space-y-8 border-t border-slate-100 dark:border-slate-800 pt-16">
      <div>
        <h2 className="text-3xl font-black">Frequently Bought Together</h2>
        <p className="text-sm text-slate-500 mt-1">Get more value with these bundled offers.</p>
      </div>

      <div className="space-y-6">
        {combos.map(combo => {
          let totalOriginal = 0;
          const comboItemsDisplay = combo.products.map(p => {
            const v = getVariant(p, comboSelections[combo._id]?.[p._id]);
            const price = v ? v.price : p.price;
            totalOriginal += price;
            return { p, v, price };
          });

          let finalComboPrice = totalOriginal;
          let savings = 0;
          if (combo.discountType === 'percentage') {
            savings = (totalOriginal * combo.discountValue) / 100;
          } else {
            savings = combo.discountValue;
          }
          finalComboPrice = Math.max(0, totalOriginal - savings);

          return (
            <div key={combo._id} className="glass-panel border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-xl bg-gradient-to-br from-white/50 to-white/30 dark:from-slate-900/50 dark:to-slate-900/30">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                
                {/* Products List */}
                <div className="flex-1 space-y-4 w-full">
                  <h3 className="text-xl font-bold">{combo.comboName}</h3>
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                    {comboItemsDisplay.map(({ p, v, price }, idx) => {
                      const uniqueSizes = [...new Set(p.productVariants?.map(pv => pv.size) || p.sizes?.map(s => s.size) || [])];
                      const uniqueColors = [...new Set(p.productVariants?.map(pv => pv.color) || [])];
                      const selected = comboSelections[combo._id]?.[p._id] || {};

                      return (
                        <React.Fragment key={p._id}>
          {idx > 0 && <div className="hidden sm:flex items-center justify-center text-2xl font-bold text-slate-300">+</div>}
          <div className="flex-1 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
            <img src={resolveImage(p.images[0])} className="w-20 h-20 rounded-xl object-cover" alt={p.name} />
            <div className="flex-1 min-w-0 space-y-2">
              <p className="font-bold text-sm line-clamp-2">{p.name}</p>
              <p className="text-cyan-500 font-bold">₹{price}</p>
              
              {/* Variant Selectors */}
              {(uniqueSizes.length > 0 || uniqueColors.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.length > 0 && (
                    <select 
                      className="text-xs p-1 rounded border bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                      value={selected.size || (v ? v.size : '')}
                      onChange={(e) => handleSelect(combo._id, p._id, 'size', e.target.value)}
                    >
                      {uniqueSizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                    </select>
                  )}
                  {uniqueColors.length > 0 && (
                    <select 
                      className="text-xs p-1 rounded border bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                      value={selected.color || (v ? v.color : '')}
                      onChange={(e) => handleSelect(combo._id, p._id, 'color', e.target.value)}
                    >
                      {uniqueColors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              )}
              {v?.image && (
                <div className="mt-2">
                  <img src={resolveImage(v.image)} alt="variant" className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                </div>
              )}
            </div>
          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Total Box */}
                <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-sm text-slate-500 line-through mb-1">Total: ₹{totalOriginal.toFixed(2)}</p>
                  <p className="text-3xl font-black text-cyan-500 mb-2">₹{finalComboPrice.toFixed(2)}</p>
                  <div className="inline-block bg-rose-500/10 text-rose-500 font-bold text-xs px-3 py-1 rounded-full mb-5 border border-rose-500/20">
                    You Save ₹{savings.toFixed(2)}
                  </div>
                  <button 
                    onClick={() => handleAddComboToCart(combo)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add Combo To Cart
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ComboSection;
