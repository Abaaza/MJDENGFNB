
//src/models/project

import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    id:     { type: String, required: true, unique: true, index: true },
    client: { type: String, required: true },
    type:   { type: String, required: true },
    due:    { type: Date,   required: true },
    status: {
      type: String,
      enum: ['NEW', 'UNDER_REVIEW', 'PRICED', 'SENT'],
      default: 'NEW',
    },
    boqUploaded: { type: Boolean, default: false },
    value: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
