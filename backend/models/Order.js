import mongoose from 'mongoose';

const orderProductSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [orderProductSchema],
  totalPrice: { type: Number, required: true },
  deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAgent', default: null },
  address: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    houseNumber: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String }
  },
  paymentMethod: { type: String, enum: ['UPI', 'Card', 'Wallet', 'COD'], required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  paymentId: { type: String },
  orderStatus: {
    type: String,
    enum: [
      'Order Confirmed',
      'Preparing',
      'Assigned',
      'Picked Up',
      'On The Way',
      'Near You',
      'Delivered',
      'Cancelled'
    ],
    default: 'Order Confirmed'
  },
  storeLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  customerLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  agentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  distance: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  trackingHistory: [
    {
      status: { type: String },
      lat: { type: Number },
      lng: { type: Number },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  ratings: {
    agentRating: { type: Number, min: 1, max: 5 },
    agentReview: { type: String },
    experienceRating: { type: Number, min: 1, max: 5 }
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
