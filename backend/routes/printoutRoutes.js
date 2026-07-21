import express from 'express';
import { calculatePrice, getCustomerPricing } from '../controllers/printoutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/calculate-price', protect, calculatePrice);
router.get('/pricing', protect, getCustomerPricing);

export default router;
