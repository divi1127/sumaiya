
import express from 'express';

const router = express.Router();

import {
  getSubCategories,
  getSubCategoriesByCategory,
  getSubCategoryById,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory
} from '../controllers/subCategoryController.js';

import { protect, adminOnly  } from '../middleware/authMiddleware.js';

router.route('/')
  .get(getSubCategories)
  .post(protect, adminOnly, addSubCategory);

router.route('/category/:categoryId')
  .get(getSubCategoriesByCategory);

router.route('/:id')
  .get(getSubCategoryById)
  .put(protect, adminOnly, updateSubCategory)
  .delete(protect, adminOnly, deleteSubCategory);
export default router;