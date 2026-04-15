import express from 'express';
import Collection from '../models/Collection.js';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me/stats', protect, async (req, res) => {
  try {
    const [collectionsCount, readStoryIds] = await Promise.all([
      Collection.countDocuments({ userId: req.user._id }),
      Interaction.distinct('storyId', { userId: req.user._id, type: 'view' }),
    ]);

    res.json({
      savedPostsCount: req.user.bookmarks?.length ?? 0,
      postsReadCount: readStoryIds.length,
      collectionsCount,
    });
  } catch (err) {
    console.error('[Users] STATS error:', err.message);
    res.status(500).json({ message: 'Failed to fetch user stats' });
  }
});

export default router;
