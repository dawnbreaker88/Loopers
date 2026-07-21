import mongoose from 'mongoose';

const adminSubscriptionSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  }
}, { timestamps: true });

// Index admin for fast subscription lookups
adminSubscriptionSchema.index({ admin: 1 });

const AdminSubscription = mongoose.model('AdminSubscription', adminSubscriptionSchema);
export default AdminSubscription;
