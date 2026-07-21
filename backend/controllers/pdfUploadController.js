import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import { parsePdfBuffer } from '../utils/pdfParser.js';

// @desc    Upload PDF and parse metadata
// @route   POST /api/upload/pdf
// @access  Private
export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file provided.' });
    }

    // 1. Analyze PDF first before uploading to Cloudinary (fail early if corrupted or encrypted)
    let metadata;
    try {
      metadata = await parsePdfBuffer(req.file.buffer, req.file.originalname);
    } catch (parseError) {
      return res.status(400).json({ success: false, message: parseError.message });
    }

    // 2. Upload raw file to Cloudinary
    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'loopers/printouts',
            resource_type: 'raw',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);

    return res.status(200).json({
      success: true,
      url: cloudinaryResult.secure_url,
      metadata
    });
  } catch (error) {
    console.error('PDF upload/parse error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process PDF upload.',
    });
  }
};
