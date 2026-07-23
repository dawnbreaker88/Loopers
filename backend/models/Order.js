import mongoose from 'mongoose';

const orderProductSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  type: { type: String, enum: ['product', 'printout'], default: 'product' },
  name: { type: String, required: false },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  // Printout properties
  pdfUrl: { type: String },
  pdfName: { type: String },
  pdfSize: { type: String },
  pages: { type: Number },
  copies: { type: Number },
  bwPages: { type: Number },
  colorPages: { type: Number },
  binding: { type: String },
  extras: [{ type: String }],
  specialInstructions: { type: String },
  orientation: { type: String },
  paperSize: { type: String },
  paperQuality: { type: String },
  printMode: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [orderProductSchema],
  totalPrice: { type: Number, required: true },
  address: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    houseNumber: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    latitude: { type: Number },
    longitude: { type: Number }
  },

  paymentMethod: { type: String, enum: ['UPI', 'Card', 'Wallet', 'COD'], required: true },
  customId: { type: String, unique: true, sparse: true },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  paymentId: { type: String },
  orderStatus: {
    type: String,
    enum: [
      'Order Placed',
      'Confirmed',
      'Printing',
      'Preparing',
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    ],
    default: 'Order Placed'
  },
  storeLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  customerLocation: {
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
    experienceRating: { type: Number, min: 1, max: 5 }
  },
  agentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminDetails: {
    name: { type: String },
    phone: { type: String }
  }
}, { timestamps: true });


// Compound indexes for fast order lookups & analytics
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });



const generateCustomOrderId = () => {
  const prefix = 'LPR';
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefix}-${yy}${mm}${dd}-${randomStr}`;
};

orderSchema.pre('save', async function (next) {
  if (!this.customId) {
    this.customId = generateCustomOrderId();
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
