import mongoose from 'mongoose';

const priceItemSchema = new mongoose.Schema(
  {
    code: { type: String },
    ref: { type: String },
    description: { type: String, required: true },
    unit: { type: String },
    rate: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model('PriceItem', priceItemSchema);
