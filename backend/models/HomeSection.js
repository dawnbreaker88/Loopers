import mongoose from 'mongoose';

const homeSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('HomeSection', homeSectionSchema);
