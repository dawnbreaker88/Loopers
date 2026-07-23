import User from '../models/User.js';
import Order from '../models/Order.js';
import UserSubscription from '../models/UserSubscription.js';
import { vapidKeys } from '../services/pushService.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    // Basic validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    let finalRole = role || 'customer';
    if (finalRole === 'admin') {
      finalRole = 'customer';
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: finalRole
    });


    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Auth user & get tokens
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, identifier, password } = req.body;
  const loginIdentifier = identifier || email;

  try {
    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password' });
    }

    // Find user by email or phone
    const user = await User.findOne({ 
      $or: [{ email: loginIdentifier }, { phone: loginIdentifier }] 
    });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if user is active/suspended
    if (user.isActive === false || user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: `Your account is currently ${user.status || 'inactive'}. Please contact support.` 
      });
    }


    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Google OAuth login/signup verification
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
  const { token, name: bodyName, email: bodyEmail, googleId: bodyGoogleId } = req.body;

  try {
    let email, name, googleId;

    if (token) {
      // Real Google Identity Services token verification
      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;
      const tokenInfoRes = await fetch(verifyUrl);

      if (!tokenInfoRes.ok) {
        return res.status(400).json({ success: false, message: 'Invalid Google authentication token' });
      }

      const payload = await tokenInfoRes.json();
      
      if (payload.error_description || !payload.email) {
        return res.status(400).json({ success: false, message: payload.error_description || 'Invalid Google token payload' });
      }

      // Verify audience matches if Client ID is configured
      const configuredClientId = process.env.GOOGLE_CLIENT_ID;
      if (configuredClientId && payload.aud !== configuredClientId) {
        return res.status(401).json({ success: false, message: 'Google authentication client ID mismatch' });
      }

      email = payload.email;
      name = payload.name;
      googleId = payload.sub;
    } else {
      // Sandbox / Simulation fallback
      // Block simulation if a real client ID is configured for safety
      if (process.env.GOOGLE_CLIENT_ID) {
        return res.status(400).json({ 
          success: false, 
          message: 'Google Sign-In simulation is disabled when GOOGLE_CLIENT_ID is configured. Please use the real Google Sign-In button.' 
        });
      }

      if (!bodyEmail || !bodyName) {
        return res.status(400).json({ success: false, message: 'Google authentication details missing' });
      }

      email = bodyEmail;
      name = bodyName;
      googleId = bodyGoogleId || `simulated_${Date.now()}`;
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create a user for first-time Google sign up
      // Generate a random password since they will authenticate via Google
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      user = await User.create({
        name,
        email,
        phone: '0000000000', // Placeholder, user can update later
        password: randomPassword,
        role: 'customer'
      });
    }

    // Check if user is active/suspended
    if (user.isActive === false || user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: `Your account is currently ${user.status || 'inactive'}. Please contact support.` 
      });
    }


    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.json({
      success: true,
      message: 'Google login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during Google Login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// @desc    Logout user (client-side handles deletion, backend records success)
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Add an address
// @route   POST /api/auth/address
// @access  Private
export const addAddress = async (req, res) => {
  const { name, phone, houseNumber, street, city, state, pincode, landmark, isDefault, latitude, longitude } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newAddress = {
      name,
      phone,
      houseNumber,
      street,
      city,
      state,
      pincode,
      landmark,
      latitude,
      longitude,
      isDefault: isDefault || false
    };

    // If setting as default, clear others
    if (newAddress.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push(newAddress);
    await user.save();

    return res.status(201).json({ success: true, message: 'Address added successfully', addresses: user.addresses });
  } catch (error) {
    console.error('Add Address Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error adding address' });
  }
};

// @desc    Update an address
// @route   PUT /api/auth/address/:addressId
// @access  Private
export const updateAddress = async (req, res) => {
  const { addressId } = req.params;
  const { name, phone, houseNumber, street, city, state, pincode, landmark, isDefault, latitude, longitude } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Update fields
    if (name !== undefined) address.name = name;
    if (phone !== undefined) address.phone = phone;
    if (houseNumber !== undefined) address.houseNumber = houseNumber;
    if (street !== undefined) address.street = street;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (pincode !== undefined) address.pincode = pincode;
    if (landmark !== undefined) address.landmark = landmark;
    if (isDefault !== undefined) address.isDefault = isDefault;
    if (latitude !== undefined) address.latitude = latitude;
    if (longitude !== undefined) address.longitude = longitude;

    // If setting as default, clear others
    if (address.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    await user.save();
    return res.json({ success: true, message: 'Address updated successfully', addresses: user.addresses });
  } catch (error) {
    console.error('Update Address Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating address' });
  }

};

// @desc    Delete an address
// @route   DELETE /api/auth/address/:addressId
// @access  Private
export const deleteAddress = async (req, res) => {
  const { addressId } = req.params;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addressToDelete = user.addresses.id(addressId);
    if (!addressToDelete) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = addressToDelete.isDefault;
    user.addresses.pull(addressId);

    // If we deleted the default address and there are remaining addresses, set the first one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return res.json({ success: true, message: 'Address deleted successfully', addresses: user.addresses });
  } catch (error) {
    console.error('Delete Address Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error deleting address' });
  }
};

// @desc    Update user location coordinates
// @route   PUT /api/auth/location
// @access  Private
export const updateUserLocation = async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide both latitude and longitude' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.location = { latitude, longitude };
    await user.save();

    if (user.role === 'admin') {
      // Propagate location update to all active orders assigned to this admin
      await Order.updateMany(
        { 
          assignedAdmin: user._id, 
          orderStatus: { $in: ['Confirmed', 'Preparing', 'Out for Delivery'] } 
        },
        { 
          $set: { 'agentLocation.lat': latitude, 'agentLocation.lng': longitude } 
        }
      );

      // Broadcast updated location to active customer tracking rooms via Socket.io
      const activeOrders = await Order.find({
        assignedAdmin: user._id,
        orderStatus: { $in: ['Confirmed', 'Preparing', 'Out for Delivery'] }
      }).populate('user', 'name email phone');

      const io = req.app.get('socketio');
      if (io) {
        activeOrders.forEach(order => {
          const userRoom = order.user._id ? order.user._id.toString() : order.user.toString();
          const orderRoom = order._id.toString();
          io.to(userRoom).emit('orderUpdated', order);
          io.to(userRoom).emit('riderLocationUpdate', {
            orderId: order._id,
            agentLocation: { lat: latitude, lng: longitude }
          });
          io.to(orderRoom).emit('riderLocationUpdate', {
            orderId: order._id,
            agentLocation: { lat: latitude, lng: longitude }
          });
        });
      }
    }

    return res.json({
      success: true,
      message: 'Location updated successfully',
      location: user.location
    });
  } catch (error) {
    console.error('Update User Location Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating location' });
  }
};


// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const { name, phone } = req.body;

  try {
    // 1. Authenticate check (done by protect middleware, but double check)
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // 2. Validate input
    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name cannot be empty' });
    }
    if (phone !== undefined && phone.trim() === '') {
      return res.status(400).json({ success: false, message: 'Phone number cannot be empty' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (req.body.email !== undefined && req.body.email.trim() !== '') user.email = req.body.email.trim();

    await user.save();


    // If delivery agent role, also update corresponding DeliveryAgent info
    if (user.role === 'delivery_agent') {
      const agent = await DeliveryAgent.findOne({ user: user._id });
      if (agent) {
        if (name !== undefined) agent.name = name.trim();
        if (phone !== undefined) agent.phone = phone.trim();
        await agent.save();
      }
    }

    const updatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses,
      status: user.status,
      isActive: user.isActive
    };

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during profile update' });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const effectiveConfirmPassword = confirmPassword !== undefined ? confirmPassword : newPassword;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all password fields' });
    }

    if (newPassword !== effectiveConfirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Compare current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    // Set new password (the pre-save hook hashes it automatically)
    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change Password Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during password change' });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Refresh token is required' });
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid token or inactive user' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// @desc    Get VAPID Public Key for Web Push
// @route   GET /api/auth/vapid-public-key
// @access  Private
export const getVapidPublicKey = async (req, res) => {
  return res.json({
    success: true,
    publicKey: vapidKeys.publicKey
  });
};

// @desc    Subscribe user for web push notifications
// @route   POST /api/auth/subscribe
// @access  Private
export const subscribePush = async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ success: false, message: 'Invalid push subscription data' });
  }

  try {
    await UserSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        user: req.user._id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'Push subscription saved' });
  } catch (error) {
    console.error('Subscribe Push Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to save push subscription' });
  }
};


