import express from 'express';
import {
  getCombos,
  getComboBySlug,
  getCombosForProduct,
  createCombo,
  updateCombo,
  deleteCombo,
  getAllCombosAdmin
} from '../controllers/comboController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getCombos)
  .post(protect, adminOnly, createCombo);

router.get('/admin/all', protect, adminOnly, getAllCombosAdmin);
router.get('/product/:productId', getCombosForProduct);
router.get('/:slug', getComboBySlug);

router.route('/:id')
  .put(protect, adminOnly, updateCombo)
  .delete(protect, adminOnly, deleteCombo);

export default router;
