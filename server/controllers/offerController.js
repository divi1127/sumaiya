import Offer from "../models/OfferSchema.js";

/**
 * @desc    CREATE OFFER
 * @route   POST /api/offers
 * @access  Private/Admin
 */
export const createOffer = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      type,
      value,
      status,
      startDate,
      endDate,
      applicableTo,
      applicableProducts,
      applicableCategories,
      applicableBrands,
      banner,
    } = req.body;

    if (!name || !slug || !type || !value || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields (name, slug, type, value, dates)",
      });
    }

    const safeStartDate = new Date(startDate);
    const safeEndDate = new Date(endDate);

    if (Number.isNaN(safeStartDate.getTime()) || Number.isNaN(safeEndDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid dates" });
    }

    if (safeEndDate < safeStartDate) {
      return res.status(400).json({ success: false, message: "End date cannot be before start date" });
    }

    let payload = {
      name,
      slug,
      description: description || "",
      type,
      value: Number(value),
      status: status || "Active",
      startDate: safeStartDate,
      endDate: safeEndDate,
      applicableTo: applicableTo || "sitewide",
      banner: banner || "",
    };

    if (applicableTo === "products") payload.applicableProducts = Array.isArray(applicableProducts) ? applicableProducts : [];
    if (applicableTo === "category") payload.applicableCategories = Array.isArray(applicableCategories) ? applicableCategories : [];
    if (applicableTo === "brands") payload.applicableBrands = Array.isArray(applicableBrands) ? applicableBrands : [];

    const offer = await Offer.create(payload);

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      data: offer,
    });
  } catch (error) {
    console.error("OFFER_CREATE_ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Offer with this slug already exists",
      });
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors).map((val) => val.message).join(", ");
      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    next(error);
  }
};

/**
 * @desc    GET SINGLE OFFER BY SLUG
 * @route   GET /api/offers/slug/:slug
 * @access  Public
 */
export const getOfferBySlug = async (req, res, next) => {
  try {
    const offer = await Offer.findOne({ slug: req.params.slug, status: "Active" });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found or expired",
      });
    }

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    GET ALL OFFERS
 * @route   GET /api/offers
 * @access  Private/Admin
 */
export const getOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers.map((o) => ({
        ...o.toObject(),
        title: o.name,
        discountValue: o.value,
        discountType: o.type,
        isActive: o.status === "Active",
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    GET ACTIVE OFFERS
 * @route   GET /api/offers/active
 * @access  Public
 */
export const getActiveOffers = async (req, res, next) => {
  try {
    const now = new Date();

    const offers = await Offer.find({
      status: "Active",
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: null, endDate: null },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    TOGGLE OFFER STATUS
 * @route   PUT /api/offers/:id/toggle
 * @access  Private/Admin
 */
export const toggleOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    offer.status = offer.status === "Active" ? "Inactive" : "Active";

    await offer.save();

    res.status(200).json({
      success: true,
      message: `Offer ${offer.status === "Active" ? "activated" : "deactivated"} successfully`,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    DELETE OFFER
 * @route   DELETE /api/offers/:id
 * @access  Private/Admin
 */
export const deleteOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    await offer.deleteOne();

    res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    UPDATE OFFER
 * @route   PUT /api/offers/:id
 * @access  Private/Admin
 */
export const updateOffer = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      type,
      value,
      status,
      startDate,
      endDate,
      applicableTo,
      applicableProducts,
      applicableCategories,
      applicableBrands,
      banner,
    } = req.body;

    if (!name || !slug || !type || !value || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields (name, slug, type, value, dates)",
      });
    }

    const safeStartDate = new Date(startDate);
    const safeEndDate = new Date(endDate);

    if (Number.isNaN(safeStartDate.getTime()) || Number.isNaN(safeEndDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid dates" });
    }

    if (safeEndDate < safeStartDate) {
      return res.status(400).json({ success: false, message: "End date cannot be before start date" });
    }

    const update = {
      name,
      slug,
      description: description || "",
      type,
      value: Number(value),
      status: status || "Active",
      startDate: safeStartDate,
      endDate: safeEndDate,
      applicableTo: applicableTo || "sitewide",
      banner: banner || "",
    };

    if (applicableTo === "products") update.applicableProducts = Array.isArray(applicableProducts) ? applicableProducts : [];
    if (applicableTo === "category") update.applicableCategories = Array.isArray(applicableCategories) ? applicableCategories : [];
    if (applicableTo === "brands") update.applicableBrands = Array.isArray(applicableBrands) ? applicableBrands : [];

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      data: offer,
    });
  } catch (error) {
    console.error("OFFER_UPDATE_ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Offer with this slug already exists",
      });
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    next(error);
  }
};

/**
 * @desc    GET ACTIVE OFFER FOR A PRODUCT
 * @route   GET /api/offers/product/:productId
 * @access  Public
 */
export const getProductOffer = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const now = new Date();

    const Product = (await import("../models/Product.js")).default;
    const Category = (await import("../models/Category.js")).default;

    const product = await Product.findById(productId).populate("category");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Offer.updateMany(
      { status: "Active", endDate: { $lt: now } },
      { $set: { status: "Inactive" } }
    );

    const activeOffers = await Offer.find({
      status: "Active",
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: null, endDate: null },
      ],
    })
      .populate("applicableProducts")
      .populate("applicableCategories")
      .sort({ value: -1 });

    const best = activeOffers.filter((o) => {
      const productMatch = (o.applicableProducts || []).some((entry) => entry._id?.toString() === productId.toString());
      const categoryMatch = (o.applicableCategories || []).some((entry) => {
        const catId = entry._id?.toString?.() || entry;
        return product.category && (
          product.category._id?.toString?.() === catId ||
          product.category._id === entry._id ||
          product.category._id?.toString() === catId
        );
      });
      const brandMatch = (o.applicableBrands || []).some((brand) => product.brand && brand.toLowerCase() === product.brand.toLowerCase());
      return productMatch || categoryMatch || brandMatch || o.applicableTo === "sitewide";
    })[0];

    res.status(200).json({ success: true, data: best || null });
  } catch (error) {
    next(error);
  }
};
