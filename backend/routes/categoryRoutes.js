import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protect, isAdmin, createCategory);

router.route('/:id')
  .put(protect, isAdmin, updateCategory)
  .delete(protect, isAdmin, deleteCategory);

export default router;
