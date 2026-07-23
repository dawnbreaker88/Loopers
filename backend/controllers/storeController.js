import Store from '../models/Store.js';

// @desc    Get store status and operating hours
// @route   GET /api/store/status
// @access  Public
export const getStoreStatus = async (req, res) => {
  try {
    let store = await Store.findOne();
    if (!store) {
      store = await Store.create({
        storeName: 'Loopers Campus Dark Store',
        openingTime: '07:00 AM',
        closingTime: '02:00 AM',
        isOpen: true
      });
    }
    return res.json({ success: true, store });
  } catch (error) {
    console.error('Get Store Status Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching store status' });
  }
};

// @desc    Update store status and operating hours
// @route   PUT /api/admin/store/status
// @access  Private/Admin
export const updateStoreStatus = async (req, res) => {
  const { storeName, openingTime, closingTime, isOpen, announcement } = req.body;

  try {
    let store = await Store.findOne();
    if (!store) {
      store = new Store({});
    }

    if (storeName !== undefined) store.storeName = storeName;
    if (openingTime !== undefined) store.openingTime = openingTime;
    if (closingTime !== undefined) store.closingTime = closingTime;
    if (isOpen !== undefined) store.isOpen = Boolean(isOpen);
    if (announcement !== undefined) store.announcement = announcement;

    await store.save();

    const io = req.app.get('socketio');
    if (io) {
      io.emit('storeStatusUpdated', store);
    }

    return res.json({ success: true, message: 'Store settings updated successfully', store });
  } catch (error) {
    console.error('Update Store Status Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating store status' });
  }
};
