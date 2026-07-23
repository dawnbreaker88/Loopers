import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: { type: String, default: 'Fresh campus item' },
  category: { 
    type: String, 
    required: true,
    index: true
  },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 }, // in percentage
  stock: { type: Number, required: true, default: 0, min: 0 },
  image: { type: String, default: '' },
  brand: { type: String, default: 'Generic' },
  unit: { type: String, default: 'unit' }, // e.g. "Kg", "g", "Pack", "Litre"
  isActive: { type: Boolean, default: true, index: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Performance indexes
productSchema.index({ category: 1, price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isActive: 1, isDeleted: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
