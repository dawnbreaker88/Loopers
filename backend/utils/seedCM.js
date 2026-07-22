import Banner from '../models/Banner.js';
import HomeSection from '../models/HomeSection.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

export const seedContentManagement = async () => {
  const seedDbVal = process.env.SEED_DATABASE ? process.env.SEED_DATABASE.trim() : '';
  if (seedDbVal !== 'true') {
    console.log('[Seed CM Info] SEED_DATABASE is not set to "true". Skipping content management seeding.');
    return;
  }

  try {
    console.log('[Seed CM Info] Starting content management seeding...');
    // 0. Seed or update Categories with professional colorful Flaticons
    const categoryIconMap = [
      { name: 'Snacks', description: 'Quick bites, chips and snacks', icon: 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png', isActive: true },
      { name: 'Beverages', description: 'Soft drinks, energy drinks, tea & coffee', icon: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png', isActive: true },
      { name: 'Dairy', description: 'Milk, bread, butter & cheese', icon: 'https://cdn-icons-png.flaticon.com/512/3050/3050158.png', isActive: true },
      { name: 'Groceries', description: 'Instant noodles, cooking essentials', icon: 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png', isActive: true },

      { name: 'Fast Food', description: 'Burgers, pizzas, fries & rolls', icon: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png', isActive: true },
      { name: 'Vegetables', description: 'Fresh farm vegetables', icon: 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png', isActive: true },
      { name: 'Fruits', description: 'Fresh fruits', icon: 'https://cdn-icons-png.flaticon.com/512/3194/3194766.png', isActive: true },
      { name: 'Electronics', description: 'Chargers, headphones, cables', icon: 'https://cdn-icons-png.flaticon.com/512/3659/3659899.png', isActive: true },
      { name: 'Printouts', description: 'Document printing service', icon: 'https://cdn-icons-png.flaticon.com/512/1041/1041975.png', isActive: true }
    ];

    for (const cat of categoryIconMap) {
      const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      // Use $setOnInsert so existing category customizations by admins are never overwritten
      await Category.updateOne({ name: cat.name }, { $setOnInsert: { ...cat, slug } }, { upsert: true });
    }

    // 1. Seed or update Promotional Banners with 2.4:1 marketing creatives


    // 2. Seed Home Page Sections if empty
    const sectionCount = await HomeSection.countDocuments({});
    if (sectionCount === 0) {
      console.log('Seeding default home sections...');
      const allProducts = await Product.find({ isDeleted: { $ne: true } }).limit(12);
      const productIds = allProducts.map(p => p._id);

      await HomeSection.create([
        {
          title: 'Trending in Dorms',
          displayOrder: 1,
          products: productIds.slice(0, 4),
          isActive: true
        },
        {
          title: 'Popular Today',
          displayOrder: 2,
          products: productIds.slice(4, 8),
          isActive: true
        },
        {
          title: 'Late Night Snacks',
          displayOrder: 3,
          products: productIds.slice(8, 12),
          isActive: true
        }
      ]);
    }
  } catch (err) {
    console.error('Error seeding content management:', err.message);
  }
};
