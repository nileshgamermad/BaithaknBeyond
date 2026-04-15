import express from 'express';
import Story from '../models/Story.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/stories/search/suggestions?q=...
router.get('/search/suggestions', async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) return res.json({ posts: [], categories: [], tags: [] });

  const regex = new RegExp(escapeRegex(query), 'i');

  try {
    const [posts, tagRows] = await Promise.all([
      Story.find({
        $or: [
          { title: regex },
          { summary: regex },
          { location: regex },
          { categoryLabel: regex },
        ],
      })
        .select('id slug title category categoryLabel tags location')
        .limit(5)
        .lean(),
      Story.distinct('tags', { tags: regex }),
    ]);

    const categoryRows = await Story.aggregate([
      {
        $match: {
          $or: [{ category: regex }, { categoryLabel: regex }],
        },
      },
      {
        $group: {
          _id: '$category',
          label: { $first: '$categoryLabel' },
        },
      },
      { $limit: 5 },
    ]);

    res.json({
      posts,
      categories: categoryRows.map((row) => ({
        id: row._id,
        label: row.label,
      })),
      tags: tagRows.slice(0, 8),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/stories/related/:id
router.get('/related/:id', async (req, res) => {
  try {
    const story = await Story.findOne({ id: req.params.id }).lean();
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const related = await Story.aggregate([
      {
        $match: {
          id: { $ne: story.id },
          $or: [
            { category: story.category },
            { tags: { $in: story.tags || [] } },
          ],
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $cond: [{ $eq: ['$category', story.category] }, 2, 0] },
              {
                $size: {
                  $setIntersection: ['$tags', story.tags || []],
                },
              },
            ],
          },
        },
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: 3 },
    ]);

    res.json(related);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/stories/tags
router.get('/tags', async (_req, res) => {
  try {
    const tags = await Story.distinct('tags');
    res.json(tags.sort((a, b) => a.localeCompare(b)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/stories — public
router.get('/', async (req, res) => {
  const {
    q,
    category,
    tag,
    mood,
    limit,
    offset,
  } = req.query;

  const query = {};
  const andFilters = [];

  if (q?.trim()) {
    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    andFilters.push({
      $or: [
        { title: regex },
        { summary: regex },
        { detail: regex },
        { location: regex },
        { categoryLabel: regex },
        { tags: regex },
      ],
    });
  }

  if (category && category !== 'all') andFilters.push({ category });
  if (tag) andFilters.push({ tags: tag });
  if (mood) andFilters.push({ discoveryMoods: mood });
  if (andFilters.length) query.$and = andFilters;

  try {
    const normalizedLimit = Math.min(Number(limit) || 12, 24);
    const normalizedOffset = Number(offset) || 0;

    const [stories, total] = await Promise.all([
      Story.find(query)
        .sort({ createdAt: -1 })
        .skip(normalizedOffset)
        .limit(normalizedLimit),
      Story.countDocuments(query),
    ]);

    res.json({
      items: stories,
      total,
      hasMore: normalizedOffset + stories.length < total,
    });
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
