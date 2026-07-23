import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { uploadSingleImage, uploadBannerImage } from '../middleware/upload.js';
import { uploadPdf } from '../controllers/pdfUploadController.js';
import { handlePdfUpload } from '../middleware/pdfUpload.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Route: POST /api/upload/image
// Access: Private/Admin
router.post('/image', protect, isAdmin, uploadSingleImage, uploadImage);

// Route: POST /api/upload/banner
// Access: Private/Admin
router.post('/banner', protect, isAdmin, uploadBannerImage, uploadImage);

// Route: POST /api/upload/pdf
// Access: Private (All authenticated customers/admins can upload their files to print)
router.post('/pdf', protect, handlePdfUpload, uploadPdf);

export default router;
