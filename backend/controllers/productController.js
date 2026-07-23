import Product from '../models/Product.js';

// @desc    Get all active non-deleted products (with category filter and search)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  const { category, search } = req.query;

  try {
    const query = {
      isDeleted: { $ne: true },
      isActive: { $ne: false }
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Get Products Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, product });
  } catch (error) {
    console.error('Get Product By ID Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching product' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  const { name, description, category, price, discount, stock, image, brand, unit } = req.body;

  if (!name || !price || stock === undefined || !category) {
    return res.status(400).json({ success: false, message: 'Name, price, category and stock count are required' });
  }

  try {
    const product = await Product.create({
      name,
      description: description && description.trim() !== '' ? description : `${name} - Fresh Campus Product`,
      category,
      price: Number(price),
      discount: Number(discount) || 0,
      stock: Number(stock),
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e',
      brand: brand || 'Generic',
      unit: unit || 'unit',
      isActive: true,
      isDeleted: false
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('productCreated', product);
    }

    return res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    console.error('Create Product Error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Server error creating product' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('productUpdated', product);
    }

    return res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Update Product Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating product' });
  }
};

// @desc    Delete a product (Soft-delete & purge)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('productDeleted', { id: req.params.id, _id: req.params.id });
    }

    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete Product Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error deleting product' });
  }
};
