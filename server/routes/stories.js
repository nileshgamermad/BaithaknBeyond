import express from 'express';
import Story from '../models/Story.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/stories — public
router.get('/', async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/stories/:id — public
router.get('/:id', async (req, res) => {
  try {
    const story = await Story.findOne({ id: req.params.id });
    if (!story) return res.status(404).json({ message: 'Story not found' });
    res.json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/stories — admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const story = await Story.create(req.body);
    res.status(201).json(story);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/stories/:id — admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const story = await Story.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!story) return res.status(404).json({ message: 'Story not found' });
    res.json(story);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/stories/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const story = await Story.findOneAndDelete({ id: req.params.id });
    if (!story) return res.status(404).json({ message: 'Story not found' });
    res.json({ message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
