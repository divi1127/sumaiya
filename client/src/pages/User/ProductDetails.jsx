import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProductBySlug, submitReview } from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../redux/slices/wishlistSlice';
import { useToast } from '../../components/common/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProductCard from '../../components/common/ProductCard';
import CountdownTimer from '../../components/common/CountdownTimer';
import ComboSection from '../../components/common/ComboSection';
import {
  Star,
  ShoppingBag,
  Heart,
  Plus,
  Minus,
  ArrowLeft,
  Send,
  Truck,
  ShieldCheck,
  RotateCcw,
  Zap,
  ChevronRight,
  BadgeCheck,
  Share2,
  Copy,
  CheckCircle2,
  Package,
  Flame,
  User,
} from 'lucide-react';
import API, { resolveImage } from '../../services/api';

const ProductDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { product, detailLoading, error } = useSelector(
    (state) => state.products
  );

  const { user } = useSelector((state) => state.auth);
  const { wishlistItems } = useSelector((state) => state.wishlist);

  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const infoRef = useRef(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const isFavorited = wishlistItems.some(
    (item) => item.product === product?._id
  );

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
  }, [slug, dispatch]);

  useEffect(() => {
    if (product) {
      let initialColorImage = product.images?.[0];

      if (product.productVariants && product.productVariants.length > 0) {
        setSelectedSize(product.productVariants[0].size);
        setSelectedColor(product.productVariants[0].color);
        if (product.productVariants[0].image) {
          initialColorImage = product.productVariants[0].image;
        }
      } else if (product.sizes?.length > 0) {
        setSelectedSize(product.sizes[0].size);
      }

      setActiveImage(initialColorImage);
      setQuantity(1);
      setImageLoaded(false);

      const fetchExtra = async () => {
        try {
          const [relatedRes, reviewsRes, offerRes, comboRes] = await Promise.all([
            API.get(`/products?category=${product.category?._id}&limit=5`),
            API.get(`/reviews/${product._id}`),
            API.get(`/offers/product/${product._id}`),
            API.get(`/combos/product/${product._id}`)
          ]);

          setAppliedOffer(offerRes.data.data);
          setRelatedProducts(relatedRes.data.data.filter((x) => x._id !== product._id).slice(0, 4));
          setReviews(reviewsRes.data.data);
          setCombos(comboRes.data.data);
        } catch (err) {
          console.error('Error fetching extra metadata:', err);
        }
      };

      fetchExtra();
    }
  }, [product]);

  const activeVariant = product?.productVariants?.find(v => v.size === selectedSize && v.color === selectedColor);

  useEffect(() => {
    if (activeVariant && activeVariant.image) {
      setActiveImage(activeVariant.image);
      setImageLoaded(false);
    }
  }, [selectedSize, selectedColor, activeVariant]);

  const calculateFinalPrice = () => {
    if (!product) return 0;

    let basePrice = product.price;
    if (activeVariant) {
      basePrice = activeVariant.price;
    } else if (product.sizes && selectedSize) {
      const s = product.sizes.find(sz => sz.size === selectedSize);
      if (s) basePrice = s.price;
    }

    return appliedOffer
      ? appliedOffer.discountType === 'percentage'
        ? basePrice - basePrice * (appliedOffer.discountValue / 100)
        : Math.max(0, basePrice - appliedOffer.discountValue)
      : basePrice;
  };

  const activeStock = activeVariant ? activeVariant.stock : (product?.sizes?.find(s => s.size === selectedSize)?.stock || product?.stock || 0);

  const handleWishlistToggle = () => {
    if (!product) return;
    const finalPrice = calculateFinalPrice();

    if (isFavorited) {
      dispatch(removeFromWishlist(product._id));
      toast('Removed from wishlist', 'info');
    } else {
      dispatch(
        addToWishlist({
          product: product._id,
          name: product.name,
          price: finalPrice,
          image: product.images[0],
          stock: product.stock,
          slug: product.slug,
        })
      );
      toast('Added to wishlist!', 'success');
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (activeStock === 0) {
      toast('Sorry, this variant is out of stock!', 'error');
      return;
    }

    let variantStr = '';
    if (activeVariant) {
      variantStr = `Size: ${activeVariant.size}, Color: ${activeVariant.color}`;
    } else if (selectedSize) {
      variantStr = `Size: ${selectedSize}`;
    }

    const finalPrice = calculateFinalPrice();

    dispatch(
      addToCart({
        product: product._id,
        name: product.name,
        price: finalPrice,
        image: activeVariant?.image || product.images[0],
        quantity,
        stock: activeStock,
        variant: variantStr,
        size: selectedSize,
        color: selectedColor
      })
    );

    toast(`Added ${quantity} item(s) to cart!`, 'success');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast('Please login to submit review!', 'error');
      return;
    }

    if (!comment.trim()) {
      toast('Please enter review text.', 'error');
      return;
    }

    try {
      setReviewSubmitLoading(true);

      await dispatch(
        submitReview({
          productId: product._id,
          reviewData: { rating, comment },
        })
      ).unwrap();

      toast('Review submitted successfully!', 'success');
      setComment('');
      setShowReviewPopup(false);

      const reviewsRes = await API.get(`/reviews/${product._id}`);
      setReviews(reviewsRes.data.data);

      dispatch(fetchProductBySlug(slug));
    } catch (err) {
      toast(err || 'Failed to submit review.', 'error');
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast('Failed to copy link', 'error');
    }
  };

  if (detailLoading) return <LoadingSpinner size="lg" />;

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Product Not Found</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-md">{error || 'Unable to load this product.'}</p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const finalPrice = calculateFinalPrice();
  const uniqueSizes = [...new Set(product.productVariants?.map(v => v.size) || product.sizes?.map(s => s.size) || [])];
  const uniqueColors = [...new Set(product.productVariants?.map(v => v.color) || [])];
  const hasDiscount = appliedOffer || (product.compareAtPrice && product.compareAtPrice > product.price);
  const discountPercentage = hasDiscount
    ? appliedOffer
      ? appliedOffer.discountType === 'percentage'
        ? appliedOffer.discountValue
        : Math.round((appliedOffer.discountValue / product.price) * 100)
      : Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Modern Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <Link to="/products" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Products</Link>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* LEFT - Image Gallery */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Image Card */}
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800">
              {/* Badges */}
              <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                {discountPercentage > 0 && (
                  <span className="px-3 py-1.5 bg-rose-500 text-white text-xs font-black rounded-full uppercase tracking-wide shadow-lg">
                    -{discountPercentage}%
                  </span>
                )}
                {appliedOffer && (
                  <span className="px-3 py-1.5 bg-amber-500 text-white text-xs font-black rounded-full uppercase tracking-wide shadow-lg flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Offer
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
                <button
                  onClick={handleCopyLink}
                  className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:scale-110 transition-all group"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-slate-900" />
                  )}
                </button>
              </div>

              {/* Image */}
              <div className="aspect-square relative bg-slate-50 dark:bg-slate-950">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 border-t-yellow-500 rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={resolveImage(activeImage)}
                  alt={product.name}
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                />
              </div>

              {/* Mobile Quick Add - Floating */}
              <div className="lg:hidden absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/60 to-transparent">
                <button
                  onClick={handleAddToCart}
                  disabled={activeStock === 0}
                  className="w-full py-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xl flex items-center justify-center gap-2 hover:bg-yellow-500 hover:text-white transition-all disabled:opacity-40"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {activeStock > 0 ? 'Add to Cart' : 'Sold Out'}
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden transition-all duration-300 ${activeImage === img
                        ? 'ring-2 ring-yellow-500 ring-offset-2 dark:ring-offset-slate-900 scale-105'
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                  >
                    <img
                      src={resolveImage(img)}
                      alt="thumb"
                      className="w-full h-full object-cover"
                    />
                    {activeImage === img && (
                      <div className="absolute inset-0 bg-yellow-500/10" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT - Product Info */}
          <div className="lg:col-span-5">
            <div ref={infoRef} className="lg:sticky lg:top-8 space-y-6">

              {/* Category & Share */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 px-3 py-1.5 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {product.category?.name}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Product Name */}
              <div className="space-y-4">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white">
                  {product.name}
                </h1>

                {/* Ratings Summary */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 transition-all ${i <= Math.round(product.ratings)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 dark:text-slate-700'
                          }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-slate-900 dark:text-white">{product.ratings}</span>
                    <span className="text-slate-400">({product.numOfReviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Price Card */}
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-end gap-4 flex-wrap">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white">
                      ₹{finalPrice.toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xl text-slate-400 line-through">
                        ₹{(product.compareAtPrice || product.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {activeStock > 0 ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Offer Banner */}
                {appliedOffer && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 p-5 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-80">Limited Time Offer</p>
                        <h4 className="font-bold text-lg mt-1">{appliedOffer.title}</h4>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-80">Ends In</p>
                        <CountdownTimer targetDate={appliedOffer.endDate} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-slate dark:prose-invert">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Variants */}
              <div className="space-y-5">
                {/* Colors */}
                {uniqueColors.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400">
                      Color: <span className="text-slate-900 dark:text-white ml-1">{selectedColor || 'Select'}</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {uniqueColors.map(color => {
                        const colorVariants = product.productVariants?.filter(v => v.color === color) || [];
                        const allOOS = colorVariants.length > 0 && colorVariants.every(v => v.stock <= 0);
                        const hasInStock = colorVariants.some(v => v.stock > 0);

                        const handleColorClick = () => {
                          setSelectedColor(color);
                          if (!hasInStock) return;
                          const firstInStock = colorVariants.find(v => v.stock > 0);
                          if (firstInStock) setSelectedSize(firstInStock.size);
                        };

                        return (
                          <button
                            key={color}
                            onClick={handleColorClick}
                            disabled={!hasInStock}
                            className={`relative w-12 h-12 rounded-full border-2 transition-all duration-300 ${!hasInStock
                                ? 'border-rose-200 dark:border-rose-900 opacity-40 cursor-not-allowed'
                                : selectedColor === color
                                  ? 'border-yellow-500 scale-110 shadow-lg shadow-yellow-500/30'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-yellow-400 hover:scale-105'
                              }`}
                            style={{
                              backgroundColor: color.toLowerCase(),
                              borderColor: selectedColor === color && hasInStock ? '#D4AF37' : undefined
                            }}
                          >
                            {!hasInStock && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="w-full h-0.5 bg-rose-500 rotate-45" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {uniqueSizes.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400">
                      Size: <span className="text-slate-900 dark:text-white ml-1">{selectedSize || 'Select'}</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {uniqueSizes.map(size => {
                        const variant = product.productVariants?.find(v => v.size === size && (v.color === selectedColor || !uniqueColors.length));
                        const outOfStock = variant ? variant.stock <= 0 : false;
                        const price = variant ? variant.price : '';

                        const handleSizeClick = () => {
                          if (outOfStock) return;
                          setSelectedSize(size);
                        };

                        return (
                          <button
                            key={size}
                            onClick={handleSizeClick}
                            disabled={outOfStock}
                            className={`relative px-6 py-3 rounded-2xl text-sm font-bold border-2 transition-all duration-300 min-w-[4rem] ${outOfStock
                                ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-900 cursor-not-allowed line-through'
                                : selectedSize === size
                                  ? 'border-yellow-500 bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-yellow-400 hover:text-yellow-600'
                              }`}
                          >
                            {size}
                            {price && selectedSize !== size && (
                              <span className="block text-[10px] mt-0.5 font-black opacity-60">₹{price}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity */}
              {activeStock > 0 && (
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-slate-400">
                    Quantity
                  </label>
                  <div className="inline-flex items-center border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-16 text-center font-black text-lg">{quantity}</div>
                    <button
                      onClick={() => setQuantity((prev) => Math.min(prev + 1, activeStock))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Max {activeStock} units available
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={activeStock === 0}
                  className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {activeStock === 0 ? 'Out of Stock' : 'Add To Cart'}
                </button>

                <button
                  onClick={handleWishlistToggle}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 active:scale-95 ${isFavorited
                      ? 'border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-500 hover:border-rose-300'
                    }`}
                >
                  <Heart
                    className={`w-5 h-5 transition-all ${isFavorited ? 'fill-current scale-110' : ''}`}
                  />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <Truck className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Free Delivery</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">On orders above ₹499</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Secure Payment</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">100% protected</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <RotateCcw className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Easy Returns</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">7-day return policy</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Fast Shipping</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Dispatch within 24hrs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-12">
          {/* Tab Headers */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit mb-8">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'description'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'reviews'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'description' && (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 lg:p-12 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Product Description</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                  {product.description}
                </p>

                {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 pt-10 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Category</h4>
                    <p className="text-slate-600 dark:text-slate-400">{product.category?.name}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Availability</h4>
                    <p className={activeStock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {activeStock > 0 ? `${activeStock} units in stock` : 'Out of Stock'}
                    </p>
                  </div> 
                </div> */}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Reviews Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    Customer Reviews
                  </h2>
                  <p className="text-slate-500 mt-1 text-sm">
                    Trusted reviews from verified buyers.
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewPopup(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
                >
                  <Star className="w-4 h-4" />
                  Write a Review
                </button>
              </div>

              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* LEFT: Rating Summary */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Overall Rating Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                          {product.ratings ? product.ratings.toFixed(1) : '0.0'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i <= Math.round(product.ratings)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200 dark:text-slate-700'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {product.numOfReviews || reviews.length} ratings
                        </span>
                      </div>

                      {/* Distribution Chart */}
                      <div className="mt-6 space-y-2.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviews.filter((r) => r.rating === star).length;
                          const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-8 text-right">
                                {star}
                              </span>
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-10 text-right">
                                {count} reviews
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category Pills (Optional - showing generic attributes for demo) */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap gap-2">
                        {['Cleanliness', 'Safety & Security', 'Staff', 'Amenities', 'Location'].map((attr, idx) => {
                          const score = [4.0, 4.0, 4.0, 3.5, 3.0][idx] || 3.5;
                          return (
                            <div
                              key={attr}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            >
                              <span className="text-xs font-black text-slate-900 dark:text-white">{score.toFixed(1)}</span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{attr}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Reviews List */}
                  <div className="lg:col-span-8 space-y-6">
                    {reviews.map((rev) => (
                      <div
                        key={rev._id}
                        className={`group rounded-[2rem] p-6 transition-all duration-300 ${rev.adminResponse?.text
                            ? 'bg-gradient-to-br from-amber-50/80 to-yellow-50/50 dark:from-amber-500/5 dark:to-yellow-500/5 border-2 border-amber-200/60 dark:border-amber-500/20'
                            : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-sm font-black text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/5">
                              {rev.name?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                {rev.name}
                                <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {new Date(rev.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-black text-slate-900 dark:text-white text-sm">{rev.rating}</span>
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                          "{rev.comment}"
                        </p>

                        {/* Admin Response */}
                        {rev.adminResponse?.text && (
                          <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-500/10">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                                  <User className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                  Store Response
                                </span>
                              </div>
                              {rev.adminResponse.respondedAt && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {new Date(rev.adminResponse.respondedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {rev.adminResponse.text}
                            </p>
                            {rev.adminResponse.respondedByName && (
                              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                                — {rev.adminResponse.respondedByName}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-7 h-7 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Reviews Yet</h3>
                  <p className="text-sm text-slate-500 mt-1">Be the first to share your thoughts.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Combos Section */}
        <div className="mt-20">
          <ComboSection combos={combos} />
        </div>

         {/* Related Products */}
         {relatedProducts.length > 0 && (
           <section className="mt-20 space-y-8">
             <div className="flex items-end justify-between">
               <div>
                 <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                   You May Also Like
                 </h2>
                 <p className="text-slate-500 mt-2">
                   Explore more premium products curated for you.
                 </p>
               </div>
             </div>

             <div className="flex flex-row gap-6 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
               {relatedProducts.map((p) => (
                 <div key={p._id} className="snap-start flex-shrink-0 w-[280px]">
                   <ProductCard product={p} />
                 </div>
               ))}
             </div>
           </section>
         )}
      </div>

      {/* Review Popup Modal */}
      {showReviewPopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800">

            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Customer Reviews
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Share your shopping experience.
                </p>
              </div>
              <button
                onClick={() => setShowReviewPopup(false)}
                className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3 block">
                      Your Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRating(num)}
                          className="transition-all hover:scale-110 active:scale-95"
                        >
                          <Star
                            className={`w-10 h-10 transition-all ${num <= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 dark:text-slate-700'
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3 block">
                      Your Review
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewSubmitLoading}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {reviewSubmitLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Review
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500">Please login to write a review.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;