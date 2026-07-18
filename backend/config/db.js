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

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hyperlocal-dispatcher');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedAdmin();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
