import Review from '../models/Review.js';
import Product from '../models/Product.js';

// @desc    Add review to a product
// @route   POST /api/reviews/:productId
// @access  Private
export const addReview = async (req, res, next) => {
  const { rating, comment } = req.body;
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id
    });

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('You have already reviewed this product. You can update or delete it.');
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment
    });

    // Recalculate average ratings
    const reviews = await Review.find({ product: productId });
    product.numOfReviews = reviews.length;
    product.ratings = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    
    // Round ratings to 1 decimal place
    product.ratings = Math.round(product.ratings * 10) / 10;

    await product.save();

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name')
      .populate('adminResponse.respondedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: populatedReview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this review');
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.reviewId);

    const product = await Product.findById(productId);
    if (product) {
      const reviews = await Review.find({ product: productId });
      product.numOfReviews = reviews.length;
      if (reviews.length > 0) {
        product.ratings = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
        product.ratings = Math.round(product.ratings * 10) / 10;
      } else {
        product.ratings = 0;
      }
      await product.save();
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .populate('adminResponse.respondedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews by logged in user
// @route   GET /api/reviews/user/my
// @access  Private
export const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name slug images')
      .populate('adminResponse.respondedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const { search, rating, product, sort = '-createdAt', page = 1, limit = 10 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
        { 'adminResponse.text': { $regex: search, $options: 'i' } }
      ];
    }

    if (rating) {
      query.rating = Number(rating);
    }

    if (product) {
      query.product = product;
    }

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name slug images')
      .populate('adminResponse.respondedBy', 'name')
      .sort({ [sort.startsWith('-') ? sort.slice(1) : sort]: sort.startsWith('-') ? -1 : 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin add/update response to a review
// @route   PUT /api/reviews/admin/:reviewId/respond
// @access  Private/Admin
export const adminRespondToReview = async (req, res, next) => {
  try {
    const { responseText } = req.body;

    if (!responseText || !responseText.trim()) {
      res.status(400);
      throw new Error('Response text is required');
    }

    const review = await Review.findById(req.params.reviewId).populate('product', 'name slug');

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    review.adminResponse = {
      text: responseText.trim(),
      respondedBy: req.user._id,
      respondedByName: req.user.name,
      respondedAt: new Date()
    };

    await review.save();

    const updatedReview = await Review.findById(review._id)
      .populate('user', 'name email')
      .populate('product', 'name slug images')
      .populate('adminResponse.respondedBy', 'name');

    res.json({
      success: true,
      message: 'Admin response saved successfully',
      data: updatedReview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin delete response from a review
// @route   DELETE /api/reviews/admin/:reviewId/respond
// @access  Private/Admin
export const adminDeleteResponse = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    review.adminResponse = {
      text: '',
      respondedBy: null,
      respondedByName: '',
      respondedAt: null
    };

    await review.save();

    res.json({
      success: true,
      message: 'Admin response removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
