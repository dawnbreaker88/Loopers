import multer from 'multer';
import path from 'path';

// Multer memory storage
const storage = multer.memoryStorage();

// File filter accepting only PDFs
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF (.pdf) documents are allowed.'), false);
  }
};

// Create multer instance for PDF upload with 100 MB size limit
const pdfUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
}).single('pdf');

// Wrapper middleware to handle Multer errors gracefully
export const handlePdfUpload = (req, res, next) => {
  pdfUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File is too large. Maximum size allowed is 100 MB.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};
