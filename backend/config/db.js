import mongoose from 'mongoose';
import User from '../models/User.js';

const seedAdmin = async () => {
  try {
    const adminEmail = 'airaareddy@gmail.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        phone: '9999999999',
        password: 'airaareddy123',
        role: 'admin',
        status: 'active',
        isActive: true
      });
      console.log('Fixed admin seeded successfully: airaareddy@gmail.com');
    }

    const camperEmail = 'cp@gmail.com';
    const camperExists = await User.findOne({ email: camperEmail });
    if (!camperExists) {
      await User.create({
        name: 'Camper Admin',
        email: camperEmail,
        phone: '8888888888',
        password: 'camperprabs',
        role: 'admin',
        status: 'active',
        isActive: true
      });
      console.log('Camper admin seeded successfully: cp@gmail.com');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

const connectDB = async (retries = 5, delay = 5000) => {
  // Setup connection event listeners once
  if (!mongoose.connection._hasListeners) {
    mongoose.connection.on('error', (err) => {
      console.error(`[MDB Connection Error]: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MDB Warn]: MongoDB disconnected. Attempting automatic reconnection...');
    });

    mongoose.connection.on('connected', () => {
      console.log('[MDB Info]: MongoDB connection established.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MDB Info]: MongoDB reconnected successfully.');
    });

    mongoose.connection._hasListeners = true;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hyperlocal-dispatcher');
      console.log(`[MDB Info] Connected: ${conn.connection.host}`);
      await seedAdmin();
      return;
    } catch (error) {
      console.error(`[MDB Connection Error] Attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) {
        console.error('[MDB Failure] Critical: Reached maximum connection attempts. Node application exiting.');
        process.exit(1);
      }
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default connectDB;
