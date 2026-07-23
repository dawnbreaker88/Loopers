import { calculatePrintPrice } from '../utils/priceCalculator.js';
import PrintoutPricing from '../models/PrintoutPricing.js';

// @desc    Calculate live printing price
// @route   POST /api/printouts/calculate-price
// @access  Private
export const calculatePrice = async (req, res) => {
  const {
    pages,
    copies,
    colorPagesList,
    colorMode,
    printMode,
    paperSize,
    paperQuality,
    binding,
    extras
  } = req.body;

  try {
    if (!pages) {
      return res.status(400).json({ success: false, message: 'Page count is required' });
    }

    let pricing = await PrintoutPricing.findOne();
    if (!pricing) {
      pricing = await PrintoutPricing.create({});
    }

    const price = calculatePrintPrice({
      pages,
      copies,
      colorPagesList,
      colorMode,
      printMode,
      paperSize,
      paperQuality,
      binding,
      extras
    }, pricing);

    return res.status(200).json({ success: true, price });
  } catch (error) {
    console.error('Calculate Price Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error calculating price' });
  }
};

// @desc    Get pricing configurations for frontend calculation
// @route   GET /api/printouts/pricing
// @access  Private
export const getCustomerPricing = async (req, res) => {
  try {
    let pricing = await PrintoutPricing.findOne();
    if (!pricing) {
      pricing = await PrintoutPricing.create({});
    }
    return res.status(200).json({ success: true, pricing });
  } catch (error) {
    console.error('Get Customer Pricing Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving pricing' });
  }
};
