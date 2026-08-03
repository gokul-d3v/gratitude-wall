import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/gratitude_wall';
    await mongoose.connect(connStr, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[Database] MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    // Graceful handling without immediate process crash in dev/test
  }
};
