import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { v4 as uuidv4 } from 'uuid';
import { sendNewOrderNotification } from '../services/pushService.js';

// @desc    Create a new order from cart
// @route   POST /api/orders/create
// @access  Private
export const createOrder = async (req, res) => {
  const { address, paymentMethod } = req.body;

  try {
    if (!address || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Please provide address and payment method' });
    }

    // Check if customer already has an active order
    const existingActiveOrder = await Order.findOne({
      user: req.user._id,
      orderStatus: { $in: ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery'] }
    });

    if (existingActiveOrder) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active order. Please wait until it is completed before placing another order.'
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Prepare products array and check stock atomically to prevent race conditions
    const orderProducts = [];
    const reservedProducts = [];

    for (const item of cart.items) {
      const product = item.product;
      if (!product) continue;

      // Atomic decrement with stock availability condition
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback any previously reserved products in this batch
        for (const reserved of reservedProducts) {
          await Product.findByIdAndUpdate(reserved.productId, { $inc: { stock: reserved.quantity } });
        }
        return res.status(400).json({
          success: false,
          message: `Not enough stock available for ${product.name}`
        });
      }

      reservedProducts.push({ productId: product._id, quantity: item.quantity });
      const discountedPrice = product.price * (1 - (product.discount || 0) / 100);

      orderProducts.push({
        product: product._id,
        name: product.name,
        price: parseFloat(discountedPrice.toFixed(2)),
        quantity: item.quantity
      });
    }


    // Resolve Customer coordinates directly from captured address or fallback geolocations (no text-based guessing)
    let customerLat = null;
    let customerLng = null;

    if (address && address.latitude && address.longitude) {
      customerLat = Number(address.latitude);
      customerLng = Number(address.longitude);
    } else if (req.user.location && req.user.location.latitude && req.user.location.longitude) {
      customerLat = Number(req.user.location.latitude);
      customerLng = Number(req.user.location.longitude);
    }

    const deliveryCharge = 1;
    const finalTotalPrice = parseFloat((cart.totalPrice + deliveryCharge).toFixed(2));


    // Create unique payment ID for simulation if not COD
    const simulatedPaymentId = paymentMethod !== 'COD' ? `pay_${uuidv4().replace(/-/g, '').slice(0, 16)}` : null;
    const paymentStatus = paymentMethod !== 'COD' ? 'Completed' : 'Pending';

    // Create order
    const order = await Order.create({
      user: req.user._id,
      products: orderProducts,
      totalPrice: finalTotalPrice,
      address: {
        name: address.name,
        phone: address.phone,
        houseNumber: address.houseNumber,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark,
        latitude: customerLat,
        longitude: customerLng
      },

      paymentMethod,
      paymentStatus,
      paymentId: simulatedPaymentId,
      orderStatus: 'Order Placed',
      customerLocation: { lat: customerLat, lng: customerLng },
      deliveryCharge,

      trackingHistory: [
        {
          status: 'Order Placed',
          lat: customerLat,
          lng: customerLng,
          timestamp: new Date()
        }
      ]
    });

    // Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    console.log(`[ORDER] Order Saved: ${order._id}`);

    // Populate user details for real-time admin view
    await order.populate('user', 'name email phone');

    // Emit socket event to admin room
    const io = req.app.get('socketio');
    if (io) {
      io.to('admin').emit('new-order', order);
      console.log(`[ORDER] Socket Event 'new-order' Emitted to room 'admin' for order: ${order._id}`);
    }

    // Trigger Web Push Notification MVP for Admins in background
    sendNewOrderNotification(order).catch((err) => {
      console.error('[Order Controller Alert] Web Push notification broadcast error:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully and is being dispatched',
      order
    });
  } catch (error) {
    console.error('Create Order Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error placing order' });
  }
};

// @desc    Get user orders (Scoped by role)
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
  try {
    let orders = [];

    if (req.user.role === 'admin') {
      // Admin gets all orders
      orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    } else {
      // Customer gets their own orders
      orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    }

    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get Orders Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization: only the order placing customer or admin can read it
    const orderUserId = order.user?._id ? order.user._id.toString() : order.user?.toString();
    const isCustomer = orderUserId === req.user._id.toString();
    const isAdminUser = req.user.role === 'admin';

    if (!isCustomer && !isAdminUser) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }


    return res.json({ success: true, order });
  } catch (error) {
    console.error('Get Order ID Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching order details' });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    // Check if order can be cancelled (Only in early stages)
    const nonCancellable = ['Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (nonCancellable.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in status: ${order.orderStatus}`
      });
    }

    // Refund inventory stock atomically
    for (const item of order.products) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }


    // No delivery agent to release

    order.orderStatus = 'Cancelled';
    order.paymentStatus = order.paymentStatus === 'Completed' ? 'Refunded' : order.paymentStatus;
    await order.save();

    await order.populate('user', 'name email phone');

    // Emit socket event to admin and user rooms
    const io = req.app.get('socketio');
    if (io) {
      const userRoom = order.user._id ? order.user._id.toString() : order.user.toString();
      io.to('admin').emit('orderUpdated', order);
      io.to(userRoom).emit('orderUpdated', order);
      io.to(userRoom).emit('orderCancelled', order);
    }

    console.log(`Order cancelled successfully: ${orderId}`);

    return res.json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel Order Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error cancelling order' });
  }
};

// @desc    Rate an order/agent
// @route   POST /api/orders/:id/rate
// @access  Private
export const rateOrder = async (req, res) => {
  const { experienceRating } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to rate this order' });
    }

    order.ratings = {
      experienceRating
    };
    await order.save();

    return res.json({ success: true, message: 'Ratings saved successfully', order });
  } catch (error) {
    console.error('Rate Order Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error rating order' });
  }
};
