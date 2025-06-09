import mongoose from 'mongoose';

const priceItemSchema = new mongoose.Schema(
  {
    code: { type: String },
    ref: { type: String },
    description: { type: String, required: true },
    category: { type: String },
    subCategory: { type: String },
    unit: { type: String },
    rate: { type: Number },
    keywords: [String],
    phrases: [String],
  },
  { timestamps: true }
);

export default mongoose.model('PriceItem', priceItemSchema);
