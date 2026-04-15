import express from 'express';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/interactions
// Records a single user interaction (view / bookmark / unbookmark).
// Fire-and-forget from the frontend — the client never waits on this.
// Body: { storyId: string, category: string, type: 'view' | 'bookmark' | 'unbookmark' }
router.post('/', protect, async (req, res) => {
  const { storyId, category, type } = req.body;

  if (!storyId || !category || !type) {
    return res.status(400).json({ message: 'storyId, category, and type are required' });
  }

  const weightMap = { view: 1, bookmark: 2, unbookmark: -1 };
  const weight = weightMap[type];
  if (weight === undefined) {
    return res.status(400).json({ message: 'type must be view | bookmark | unbookmark' });
  }

  try {
    await Interaction.create({
      userId:   req.user._id,
      storyId,
      category,
      type,
      weight,
    });

    console.log('[Interactions] Recorded', type, '| userId:', req.user._id, '| story:', storyId, '| cat:', category);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[Interactions] Write error:', err.message);
    res.status(500).json({ message: 'Failed to record interaction' });
  }
});

// GET /api/interactions/scores
// Returns per-category affinity scores for the authenticated user.
// Aggregated as: score = sum(weight) per category.
// Used as a fallback / cross-device source of truth. The frontend also
// derives scores locally from bookmarks + reading history for instant UX.
router.get('/scores', protect, async (req, res) => {
  try {
    const rows = await Interaction.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$category', score: { $sum: '$weight' } } },
      { $sort: { score: -1 } },
    ]);

    // Shape: { history: 5, food: 3, ... }
    const scores = Object.fromEntries(rows.map((r) => [r._id, r.score]));
    console.log('[Interactions] Scores for', req.user._id, '→', scores);
    res.json(scores);
  } catch (err) {
    console.error('[Interactions] Scores error:', err.message);
    res.status(500).json({ message: 'Failed to fetch scores' });
  }
});

export default router;
