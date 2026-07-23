import PrintoutPricing from '../models/PrintoutPricing.js';

// @desc    Get current printout pricing configurations
// @route   GET /api/pricing
// @access  Public/Private
export const getPricing = async (req, res) => {
  try {
    let pricing = await PrintoutPricing.findOne();
    if (!pricing) {
      // Seed with default rates if no configuration exists
      pricing = await PrintoutPricing.create({});
    }
    return res.status(200).json({ success: true, pricing });
  } catch (error) {
    console.error('Get Pricing Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving pricing config' });
  }
};

// @desc    Update printout pricing configurations (Admin only)
// @route   PUT /api/pricing
// @access  Private/Admin
export const updatePricing = async (req, res) => {
  try {
    let pricing = await PrintoutPricing.findOne();
    if (!pricing) {
      pricing = new PrintoutPricing();
    }

    const {
      bwSingle,
      bwDouble,
      colorSingle,
      colorDouble,
      binding,
      extras,
      paperSizes,
      paperQualities,
      tax,
      discount
    } = req.body;

    if (bwSingle !== undefined) pricing.bwSingle = bwSingle;
    if (bwDouble !== undefined) pricing.bwDouble = bwDouble;
    if (colorSingle !== undefined) pricing.colorSingle = colorSingle;
    if (colorDouble !== undefined) pricing.colorDouble = colorDouble;
    
    if (binding) {
      pricing.binding = { ...pricing.binding.toObject(), ...binding };
    }
    
    if (extras) {
      pricing.extras = { ...pricing.extras.toObject(), ...extras };
    }

    if (paperSizes) {
      pricing.paperSizes = { ...pricing.paperSizes.toObject(), ...paperSizes };
    }

    if (paperQualities) {
      pricing.paperQualities = { ...pricing.paperQualities.toObject(), ...paperQualities };
    }

    if (tax !== undefined) pricing.tax = tax;
    if (discount !== undefined) pricing.discount = discount;

    await pricing.save();
    return res.status(200).json({ success: true, message: 'Pricing configurations updated successfully', pricing });
  } catch (error) {
    console.error('Update Pricing Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating pricing config' });
  }
};
