import express from 'express';
import {
  addReview,
  deleteReview,
  getProductReviews,
  getUserReviews,
  getAllReviewsAdmin,
  adminRespondToReview,
  adminDeleteResponse
} from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/user/my', protect, getUserReviews);

router.route('/:productId')
  .get(getProductReviews)
  .post(protect, addReview);

router.delete('/delete/:reviewId', protect, deleteReview);

// Admin review management
router.get('/admin/all', protect, adminOnly, getAllReviewsAdmin);
router.put('/admin/:reviewId/respond', protect, adminOnly, adminRespondToReview);
router.delete('/admin/:reviewId/respond', protect, adminOnly, adminDeleteResponse);

export default router;
