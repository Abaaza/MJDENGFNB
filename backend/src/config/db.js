import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.set('strictQuery', false);

let cached = global.mongoose;

if (!cached) {
  cached = {};
}

async function connect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.CONNECTION_STRING) {
    console.warn('❗ No CONNECTION_STRING specified; skipping DB connection');
    return null;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.CONNECTION_STRING, {
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('✅ MongoDB connected');
    global.mongoose = cached; // store back
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }

  return cached.conn;
}

export default connect;
