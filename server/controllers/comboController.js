import ComboOffer from '../models/ComboOffer.js';
import Product from '../models/Product.js';
import AdminActivityLog from '../models/AdminActivityLog.js';

// @desc    Get all combo offers
// @route   GET /api/combos
// @access  Public
export const getCombos = async (req, res, next) => {
  try {
    const combos = await ComboOffer.find().populate('products', 'name slug images price compareAtPrice productVariants isFeatured');
    
    // Filter active combos
    const activeCombos = combos.filter(combo => {
      if (combo.status !== 'Active') return false;
      const now = new Date();
      if (combo.startDate && combo.startDate > now) return false;
      if (combo.endDate && combo.endDate < now) return false;
      return true;
    });

    res.json({
      success: true,
      data: activeCombos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get combo by slug
// @route   GET /api/combos/:slug
// @access  Public
export const getComboBySlug = async (req, res, next) => {
  try {
    const combo = await ComboOffer.findOne({ comboSlug: req.params.slug })
      .populate('products', 'name slug images price compareAtPrice productVariants sizes colorImages stock brand');

    if (!combo) {
      res.status(404);
      throw new Error('Combo offer not found');
    }

    res.json({
      success: true,
      data: combo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get combos for a specific product
// @route   GET /api/combos/product/:productId
// @access  Public
export const getCombosForProduct = async (req, res, next) => {
  try {
    const combos = await ComboOffer.find({ products: req.params.productId, status: 'Active' })
      .populate('products', 'name slug images price compareAtPrice productVariants sizes stock brand');

    const now = new Date();
    const activeCombos = combos.filter(combo => {
      if (combo.startDate && combo.startDate > now) return false;
      if (combo.endDate && combo.endDate < now) return false;
      return true;
    });

    res.json({
      success: true,
      data: activeCombos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a combo offer
// @route   POST /api/combos
// @access  Private/Admin
export const createCombo = async (req, res, next) => {
  try {
    const combo = await ComboOffer.create(req.body);

    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'ADD_COMBO',
      details: `Created combo offer: ${combo.comboName}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: combo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a combo offer
// @route   PUT /api/combos/:id
// @access  Private/Admin
export const updateCombo = async (req, res, next) => {
  try {
    const combo = await ComboOffer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!combo) {
      res.status(404);
      throw new Error('Combo offer not found');
    }

    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'UPDATE_COMBO',
      details: `Updated combo offer: ${combo.comboName}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: combo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a combo offer
// @route   DELETE /api/combos/:id
// @access  Private/Admin
export const deleteCombo = async (req, res, next) => {
  try {
    const combo = await ComboOffer.findByIdAndDelete(req.params.id);

    if (!combo) {
      res.status(404);
      throw new Error('Combo offer not found');
    }

    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'DELETE_COMBO',
      details: `Deleted combo offer: ${combo.comboName}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Combo offer removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all combos (admin list)
// @route   GET /api/combos/admin/all
// @access  Private/Admin
export const getAllCombosAdmin = async (req, res, next) => {
  try {
    const combos = await ComboOffer.find().populate('products', 'name price stock');
    res.json({
      success: true,
      data: combos
    });
  } catch (error) {
    next(error);
  }
};
