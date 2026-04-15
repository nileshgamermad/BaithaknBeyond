import mongoose from 'mongoose';

// Tracks every meaningful interaction a user has with a story.
// Used to compute per-user category affinity scores for personalisation.
//
// type    | weight | meaning
// --------|--------|--------
// view      1        user opened the story quick-view
// bookmark  2        user saved the story (stronger signal)
// unbookmark -1      user removed the bookmark (negative signal)

const interactionSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    storyId:  { type: String, required: true },
    category: { type: String, required: true },
    type:     { type: String, enum: ['view', 'bookmark', 'unbookmark'], required: true },
    weight:   { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Compound index so we can quickly aggregate scores per user+category
interactionSchema.index({ userId: 1, category: 1 });

export default mongoose.model('Interaction', interactionSchema);
