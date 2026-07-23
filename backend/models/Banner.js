import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true
    },
    altText: {
      type: String,
      default: 'Promotional Banner'
    },
    redirectType: {
      type: String,
      enum: ['none', 'category', 'product', 'external'],
      default: 'none'
    },
    redirectTarget: {
      type: String,
      default: ''
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
