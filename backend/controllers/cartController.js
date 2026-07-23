import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Calculate total cart price
const recalculateCart = async (cart) => {
  let totalPrice = 0;
  // Make sure product details are populated to calculate price
  await cart.populate('items.product');
  
  cart.items.forEach(item => {
    if (item.type === 'printout') {
      // For printout items, the unit price is calculated dynamically
      totalPrice += (item.price || 0) * (item.quantity || 1);
    } else if (item.product) {
      const discountedPrice = item.product.price * (1 - (item.product.discount || 0) / 100);
      totalPrice += discountedPrice * item.quantity;
    }
  });
  
  cart.totalPrice = Math.round(totalPrice * 100) / 100;
  return cart;
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [], totalPrice: 0 });
    }

    return res.json({ success: true, cart });
  } catch (error) {
    console.error('Get Cart Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching cart' });
  }
};

// @desc    Add single or multiple products/printouts to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  const { productId, quantity, items, type } = req.body; // Supports bulk add, single add, or printout

  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [], totalPrice: 0 });
    }

    if (type === 'printout') {
      const {
        pdfUrl, pdfName, pdfSize, pages, copies, bwPages, colorPages,
        binding, extras, price, specialInstructions, orientation,
        paperSize, paperQuality, printMode
      } = req.body;

      if (!pdfUrl || !pages || !price) {
        return res.status(400).json({ success: false, message: 'Missing printout parameters' });
      }

      // Check if this exact printout already exists in the cart to increment quantity
      const existingIndex = cart.items.findIndex(item => 
        item.type === 'printout' && 
        item.pdfUrl === pdfUrl && 
        item.binding === binding &&
        item.printMode === printMode &&
        item.paperSize === paperSize &&
        item.paperQuality === paperQuality &&
        JSON.stringify(item.extras.sort()) === JSON.stringify((extras || []).sort())
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantity || 1;
        cart.items[existingIndex].copies += copies || 1;
      } else {
        cart.items.push({
          type: 'printout',
          pdfUrl,
          pdfName,
          pdfSize,
          pages,
          copies: copies || 1,
          bwPages,
          colorPages,
          binding,
          extras: extras || [],
          price,
          specialInstructions,
          orientation,
          paperSize,
          paperQuality,
          printMode,
          quantity: quantity || 1
        });
      }
    } else if (items && Array.isArray(items)) {
      // Process bulk items list
      for (const item of items) {
        const prod = await Product.findById(item.productId);
        if (!prod) continue;

        const existingIndex = cart.items.findIndex(i => i.product && i.product.toString() === item.productId);
        const qty = item.quantity || 1;

        if (existingIndex > -1) {
          cart.items[existingIndex].quantity += qty;
        } else {
          cart.items.push({ product: item.productId, quantity: qty });
        }
      }
    } else if (productId) {
      // Process single item add
      const prod = await Product.findById(productId);
      if (!prod) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const qty = quantity || 1;
      const existingIndex = cart.items.findIndex(item => item.product && item.product.toString() === productId);

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += qty;
      } else {
        cart.items.push({ product: productId, quantity: qty });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Please specify products to add' });
    }

    await recalculateCart(cart);
    await cart.save();

    return res.json({ success: true, message: 'Cart updated successfully', cart });
  } catch (error) {
    console.error('Add to Cart Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error adding to cart' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = async (req, res) => {
  const { productId, cartItemId, quantity } = req.body;
  const targetId = productId || cartItemId;

  try {
    if (!targetId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide productId/cartItemId and quantity' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => {
      if (item.type === 'printout') {
        return item._id.toString() === targetId;
      }
      return item.product && item.product.toString() === targetId;
    });

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await recalculateCart(cart);
    await cart.save();

    return res.json({ success: true, message: 'Cart item updated', cart });
  } catch (error) {
    console.error('Update Cart Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating cart' });
  }
};

// @desc    Remove product from cart
// @route   DELETE /api/cart/remove
// @access  Private
export const removeFromCart = async (req, res) => {
  const { productId, cartItemId } = req.body;
  const targetId = productId || cartItemId;

  try {
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Please provide productId or cartItemId' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => {
      if (item.type === 'printout') {
        return item._id.toString() !== targetId;
      }
      return !item.product || item.product.toString() !== targetId;
    });

    await recalculateCart(cart);
    await cart.save();

    return res.json({ success: true, message: 'Product removed from cart', cart });
  } catch (error) {
    console.error('Remove From Cart Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error removing item' });
  }
};
