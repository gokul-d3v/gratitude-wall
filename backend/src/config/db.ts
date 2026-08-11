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

    // Safely drop legacy employeeCode_1 index if present in MongoDB collection
    try {
      const userCollection = mongoose.connection.collection('users');
      const indexes = await userCollection.indexes();
      if (indexes.some((idx) => idx.name === 'employeeCode_1')) {
        await userCollection.dropIndex('employeeCode_1');
        console.log('[Database] Successfully dropped legacy employeeCode_1 unique index.');
      }
    } catch {
      // Ignore if index or collection does not exist
    }
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    throw error;
  }
};
