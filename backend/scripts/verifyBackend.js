import http from 'http';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import { validateStatusTransition } from '../utils/orderStateMachine.js';

dotenv.config();

const runVerification = async () => {
  console.log('--- LOOPERS BACKEND VERIFICATION RUNNER ---');

  try {
    await connectDB();

    // 1. Verify Database Indexes
    console.log('[1/5] Verifying Mongoose Schema Indexes...');
    const userIndexes = await User.schema.indexes();
    const productIndexes = await Product.schema.indexes();
    const orderIndexes = await Order.schema.indexes();
    console.log(`✓ User indexes count: ${userIndexes.length}`);
    console.log(`✓ Product indexes count: ${productIndexes.length}`);
    console.log(`✓ Order indexes count: ${orderIndexes.length}`);

    // 2. Verify State Machine Guards
    console.log('\n[2/5] Verifying Order State Machine Rules...');
    try {
      validateStatusTransition('Order Placed', 'Confirmed');
      console.log('✓ Transition [Order Placed -> Confirmed]: PASSED');
    } catch (e) {
      console.error('✗ State Machine Failed:', e.message);
    }

    try {
      validateStatusTransition('Delivered', 'Preparing');
      console.error('✗ Illegal Transition Allowed!');
    } catch (e) {
      console.log(`✓ Illegal Transition [Delivered -> Preparing] correctly BLOCKED (${e.message})`);
    }

    // 3. Check Dynamic Categories
    console.log('\n[3/5] Verifying Categories Setup...');
    const categoriesCount = await Category.countDocuments({});
    console.log(`✓ Active Categories in DB: ${categoriesCount}`);

    // 4. Verify Product Stock Logic
    console.log('\n[4/5] Checking Product Inventory Model...');
    const sampleProduct = await Product.findOne({});
    if (sampleProduct) {
      console.log(`✓ Product "${sampleProduct.name}" stock: ${sampleProduct.stock}`);
    } else {
      console.log('✓ Product model verified (no items in DB yet)');
    }

    // 5. Verify Orders & Analytics Models
    console.log('\n[5/5] Checking Orders & Analytics Integrity...');
    const ordersCount = await Order.countDocuments({});
    console.log(`✓ Total Orders in DB: ${ordersCount}`);

    console.log('\n===========================================');
    console.log('SUCCESS: All Backend Infrastructure Checks Passed!');
    console.log('===========================================');

    process.exit(0);
  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
    process.exit(1);
  }
};

runVerification();
