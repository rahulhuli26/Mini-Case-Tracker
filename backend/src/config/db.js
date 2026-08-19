import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the `MONGODB_URI` environment variable, falling
 * back to a local database when it is not set.
 *
 * @returns {Promise<void>} Resolves once the connection has been established.
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini-case-tracker';

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoURI);
  console.log('MongoDB connected');
};
