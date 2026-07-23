import multer from 'multer';
import path from 'path';

// Multer memory storage
const storage = multer.memoryStorage();

// File filter accepting PDFs, DOC/DOCX, PPT/PPTX, PNG/JPG/JPEG
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|doc|docx|ppt|pptx|png|jpg|jpeg/i;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || 
                   file.mimetype.startsWith('image/') || 
                   file.mimetype.includes('officedocument') || 
                   file.mimetype.includes('msword') || 
                   file.mimetype.includes('powerpoint') || 
                   file.mimetype.includes('presentation');

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, PowerPoint, or Image files are allowed.'), false);
  }
};

const maxPdfSizeMb = parseInt(process.env.MAX_PDF_UPLOAD_SIZE_MB || '100', 10);

// Create multer instance for PDF upload with configurable MB size limit
const pdfUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxPdfSizeMb * 1024 * 1024 }
}).single('pdf');

// Wrapper middleware to handle Multer errors gracefully
export const handlePdfUpload = (req, res, next) => {
  pdfUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: `File is too large. Maximum size allowed is ${maxPdfSizeMb} MB.` });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};
