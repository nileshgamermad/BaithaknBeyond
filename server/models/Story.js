import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    id:            { type: String, required: true, unique: true },
    slug:          String,
    category:      String,
    categoryLabel: String,
    title:         { type: String, required: true },
    image:         String,
    alt:           String,
    summary:       String,
    detail:        String,
    excerpt:       String,
    location:      String,
    readTime:      String,
    accent:        String,
    tags:          [String],
    discoveryMoods:[String],
    mapEmbed:      String,
  },
  { timestamps: true }
);

export default mongoose.model('Story', storySchema);
