import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import DeliveryAgent from '../models/DeliveryAgent.js';
import { assignNearestAgent } from '../services/dispatchService.js';
import { v4 as uuidv4 } from 'uuid';

// @desc    Create a new order from cart
// @route   POST /api/orders/create
// @access  Private
export const createOrder = async (req, res) => {
  const { address, paymentMethod } = req.body;

  try {
    if (!address || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Please provide address and payment method' });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Prepare products array and check stock
    const orderProducts = [];
    for (const item of cart.items) {
      const product = item.product;
      if (!product) continue;

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Not enough stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      // Decrement stock
      product.stock -= item.quantity;
      await product.save();

      const discountedPrice = product.price * (1 - (product.discount || 0) / 100);

      orderProducts.push({
        product: product._id,
        name: product.name,
        price: discountedPrice,
        quantity: item.quantity
      });
    }

    // Get user location or default
    const customerLat = req.user.location && req.user.location.latitude ? req.user.location.latitude : 12.9780;
    const customerLng = req.user.location && req.user.location.longitude ? req.user.location.longitude : 77.6400;

    // Check if order contains fast food
    const hasFastFood = cart.items.some(item => item.product && item.product.category === 'Fast Food');
    let storeLat, storeLng;
    if (hasFastFood) {
      storeLat = customerLat + 0.015;
      storeLng = customerLng + 0.015;
    } else {
      storeLat = customerLat - 0.012;
      storeLng = customerLng - 0.012;
    }

    // Calculate distance and delivery charge
    const { calculateDistance } = await import('../services/dispatchService.js');
    const distance = calculateDistance(storeLat, storeLng, customerLat, customerLng);
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
      address,
      paymentMethod,
      paymentStatus,
      paymentId: simulatedPaymentId,
      orderStatus: 'Order Confirmed',
      storeLocation: { lat: storeLat, lng: storeLng },
      customerLocation: { lat: customerLat, lng: customerLng },
      distance: parseFloat(distance.toFixed(2)),
      deliveryCharge,
      trackingHistory: [
        {
          status: 'Order Confirmed',
          lat: storeLat,
          lng: storeLng,
          timestamp: new Date()
        }
      ]
    });

    // Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    console.log(`Order created successfully: ${order._id}`);

    // Trigger dispatcher agent assignment asynchronously
    assignNearestAgent(order._id);

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
      orders = await Order.find({}).populate('user', 'name email').populate('deliveryAgent').sort({ createdAt: -1 });
    } else if (req.user.role === 'delivery_agent') {
      // Find the agent record first
      const agent = await DeliveryAgent.findOne({ user: req.user._id });
      if (agent) {
        orders = await Order.find({ deliveryAgent: agent._id }).populate('user', 'name email phone').sort({ createdAt: -1 });
      }
    } else {
      // Customer gets their own orders
      orders = await Order.find({ user: req.user._id }).populate('deliveryAgent').sort({ createdAt: -1 });
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
      .populate('user', 'name email phone')
      .populate('deliveryAgent');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization: only the order placing customer, assigned agent, or admin can read it
    const isCustomer = order.user._id.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === 'admin';
    
    let isAssignedAgent = false;
    if (req.user.role === 'delivery_agent' && order.deliveryAgent) {
      const agent = await DeliveryAgent.findOne({ user: req.user._id });
      if (agent && order.deliveryAgent._id.toString() === agent._id.toString()) {
        isAssignedAgent = true;
      }
    }

    if (!isCustomer && !isAdminUser && !isAssignedAgent) {
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
    const order = await Order.findById(orderId).populate('deliveryAgent');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    // Check if order can be cancelled (Only in early stages)
    const nonCancellable = ['Picked Up', 'On The Way', 'Near You', 'Delivered', 'Cancelled'];
    if (nonCancellable.includes(order.orderStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Order cannot be cancelled in status: ${order.orderStatus}` 
      });
    }

    // Refund inventory stock
    for (const item of order.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Release delivery agent if assigned
    if (order.deliveryAgent) {
      const agent = await DeliveryAgent.findById(order.deliveryAgent._id);
      if (agent) {
        agent.isAvailable = true;
        await agent.save();
      }
    }

    order.orderStatus = 'Cancelled';
    order.paymentStatus = order.paymentStatus === 'Completed' ? 'Refunded' : order.paymentStatus;
    await order.save();

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
  const { agentRating, agentReview, experienceRating } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to rate this order' });
    }

    order.ratings = {
      agentRating,
      agentReview,
      experienceRating
    };
    await order.save();

    // If rated agent, update agent cumulative rating
    if (order.deliveryAgent && agentRating) {
      const agent = await DeliveryAgent.findById(order.deliveryAgent);
      if (agent) {
        const currentCount = agent.ratingsCount || 0;
        const currentRating = agent.rating || 5.0;
        
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + agentRating) / newCount;

        agent.ratingsCount = newCount;
        agent.rating = Math.round(newRating * 10) / 10;
        await agent.save();
      }
    }

    return res.json({ success: true, message: 'Ratings saved successfully', order });
  } catch (error) {
    console.error('Rate Order Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error rating order' });
  }
};
