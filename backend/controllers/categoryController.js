import Category from '../models/Category.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.all !== 'true') {
    filter.isActive = true;
  }
  const categories = await Category.find(filter).sort({ name: 1 });
  return res.json({ success: true, count: categories.length, categories });
});


// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;

  if (!name) {
    throw new AppError('Category name is required', 400);
  }

  const existing = await Category.findOne({ name });
  if (existing) {
    throw new AppError('Category with this name already exists', 400);
  }

  const category = await Category.create({ name, description, icon });
  return res.status(201).json({ success: true, message: 'Category created', category });
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return res.json({ success: true, message: 'Category updated', category });
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return res.json({ success: true, message: 'Category deleted' });
});
