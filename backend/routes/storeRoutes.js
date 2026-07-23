import express from 'express';
import { getStoreStatus, updateStoreStatus } from '../controllers/storeController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/status', getStoreStatus);
router.put('/admin/status', protect, isAdmin, updateStoreStatus);

export default router;
