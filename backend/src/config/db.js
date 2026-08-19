import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini-case-tracker';

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoURI);
  console.log('MongoDB connected');
};
