import express from 'express';
import { getBanners, adminGetBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';
import { protect, isAdmin } from '../middleware/auth.js';
import { validate, idParamSchema } from '../middleware/validate.js';

const router = express.Router();

router.get('/', getBanners);

// Admin-only routes
router.get('/admin', protect, isAdmin, adminGetBanners);
router.post('/admin', protect, isAdmin, createBanner);
router.put('/admin/:id', protect, isAdmin, validate(idParamSchema), updateBanner);
router.delete('/admin/:id', protect, isAdmin, validate(idParamSchema), deleteBanner);

export default router;
