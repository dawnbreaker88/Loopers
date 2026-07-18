import User from '../models/User.js';
import Order from '../models/Order.js';

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
      orderStatus: { $in: ['Placed', 'Accepted', 'Packed', 'Out For Delivery'] }
    });

    const completedOrders = await Order.countDocuments({ orderStatus: 'Completed' });

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
    
    order.orderStatus = status;
    order.trackingHistory.push({
      status,
      timestamp: new Date()
    });
    
    if (status === 'Completed' && order.paymentStatus !== 'Completed') {
        order.paymentStatus = 'Completed';
    }
    if (status === 'Cancelled' && order.paymentStatus === 'Completed') {
        order.paymentStatus = 'Refunded';
    }
    
    await order.save();

    // Populate user details for real-time views
    await order.populate('user', 'name email phone');

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
      if (status === 'Accepted') io.to(userRoom).emit('orderAccepted', order);
      if (status === 'Packed') io.to(userRoom).emit('orderPacked', order);
      if (status === 'Out For Delivery') io.to(userRoom).emit('orderOutForDelivery', order);
      if (status === 'Delivered' || status === 'Completed') io.to(userRoom).emit('orderDelivered', order);
      if (status === 'Cancelled') io.to(userRoom).emit('orderCancelled', order);
    }

    return res.json({ success: true, message: `Order marked as ${status}`, order });
  } catch (error) {
    console.error(`Update Order Status Error (${status}):`, error.message);
    return res.status(500).json({ success: false, message: 'Server error updating order' });
  }
};

export const acceptOrder = (req, res) => updateOrderStatus(req, res, 'Accepted');
export const packOrder = (req, res) => updateOrderStatus(req, res, 'Packed');
export const outForDeliveryOrder = (req, res) => updateOrderStatus(req, res, 'Out For Delivery');
export const deliverOrder = (req, res) => updateOrderStatus(req, res, 'Delivered');
export const cancelOrderAdmin = (req, res) => updateOrderStatus(req, res, 'Cancelled');
