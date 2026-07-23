import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AdminSubscription from '../models/AdminSubscription.js';
import { vapidKeys, sendCustomerOrderNotification } from '../services/pushService.js';
import { validateStatusTransition } from '../utils/orderStateMachine.js';

// @desc    Get all users

// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Get All Users Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving users' });
  }
};

// @desc    Update user status / activation
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
  const { status, isActive } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (status !== undefined) {
      user.status = status;
      if (status === 'suspended' || status === 'deactivated') {
        user.isActive = false;
      } else if (status === 'active') {
        user.isActive = true;
      }
    }
    if (isActive !== undefined) {
      user.isActive = isActive;
      if (!isActive && user.status === 'active') {
        user.status = 'deactivated';
      } else if (isActive && user.status !== 'active') {
        user.status = 'active';
      }
    }

    await user.save();
    return res.json({ success: true, message: 'User status updated successfully', user });
  } catch (error) {
    console.error('Update User Status Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating user status' });
  }
};



// @desc    Get admin analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAdminAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    
    const activeOrders = await Order.countDocuments({
      orderStatus: { $in: ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery'] }
    });

    const completedOrders = await Order.countDocuments({ orderStatus: 'Delivered' });

    // Aggregate revenues and delivery charges
    const revenueResult = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, totalDeliveryCharge: { $sum: '$deliveryCharge' } } }
    ]);

    const revenue = revenueResult[0] ? revenueResult[0].totalRevenue : 0;
    const deliveryCharges = revenueResult[0] ? revenueResult[0].totalDeliveryCharge : 0;

    return res.json({
      success: true,
      analytics: {
        totalOrders,
        activeOrders,
        completedOrders,
        revenue,
        deliveryCharges
      }
    });
  } catch (error) {
    console.error('Get Analytics Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving analytics' });
  }
};

// Add order transition handlers
const updateOrderStatus = async (req, res, status) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const previousStatus = order.orderStatus;

    // Validate order status transition with state machine
    try {
      validateStatusTransition(order.orderStatus, status);
    } catch (valErr) {
      return res.status(valErr.statusCode || 400).json({ success: false, message: valErr.message });
    }

    // Refund stock if admin cancels an order
    if (status === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      for (const item of order.products) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
      }
    }

    order.orderStatus = status;

    try {
      const adminUser = await User.findById(req.user._id);
      if (adminUser) {
        order.assignedAdmin = adminUser._id;
        order.adminDetails = {
          name: adminUser.name,
          phone: adminUser.phone
        };
        if (adminUser.location && adminUser.location.latitude && adminUser.location.longitude) {
          order.agentLocation = {
            lat: Number(adminUser.location.latitude),
            lng: Number(adminUser.location.longitude)
          };
        } else {
          order.agentLocation = null;
        }
      }
    } catch (err) {
      console.error('Failed to assign admin details:', err.message);
    }

    order.trackingHistory.push({
      status,
      lat: order.agentLocation?.lat || null,
      lng: order.agentLocation?.lng || null,
      timestamp: new Date()
    });

    
    if (status === 'Delivered' && order.paymentStatus !== 'Completed') {
        order.paymentStatus = 'Completed';
    }
    if (status === 'Cancelled' && order.paymentStatus === 'Completed') {
        order.paymentStatus = 'Refunded';
    }
    
    await order.save();

    // Populate user details for real-time views
    await order.populate('user', 'name email phone');

    // Trigger Web Push Notification to Customer if transitioning from 'Order Placed' (Pending) to 'Confirmed' or 'Preparing'
    if (previousStatus === 'Order Placed' && (status === 'Confirmed' || status === 'Preparing')) {
      sendCustomerOrderNotification(order, 'ORDER_ACCEPTED').catch(err => {
        console.error('Failed to send order acceptance customer push:', err.message);
      });
    } else if (['Out for Delivery', 'Delivered', 'Cancelled'].includes(status) && previousStatus !== status) {
      sendCustomerOrderNotification(order, status).catch(err => {
        console.error('Failed to send status push notification:', err.message);
      });
    }

    // Emit socket events
    const io = req.app.get('socketio');
    if (io) {
      const userRoom = order.user._id ? order.user._id.toString() : order.user.toString();

      // Emit to admin room
      io.to('admin').emit('orderUpdated', order);

      // Emit to user room
      io.to(userRoom).emit('orderUpdated', order);
      io.to(userRoom).emit('order-status-update', {
        orderId: order._id,
        status: status
      });

      // Emit specific status events
      if (status === 'Confirmed') io.to(userRoom).emit('orderAccepted', order);
      if (status === 'Printing') io.to(userRoom).emit('orderPrinting', order);
      if (status === 'Preparing') io.to(userRoom).emit('orderPacked', order);
      if (status === 'Out for Delivery') io.to(userRoom).emit('orderOutForDelivery', order);
      if (status === 'Delivered') io.to(userRoom).emit('orderDelivered', order);
      if (status === 'Cancelled') io.to(userRoom).emit('orderCancelled', order);
    }

    return res.json({ success: true, message: `Order marked as ${status}`, order });
  } catch (error) {
    console.error(`Update Order Status Error (${status}):`, error.message);
    return res.status(500).json({ success: false, message: 'Server error updating order' });
  }
};

export const acceptOrder = (req, res) => updateOrderStatus(req, res, 'Confirmed');
export const printOrder = (req, res) => updateOrderStatus(req, res, 'Printing');
export const packOrder = (req, res) => updateOrderStatus(req, res, 'Preparing');
export const outForDeliveryOrder = (req, res) => updateOrderStatus(req, res, 'Out for Delivery');
export const deliverOrder = (req, res) => updateOrderStatus(req, res, 'Delivered');
export const cancelOrderAdmin = (req, res) => updateOrderStatus(req, res, 'Cancelled');

// @desc    Get VAPID Public Key for web push subscription
// @route   GET /api/admin/vapid-public-key
// @access  Private/Admin
export const getVapidPublicKey = async (req, res) => {
  try {
    return res.json({ success: true, publicKey: vapidKeys.publicKey });
  } catch (error) {
    console.error('Get Vapid Public Key Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving VAPID keys' });
  }
};

// @desc    Subscribe admin user for push notifications
// @route   POST /api/admin/subscribe
// @access  Private/Admin
export const subscribeAdmin = async (req, res) => {
  const { subscription } = req.body;

  try {
    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ success: false, message: 'Invalid subscription payload' });
    }

    // Save or update subscription
    const updatedSub = await AdminSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        admin: req.user._id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({ success: true, message: 'Subscription saved successfully', subscription: updatedSub });
  } catch (error) {
    console.error('Subscribe Admin Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error saving subscription' });
  }
};

// @desc    Unsubscribe admin user from push notifications
// @route   POST /api/admin/unsubscribe
// @access  Private/Admin
export const unsubscribeAdmin = async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ success: false, message: 'Endpoint is required' });
  }

  try {
    await AdminSubscription.deleteOne({ endpoint, admin: req.user._id });
    return res.status(200).json({ success: true, message: 'Admin subscription removed successfully' });
  } catch (error) {
    console.error('Unsubscribe Admin Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error removing subscription' });
  }
};

