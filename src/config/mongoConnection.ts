import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('Attempting MongoDB connection...');
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/my_database', {
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Database name:', conn.connection.db?.databaseName);
  } catch (err) {
    if (err instanceof Error) {
        console.error(`Error: ${err.message}`);
      } else {
        console.error('Unknown error', err);
      }
      process.exit(1);
  }
};

export default connectDB;