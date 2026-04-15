import mongoose from 'mongoose';

const collectionPostSchema = new mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
      index: true,
    },
    postId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

collectionPostSchema.index({ collectionId: 1, postId: 1 }, { unique: true });

export default mongoose.model('CollectionPost', collectionPostSchema);
