// src/config/db.js
import mongoose from 'mongoose';
import dotenv   from 'dotenv';
dotenv.config();

mongoose.set('strictQuery', false);

let cached = global.mongoose; // reuse in Lambda

if (!cached && process.env.CONNECTION_STRING) {
  cached = global.mongoose = mongoose.connect(
    process.env.CONNECTION_STRING,
    { bufferCommands: false }
  );
  mongoose.connection.once('open', () =>
    console.log('✅ MongoDB connected')
  );
  mongoose.connection.on('error', (err) =>
    console.error('❌ MongoDB connection error:', err)
  );
} else if (!process.env.CONNECTION_STRING) {
  console.warn('❗ No CONNECTION_STRING specified; skipping DB connection');
}

export default cached;                 // Promise
