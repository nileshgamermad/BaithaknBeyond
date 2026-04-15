import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/bookmarks
// Returns the authenticated user's saved story IDs
router.get('/', protect, (req, res) => {
  try {
    console.log('[Bookmarks] GET userId:', req.user._id, '| count:', req.user.bookmarks?.length ?? 0);
    res.json(req.user.bookmarks ?? []);
  } catch (err) {
    console.error('[Bookmarks] GET error:', err.message);
    res.status(500).json({ message: 'Failed to fetch bookmarks' });
  }
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

  try {
    const alreadySaved = req.user.bookmarks.includes(storyId);

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      alreadySaved
        ? { $pull:     { bookmarks: storyId } }
        : { $addToSet: { bookmarks: storyId } },
      { new: true, select: 'bookmarks' }
    );

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[Bookmarks] TOGGLE userId:', req.user._id, '| storyId:', storyId,
                '|', alreadySaved ? 'removed' : 'saved', '| total:', updated.bookmarks.length);
    res.json(updated.bookmarks);
  } catch (err) {
    console.error('[Bookmarks] TOGGLE error:', err.message);
    res.status(500).json({ message: 'Failed to update bookmark' });
  }
});

export default router;
