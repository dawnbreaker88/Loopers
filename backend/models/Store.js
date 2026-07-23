import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Loopers Campus Dark Store' },
  openingTime: { type: String, default: '07:00 AM' },
  closingTime: { type: String, default: '02:00 AM' },
  isOpen: { type: Boolean, default: true },
  announcement: { type: String, default: '' }
}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema);

export default Store;
