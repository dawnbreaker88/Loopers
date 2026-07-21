import express from 'express';
import { 
  registerUser, 
  loginUser, 
  googleLogin, 
  getUserProfile, 
  logoutUser, 
  addAddress,
  updateAddress,
  deleteAddress,
  updateUserLocation,
  updateUserProfile,
  changePassword,
  refreshToken,
  getVapidPublicKey,
  subscribePush
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/google', googleLogin);

router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.post('/address', protect, addAddress);
router.put('/address/:addressId', protect, updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.put('/location', protect, updateUserLocation);
router.get('/vapid-public-key', protect, getVapidPublicKey);
router.post('/subscribe', protect, subscribePush);

export default router;
