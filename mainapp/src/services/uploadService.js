import axios from 'axios';
import api from './api.js';

/**
 * Uploads an image to the backend server.
 * Supports progress tracking and cancellation to prevent resource leaks/slow-network issues.
 * 
 * @param {File} file - The file to upload.
 * @param {Function} onUploadProgress - Callback for tracking progress percentage.
 * @param {CancelToken} cancelToken - Axios cancel token for aborting the upload.
 * @returns {Promise<Object>} The server response data.
 */
export const uploadImage = async (file, onUploadProgress, cancelToken, folder) => {
  const formData = new FormData();
  formData.append('image', file);
  if (folder) {
    formData.append('folder', folder);
  }

  const url = folder ? `/api/upload/image?folder=${encodeURIComponent(folder)}` : '/api/upload/image';

  const response = await api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    cancelToken,
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

/**
 * Creates a source for canceling requests.
 * @returns {CancelTokenSource} The cancel token source.
 */
export const createCancelTokenSource = () => {
  return axios.CancelToken.source();
};
