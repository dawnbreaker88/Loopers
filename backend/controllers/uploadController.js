import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

/**
 * @desc    Upload product image to Cloudinary
 * @route   POST /api/upload/image
 * @access  Private/Admin
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    const folderParam = req.query.folder || req.body.folder || 'uploads';
    const cloudinaryFolder = `loopers/${folderParam}`;

    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: cloudinaryFolder,
            resource_type: 'image',
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

    const result = await uploadToCloudinary(req.file.buffer);

    return res.status(200).json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image to Cloudinary.',
    });
  }
};
