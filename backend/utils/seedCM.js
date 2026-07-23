import Banner from '../models/Banner.js';
import HomeSection from '../models/HomeSection.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

export const seedContentManagement = async () => {
  try {
    // 0. Seed or update Categories with professional colorful Flaticons
    const categoryIconMap = [
      { name: 'Snacks', description: 'Quick bites, chips and snacks', icon: 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png', isActive: true },
      { name: 'Beverages', description: 'Soft drinks, energy drinks, tea & coffee', icon: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png', isActive: true },
      { name: 'Dairy', description: 'Milk, bread, butter & cheese', icon: 'https://cdn-icons-png.flaticon.com/512/3050/3050158.png', isActive: true },
      { name: 'Groceries', description: 'Instant noodles, cooking essentials', icon: 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png', isActive: true },
      { name: 'Household', description: 'Soaps, detergents, cleaning essentials', icon: 'https://cdn-icons-png.flaticon.com/512/995/995053.png', isActive: true },
      { name: 'Fast Food', description: 'Burgers, pizzas, fries & rolls', icon: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png', isActive: true },
      { name: 'Vegetables', description: 'Fresh farm vegetables', icon: 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png', isActive: true },
      { name: 'Fruits', description: 'Fresh fruits', icon: 'https://cdn-icons-png.flaticon.com/512/3194/3194766.png', isActive: true },
      { name: 'Electronics', description: 'Chargers, headphones, cables', icon: 'https://cdn-icons-png.flaticon.com/512/3659/3659899.png', isActive: true },
      { name: 'Printouts', description: 'Document printing service', icon: 'https://cdn-icons-png.flaticon.com/512/1041/1041975.png', isActive: true }
    ];

    for (const cat of categoryIconMap) {
      const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      await Category.updateOne({ name: cat.name }, { $set: { ...cat, slug } }, { upsert: true });
    }

    // 1. Seed or update Promotional Banners with 2.4:1 marketing creatives if empty
    const bannerCount = await Banner.countDocuments({});
    if (bannerCount === 0) {
      console.log('Seeding default promotional banners...');
      const bannerSeedData = [
        {
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&h=500&q=80',
          altText: 'Late Night Study Munchies - 10 Min Delivery',
          redirectType: 'category',
          redirectTarget: 'Fast Food',
          displayOrder: 1,
          isActive: true
        },
        {
          image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=1200&h=500&q=80',
          altText: 'Weekend Combo Deals - Snacks & Drinks',
          redirectType: 'category',
          redirectTarget: 'Snacks',
          displayOrder: 2,
          isActive: true
        },
        {
          image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&h=500&q=80',
          altText: 'Exam Week Essentials - Instant Delivery',
          redirectType: 'category',
          redirectTarget: 'Groceries',
          displayOrder: 3,
          isActive: true
        }
      ];

      await Banner.insertMany(bannerSeedData);
    }

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
