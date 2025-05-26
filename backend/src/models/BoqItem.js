import mongoose from 'mongoose';

const boqItemSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    itemCode:  { type: String },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    unitRate: { type: Number },
    total: { type: Number },
    source: { type: String, enum: ['BLUEBEAM', 'CLIENT'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model('BoqItem', boqItemSchema);