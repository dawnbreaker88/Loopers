import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import { parsePdfBuffer } from '../utils/pdfParser.js';

// @desc    Upload PDF and parse metadata
// @route   POST /api/upload/pdf
// @access  Private
export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }

    const isPdf = req.file.originalname.toLowerCase().endsWith('.pdf');
    let metadata;

    if (isPdf) {
      // Analyze PDF first before uploading to Cloudinary
      try {
        metadata = await parsePdfBuffer(req.file.buffer, req.file.originalname);
      } catch (parseError) {
        return res.status(400).json({ success: false, message: parseError.message });
      }
    } else {
      // Fallback metadata for image/word/powerpoint files
      const bytes = req.file.buffer.length;
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k)) || 0;
      const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      
      metadata = {
        pages: 1,
        size: formattedSize,
        filename: req.file.originalname,
        orientation: 'Portrait'
      };
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
