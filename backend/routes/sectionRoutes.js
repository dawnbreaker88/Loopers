import express from 'express';
import { getSections, adminGetSections, createSection, updateSection, deleteSection } from '../controllers/sectionController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getSections);

// Admin-only routes
router.get('/admin', protect, isAdmin, adminGetSections);
router.post('/admin', protect, isAdmin, createSection);
router.put('/admin/:id', protect, isAdmin, updateSection);
router.delete('/admin/:id', protect, isAdmin, deleteSection);


export default router;
