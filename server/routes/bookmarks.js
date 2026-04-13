import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/bookmarks
// Returns the authenticated user's saved story IDs
router.get('/', protect, (req, res) => {
  res.json(req.user.bookmarks ?? []);
});

// POST /api/bookmarks/toggle
// Body: { storyId: string }
// Adds the story if not bookmarked, removes it if already bookmarked.
// Uses atomic $addToSet / $pull to prevent race conditions.
router.post('/toggle', protect, async (req, res) => {
  const { storyId } = req.body;
  if (!storyId || typeof storyId !== 'string') {
    return res.status(400).json({ message: 'storyId (string) is required' });
  }

  const alreadySaved = req.user.bookmarks.includes(storyId);

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    alreadySaved
      ? { $pull:     { bookmarks: storyId } }
      : { $addToSet: { bookmarks: storyId } },
    { new: true, select: 'bookmarks' }
  );

  res.json(updated.bookmarks);
});

export default router;
