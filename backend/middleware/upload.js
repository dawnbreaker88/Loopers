import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif/;
  const allowedMimeTypes = /image\/jpeg|image\/png|image\/webp|image\/gif/;

  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(new Error('Invalid file type. Only JPG, JPEG, PNG, WEBP, and GIF images are allowed.'), false);
  }
};

export const uploadSingleImage = (req, res, next) => {
  const maxImageSizeMb = parseInt(process.env.MAX_IMAGE_UPLOAD_SIZE_MB || '5', 10);
  const upload = multer({
    storage,
    limits: { fileSize: maxImageSizeMb * 1024 * 1024 }, // MB limit
    fileFilter,
  }).single('image');

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: `File is too large. Maximum size is ${maxImageSizeMb} MB.` });
      }
      return res.status(400).json({ success: false, message: `Multer upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

export const uploadBannerImage = (req, res, next) => {
  const maxBannerSizeMb = parseInt(process.env.MAX_BANNER_UPLOAD_SIZE_MB || '20', 10);
  const bannerFileFilter = (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|webp/;
    const allowedMimeTypes = /image\/jpeg|image\/png|image\/webp/;

    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.'), false);
    }
  };

  const upload = multer({
    storage,
    limits: { fileSize: maxBannerSizeMb * 1024 * 1024 }, // MB limit
    fileFilter: bannerFileFilter,
  }).single('image');

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: `File is too large. Maximum size is ${maxBannerSizeMb} MB.` });
      }
      return res.status(400).json({ success: false, message: `Multer upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};
