import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: false
  },
  type: {
    type: String,
    enum: ['product', 'printout'],
    default: 'product'
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1, 
    default: 1 
  },
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
  price: { type: Number },
  specialInstructions: { type: String },
  orientation: { type: String },
  paperSize: { type: String },
  paperQuality: { type: String },
  printMode: { type: String }
}, { _id: true }); // Enable _id so we can unique identify items, especially printouts without a productId

const cartSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  items: [cartItemSchema],
  totalPrice: { 
    type: Number, 
    required: true, 
    default: 0 
  }
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
