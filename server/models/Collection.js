import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
  },
  { timestamps: true }
);

collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Collection', collectionSchema);
