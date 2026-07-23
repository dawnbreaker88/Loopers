import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Helper for date boundaries
const getDateBoundaries = () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return { startOfDay, startOfWeek, startOfMonth };
};

// @desc    Overview Admin Analytics Summary
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAdminAnalyticsSummary = asyncHandler(async (req, res) => {
  const { startOfDay, startOfWeek, startOfMonth } = getDateBoundaries();

  const totalOrders = await Order.countDocuments({});
  const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfDay } });
  const ordersThisWeek = await Order.countDocuments({ createdAt: { $gte: startOfWeek } });
  const ordersThisMonth = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });

  const activeOrders = await Order.countDocuments({
    orderStatus: { $in: ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery'] }
  });
  const completedOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
  const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });

  // Aggregated total revenue
  const revenueAgg = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'Cancelled' } } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, totalDelivery: { $sum: '$deliveryCharge' } } }
  ]);

  // Aggregated today's revenue
  const revenueTodayAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: startOfDay }, orderStatus: { $ne: 'Cancelled' } } },
    { $group: { _id: null, revenueToday: { $sum: '$totalPrice' } } }
  ]);

  const revenue = revenueAgg[0] ? revenueAgg[0].totalRevenue : 0;
  const deliveryCharges = revenueAgg[0] ? revenueAgg[0].totalDelivery : 0;
  const revenueToday = revenueTodayAgg[0] ? revenueTodayAgg[0].revenueToday : 0;
  const averageOrderValue = completedOrders > 0 ? parseFloat((revenue / completedOrders).toFixed(2)) : 0;

  return res.json({
    success: true,
    analytics: {
      totalOrders,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      activeOrders,
      completedOrders,
      cancelledOrders,
      revenue: parseFloat(revenue.toFixed(2)),
      revenueToday: parseFloat(revenueToday.toFixed(2)),
      deliveryCharges: parseFloat(deliveryCharges.toFixed(2)),
      averageOrderValue
    }
  });
});

// @desc    Granular Orders Analytics
// @route   GET /api/admin/analytics/orders
// @access  Private/Admin
export const getOrderAnalytics = asyncHandler(async (req, res) => {
  const { startOfDay, startOfWeek, startOfMonth } = getDateBoundaries();

  const [ordersToday, ordersThisWeek, ordersThisMonth, statusBreakdown] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ])
  ]);

  const statusMap = {
    placed: 0,
    confirmed: 0,
    preparing: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0
  };

  statusBreakdown.forEach(item => {
    if (item._id === 'Order Placed') statusMap.placed = item.count;
    if (item._id === 'Confirmed') statusMap.confirmed = item.count;
    if (item._id === 'Preparing') statusMap.preparing = item.count;
    if (item._id === 'Out for Delivery') statusMap.outForDelivery = item.count;
    if (item._id === 'Delivered') statusMap.delivered = item.count;
    if (item._id === 'Cancelled') statusMap.cancelled = item.count;
  });

  return res.json({
    success: true,
    orders: {
      today: ordersToday,
      thisWeek: ordersThisWeek,
      thisMonth: ordersThisMonth,
      byStatus: statusMap
    }
  });
});

// @desc    Granular Revenue Analytics
// @route   GET /api/admin/analytics/revenue
// @access  Private/Admin
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { startOfDay, startOfWeek, startOfMonth } = getDateBoundaries();

  const [todayAgg, weekAgg, monthAgg, totalAgg] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay }, orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfWeek }, orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } }
    ])
  ]);

  const todayRevenue = todayAgg[0]?.total || 0;
  const weeklyRevenue = weekAgg[0]?.total || 0;
  const monthlyRevenue = monthAgg[0]?.total || 0;
  const totalRevenue = totalAgg[0]?.total || 0;
  const totalCount = totalAgg[0]?.count || 0;
  const averageOrderValue = totalCount > 0 ? totalRevenue / totalCount : 0;

  return res.json({
    success: true,
    revenue: {
      today: parseFloat(todayRevenue.toFixed(2)),
      weekly: parseFloat(weeklyRevenue.toFixed(2)),
      monthly: parseFloat(monthlyRevenue.toFixed(2)),
      total: parseFloat(totalRevenue.toFixed(2)),
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
    }
  });
});

// @desc    Product Performance & Low Stock Analytics
// @route   GET /api/admin/analytics/products
// @access  Private/Admin
export const getProductAnalytics = asyncHandler(async (req, res) => {
  // Best selling products aggregated from non-cancelled orders
  const bestSellersAgg = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'Cancelled' } } },
    { $unwind: '$products' },
    {
      $group: {
        _id: '$products.product',
        name: { $first: '$products.name' },
        totalQuantitySold: { $sum: '$products.quantity' },
        totalRevenueGenerated: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
      }
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: 10 }
  ]);

  // Low stock products alert (< 5 units)
  const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
    .select('name category price stock image brand')
    .sort({ stock: 1 });

  return res.json({
    success: true,
    products: {
      bestSellers: bestSellersAgg,
      lowStockAlerts: lowStockProducts
    }
  });
});

// @desc    Customer Behavior & Growth Analytics
// @route   GET /api/admin/analytics/customers
// @access  Private/Admin
export const getCustomerAnalytics = asyncHandler(async (req, res) => {
  const totalCustomers = await User.countDocuments({ role: 'customer' });

  // Repeat customer analysis
  const customerOrderCounts = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'Cancelled' } } },
    { $group: { _id: '$user', orderCount: { $sum: 1 } } }
  ]);

  const repeatCustomers = customerOrderCounts.filter(c => c.orderCount > 1).length;
  const newCustomers = totalCustomers - repeatCustomers;
  const repeatCustomerPercentage = totalCustomers > 0 
    ? parseFloat(((repeatCustomers / totalCustomers) * 100).toFixed(1)) 
    : 0;

  return res.json({
    success: true,
    customers: {
      totalCustomers,
      repeatCustomers,
      newCustomers,
      repeatCustomerPercentage
    }
  });
});

// @desc    Geographic Delivery Insights & Hostel Heatmap
// @route   GET /api/admin/analytics/geographic
// @access  Private/Admin
export const getGeographicAnalytics = asyncHandler(async (req, res) => {
  // Aggregate delivery orders by address landmark / street / hostel
  const topLocations = await Order.aggregate([
    {
      $group: {
        _id: {
          landmark: { $ifNull: ['$address.landmark', '$address.street'] },
          city: '$address.city'
        },
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$totalPrice' }
      }
    },
    { $sort: { orderCount: -1 } },
    { $limit: 15 }
  ]);

  // Generate coordinate heatmap points
  const heatmapData = await Order.aggregate([
    { $match: { 'customerLocation.lat': { $exists: true } } },
    {
      $project: {
        lat: '$customerLocation.lat',
        lng: '$customerLocation.lng',
        totalPrice: 1
      }
    },
    { $limit: 200 }
  ]);

  return res.json({
    success: true,
    geographic: {
      topLocations: topLocations.map(loc => ({
        locationName: loc._id.landmark || 'General Area',
        city: loc._id.city,
        orderCount: loc.orderCount,
        totalSpent: parseFloat(loc.totalSpent.toFixed(2))
      })),
      heatmapData
    }
  });
});
