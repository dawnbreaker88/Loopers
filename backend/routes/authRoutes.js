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
  subscribePush,
  unsubscribePush
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { 
  validate, 
  registerSchema, 
  loginSchema, 
  addressSchema, 
  addressIdParamSchema 
} from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/refresh', refreshToken);
router.post('/google', googleLogin);

router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.post('/address', protect, validate(addressSchema), addAddress);
router.put('/address/:addressId', protect, validate(addressIdParamSchema), validate(addressSchema), updateAddress);
router.delete('/address/:addressId', protect, validate(addressIdParamSchema), deleteAddress);
router.put('/location', protect, updateUserLocation);
router.get('/vapid-public-key', protect, getVapidPublicKey);
router.post('/subscribe', protect, subscribePush);
router.post('/unsubscribe', protect, unsubscribePush);

export default router;
