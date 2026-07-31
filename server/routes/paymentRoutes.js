import express from 'express';
import {
  getPaymentSettings,
  updatePaymentSettings,
  uploadPaymentProof,
  getPendingPaymentOrders,
  approvePayment,
  rejectPayment,
  getAllOrdersWithPayment,
  getOrderPaymentDetails,
  getPaymentStatistics,
  getRecentTransactions
} from '../controllers/paymentController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====
// Get payment settings (for checkout page)
router.get('/settings', getPaymentSettings);

// ===== CUSTOMER ROUTES (Protected) =====
// Upload payment proof
router.post(
  '/upload-proof',
  protect,
  upload.single('paymentScreenshot'),
  uploadPaymentProof
);

// ===== ADMIN ROUTES (Protected with admin check) =====

// Payment Settings Management
router.put(
  '/settings',
  protect,
  adminOnly,
  upload.single('qrCode'),
  updatePaymentSettings
);

// Orders with Payment Details
router.get('/orders/all', protect, adminOnly, getAllOrdersWithPayment);
router.get('/orders/:orderId/details', protect, getOrderPaymentDetails); // customers can view own order

// Payment Verification
router.get('/orders/pending-verification', protect, adminOnly, getPendingPaymentOrders);
router.post('/approve', protect, adminOnly, approvePayment);
router.post('/reject', protect, adminOnly, rejectPayment);

// Dashboard Statistics
router.get('/statistics', protect, adminOnly, getPaymentStatistics);
router.get('/recent-transactions', protect, adminOnly, getRecentTransactions);

export default router;
