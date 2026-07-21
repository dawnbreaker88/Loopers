/**
 * Computes the total printout cost using the dynamic database pricing rates.
 * Supports custom page color selectors, orientation, binding, paper size/quality, and extras.
 * 
 * @param {Object} config - Customer chosen configuration
 * @param {Object} pricing - Pricing config from database
 * @returns {Number} The computed total price
 */
export const calculatePrintPrice = (config, pricing) => {
  const {
    pages,
    copies = 1,
    colorPagesList = [], // Array of page numbers
    colorMode = 'all-bw', // 'all-bw', 'all-color', 'custom'
    printMode = 'single', // 'single', 'double'
    paperSize = 'A4',
    paperQuality = 'normal',
    binding = 'none',
    extras = []
  } = config;

  let bwPagesCount = 0;
  let colorPagesCount = 0;

  if (colorMode === 'all-bw') {
    bwPagesCount = pages;
    colorPagesCount = 0;
  } else if (colorMode === 'all-color') {
    bwPagesCount = 0;
    colorPagesCount = pages;
  } else if (colorMode === 'custom') {
    // Unique, validated pages within range
    const validColorPages = [...new Set(colorPagesList)]
      .filter(p => p >= 1 && p <= pages);
    colorPagesCount = validColorPages.length;
    bwPagesCount = Math.max(0, pages - colorPagesCount);
  }

  // Determine base printing rates
  let bwRate = printMode === 'double' ? pricing.bwDouble : pricing.bwSingle;
  let colorRate = printMode === 'double' ? pricing.colorDouble : pricing.colorSingle;

  // Add paper size and paper quality adjustments
  const paperSizeAddon = (pricing.paperSizes && pricing.paperSizes[paperSize]) || 0;
  const paperQualityAddon = (pricing.paperQualities && pricing.paperQualities[paperQuality]) || 0;

  bwRate += paperSizeAddon + paperQualityAddon;
  colorRate += paperSizeAddon + paperQualityAddon;

  // Total base print cost
  const basePrintCost = (bwPagesCount * bwRate) + (colorPagesCount * colorRate);

  // Print cost multiplied by copies
  let total = basePrintCost * copies;

  // Add binding cost (per copy)
  const bindingCost = ((pricing.binding && pricing.binding[binding]) || 0) * copies;
  total += bindingCost;

  // Add extras costs (per copy)
  let extrasCost = 0;
  if (extras && Array.isArray(extras)) {
    extras.forEach(extra => {
      extrasCost += ((pricing.extras && pricing.extras[extra]) || 0);
    });
  }
  total += extrasCost * copies;

  // Apply discount first if any
  if (pricing.discount && pricing.discount > 0) {
    total = total * (1 - pricing.discount / 100);
  }

  // Apply tax if any
  if (pricing.tax && pricing.tax > 0) {
    total = total * (1 + pricing.tax / 100);
  }

  return Math.round(total * 100) / 100;
};
