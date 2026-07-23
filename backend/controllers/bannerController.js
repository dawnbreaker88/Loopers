import Banner from '../models/Banner.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get active banners (Public)
// @route   GET /api/banners
// @access  Public
export const getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ displayOrder: 1 });
  return res.json({ success: true, count: banners.length, banners });
});

// @desc    Get all banners (Admin)
// @route   GET /api/banners/admin
// @access  Private/Admin
export const adminGetBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({}).sort({ displayOrder: 1 });
  return res.json({ success: true, banners });
});

// @desc    Create new banner (Admin)
// @route   POST /api/banners/admin
// @access  Private/Admin
export const createBanner = asyncHandler(async (req, res) => {
  const { image, altText, redirectType, redirectTarget, displayOrder, isActive } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, message: 'Banner image URL is required' });
  }

  const banner = await Banner.create({
    image,
    altText: altText || 'Promotional Banner',
    redirectType: redirectType || 'none',
    redirectTarget: redirectTarget || '',
    displayOrder: displayOrder || 0,
    isActive: isActive !== undefined ? isActive : true
  });

  return res.status(201).json({ success: true, banner });
});

// @desc    Update a banner (Admin)
// @route   PUT /api/banners/admin/:id
// @access  Private/Admin
export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return res.status(404).json({ success: false, message: 'Banner not found' });
  }

  const { image, altText, redirectType, redirectTarget, displayOrder, isActive } = req.body;

  banner.image = image || banner.image;
  banner.altText = altText !== undefined ? altText : banner.altText;
  banner.redirectType = redirectType || banner.redirectType;
  banner.redirectTarget = redirectTarget !== undefined ? redirectTarget : banner.redirectTarget;
  banner.displayOrder = displayOrder !== undefined ? displayOrder : banner.displayOrder;
  banner.isActive = isActive !== undefined ? isActive : banner.isActive;

  const updatedBanner = await banner.save();
  return res.json({ success: true, banner: updatedBanner });
});

// @desc    Delete a banner (Admin)
// @route   DELETE /api/banners/admin/:id
// @access  Private/Admin
export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return res.status(404).json({ success: false, message: 'Banner not found' });
  }

  await banner.deleteOne();
  return res.json({ success: true, message: 'Banner deleted successfully' });
});
