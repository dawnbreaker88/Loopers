import express from 'express';
import { getPricing, updatePricing } from '../controllers/pricingController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getPricing)
  .put(protect, isAdmin, updatePricing);

export default router;
