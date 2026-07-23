import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Detects the dominant page orientation of a PDF by inspecting /MediaBox values in the binary stream.
 * @param {Buffer} buffer - The PDF file buffer.
 * @returns {String} 'Portrait' or 'Landscape'
 */
const detectOrientation = (buffer) => {
  try {
    const pdfString = buffer.toString('binary');
    const mediaBoxRegex = /\/MediaBox\s*\[\s*([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s*\]/g;
    let match;
    let portraitCount = 0;
    let landscapeCount = 0;

    while ((match = mediaBoxRegex.exec(pdfString)) !== null) {
      const width = Math.abs(parseFloat(match[3]) - parseFloat(match[1]));
      const height = Math.abs(parseFloat(match[4]) - parseFloat(match[2]));
      if (width > height) {
        landscapeCount++;
      } else {
        portraitCount++;
      }
    }

    if (landscapeCount > portraitCount) {
      return 'Landscape';
    }
    return 'Portrait';
  } catch (error) {
    return 'Portrait';
  }
};

/**
 * Formats file size in bytes to human readable format (e.g. MB, KB).
 * @param {Number} bytes - File size in bytes.
 * @returns {String} Formatted file size.
 */
const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Parses a PDF buffer and returns metadata or throws an error for invalid/encrypted/corrupted PDFs.
 * @param {Buffer} buffer - The PDF buffer.
 * @param {String} filename - Original name of the file.
 * @returns {Promise<Object>} PDF metadata { pages, size, filename, orientation }
 */
export const parsePdfBuffer = async (buffer, filename) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty PDF file.');
  }

  // Verify PDF header %PDF
  const header = buffer.slice(0, 4).toString();
  if (header !== '%PDF') {
    throw new Error('Unsupported format. Only PDF files are allowed.');
  }

  // Check for PDF encryption
  const pdfString = buffer.toString('binary');
  if (pdfString.includes('/Encrypt')) {
    throw new Error('Encrypted PDFs are not supported. Please upload a decrypted PDF.');
  }

  try {
    const data = await pdfParse(buffer);
    const pageCount = data.numpages;

    if (!pageCount || pageCount <= 0) {
      throw new Error('Zero-page or corrupted PDF file.');
    }

    const orientation = detectOrientation(buffer);
    const size = formatFileSize(buffer.length);

    return {
      pages: pageCount,
      size,
      filename,
      orientation
    };
  } catch (err) {
    if (err.message && (err.message.includes('encrypted') || err.message.includes('password'))) {
      throw new Error('Encrypted PDFs are not supported. Please upload a decrypted PDF.');
    }
    throw new Error(err.message || 'Corrupted or unreadable PDF file.');
  }
};
