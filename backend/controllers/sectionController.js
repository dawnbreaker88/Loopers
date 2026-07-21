import HomeSection from '../models/HomeSection.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get active home sections (Public)
// @route   GET /api/sections
// @access  Public
export const getSections = asyncHandler(async (req, res) => {
  const sections = await HomeSection.find({ isActive: true })
    .populate({
      path: 'products',
      match: { isDeleted: { $ne: true }, isActive: { $ne: false } }
    })
    .sort({ displayOrder: 1 });

  return res.json({ success: true, count: sections.length, sections });
});

// @desc    Get all home sections (Admin)
// @route   GET /api/sections/admin
// @access  Private/Admin
export const adminGetSections = asyncHandler(async (req, res) => {
  const sections = await HomeSection.find({})
    .populate('products')
    .sort({ displayOrder: 1 });

  return res.json({ success: true, sections });
});

// @desc    Create new home section (Admin)
// @route   POST /api/sections/admin
// @access  Private/Admin
export const createSection = asyncHandler(async (req, res) => {
  const { title, displayOrder, products, isActive } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Section title is required' });
  }

  const section = await HomeSection.create({
    title,
    displayOrder: displayOrder || 0,
    products: products || [],
    isActive: isActive !== undefined ? isActive : true
  });

  return res.status(201).json({ success: true, section });
});

// @desc    Update a home section (Admin)
// @route   PUT /api/sections/admin/:id
// @access  Private/Admin
export const updateSection = asyncHandler(async (req, res) => {
  const section = await HomeSection.findById(req.params.id);

  if (!section) {
    return res.status(404).json({ success: false, message: 'Home section not found' });
  }

  const { title, displayOrder, products, isActive } = req.body;

  section.title = title || section.title;
  section.displayOrder = displayOrder !== undefined ? displayOrder : section.displayOrder;
  section.products = products || section.products;
  section.isActive = isActive !== undefined ? isActive : section.isActive;

  const updatedSection = await section.save();
  return res.json({ success: true, section: updatedSection });
});

// @desc    Delete a home section (Admin)
// @route   DELETE /api/sections/admin/:id
// @access  Private/Admin
export const deleteSection = asyncHandler(async (req, res) => {
  const section = await HomeSection.findById(req.params.id);

  if (!section) {
    return res.status(404).json({ success: false, message: 'Home section not found' });
  }

  await section.deleteOne();
  return res.json({ success: true, message: 'Home section deleted successfully' });
});
