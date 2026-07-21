import mongoose from 'mongoose';

const printoutPricingSchema = new mongoose.Schema({
  bwSingle: { type: Number, default: 2 },
  bwDouble: { type: Number, default: 3 },
  colorSingle: { type: Number, default: 10 },
  colorDouble: { type: Number, default: 15 },
  binding: {
    spiral: { type: Number, default: 30 },
    hard: { type: Number, default: 70 },
    soft: { type: Number, default: 20 },
    stickFile: { type: Number, default: 15 },
    transparentFile: { type: Number, default: 10 },
    clampFile: { type: Number, default: 15 }
  },
  extras: {
    frontTransparentSheet: { type: Number, default: 10 },
    backHardSheet: { type: Number, default: 10 },
    lamination: { type: Number, default: 20 },
    coverPage: { type: Number, default: 15 },
    pageNumbering: { type: Number, default: 5 },
    watermark: { type: Number, default: 5 }
  },
  paperSizes: {
    A4: { type: Number, default: 0 },
    A3: { type: Number, default: 5 },
    Legal: { type: Number, default: 3 },
    Letter: { type: Number, default: 2 }
  },
  paperQualities: {
    normal: { type: Number, default: 0 },
    premium: { type: Number, default: 5 },
    glossy: { type: Number, default: 10 }
  },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure we only have one configuration document
const PrintoutPricing = mongoose.model('PrintoutPricing', printoutPricingSchema);

export default PrintoutPricing;
