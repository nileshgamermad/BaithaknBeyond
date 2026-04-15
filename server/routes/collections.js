import express from 'express';
import Collection from '../models/Collection.js';
import CollectionPost from '../models/CollectionPost.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

async function getCollectionsForUser(userId) {
  const collections = await Collection.find({ userId }).sort({ createdAt: -1 }).lean();
  const collectionIds = collections.map((collection) => collection._id);

  const collectionPosts = collectionIds.length
    ? await CollectionPost.find({ collectionId: { $in: collectionIds } }).sort({ createdAt: -1 }).lean()
    : [];

  const postsByCollection = collectionPosts.reduce((acc, post) => {
    const key = String(post.collectionId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(post.postId);
    return acc;
  }, {});

  return collections.map((collection) => {
    const postIds = postsByCollection[String(collection._id)] || [];
    return {
      id: String(collection._id),
      userId: String(collection.userId),
      name: collection.name,
      createdAt: collection.createdAt,
      postIds,
      postCount: postIds.length,
      previewPostIds: postIds.slice(0, 3),
    };
  });
}

router.get('/', protect, async (req, res) => {
  try {
    const collections = await getCollectionsForUser(req.user._id);
    res.json(collections);
  } catch (err) {
    console.error('[Collections] LIST error:', err.message);
    res.status(500).json({ message: 'Failed to fetch collections' });
  }
});

router.post('/', protect, async (req, res) => {
  const name = req.body?.name?.trim();
  if (!name) {
    return res.status(400).json({ message: 'Collection name is required' });
  }

  try {
    const collection = await Collection.create({
      userId: req.user._id,
      name,
    });

    res.status(201).json({
      id: String(collection._id),
      userId: String(collection.userId),
      name: collection.name,
      createdAt: collection.createdAt,
      postIds: [],
      postCount: 0,
      previewPostIds: [],
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'You already have a collection with that name' });
    }
    console.error('[Collections] CREATE error:', err.message);
    res.status(500).json({ message: 'Failed to create collection' });
  }
});

router.get('/:collectionId', protect, async (req, res) => {
  try {
    const collection = await Collection.findOne({
      _id: req.params.collectionId,
      userId: req.user._id,
    }).lean();

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const collectionPosts = await CollectionPost.find({ collectionId: collection._id })
      .sort({ createdAt: -1 })
      .lean();

    const postIds = collectionPosts.map((entry) => entry.postId);
    res.json({
      id: String(collection._id),
      userId: String(collection.userId),
      name: collection.name,
      createdAt: collection.createdAt,
      postIds,
      postCount: postIds.length,
      previewPostIds: postIds.slice(0, 3),
    });
  } catch (err) {
    console.error('[Collections] GET error:', err.message);
    res.status(500).json({ message: 'Failed to fetch collection' });
  }
});

router.post('/:collectionId/posts', protect, async (req, res) => {
  const postId = req.body?.postId;
  if (!postId || typeof postId !== 'string') {
    return res.status(400).json({ message: 'postId is required' });
  }

  try {
    const collection = await Collection.findOne({
      _id: req.params.collectionId,
      userId: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    await CollectionPost.updateOne(
      { collectionId: collection._id, postId },
      { $setOnInsert: { collectionId: collection._id, postId } },
      { upsert: true }
    );

    const collectionPosts = await CollectionPost.find({ collectionId: collection._id })
      .sort({ createdAt: -1 })
      .lean();

    const postIds = collectionPosts.map((entry) => entry.postId);
    res.json({
      id: String(collection._id),
      userId: String(collection.userId),
      name: collection.name,
      createdAt: collection.createdAt,
      postIds,
      postCount: postIds.length,
      previewPostIds: postIds.slice(0, 3),
    });
  } catch (err) {
    console.error('[Collections] ADD POST error:', err.message);
    res.status(500).json({ message: 'Failed to add post to collection' });
  }
});

router.delete('/:collectionId/posts/:postId', protect, async (req, res) => {
  try {
    const collection = await Collection.findOne({
      _id: req.params.collectionId,
      userId: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    await CollectionPost.deleteOne({
      collectionId: collection._id,
      postId: req.params.postId,
    });

    const collectionPosts = await CollectionPost.find({ collectionId: collection._id })
      .sort({ createdAt: -1 })
      .lean();

    const postIds = collectionPosts.map((entry) => entry.postId);
    res.json({
      id: String(collection._id),
      userId: String(collection.userId),
      name: collection.name,
      createdAt: collection.createdAt,
      postIds,
      postCount: postIds.length,
      previewPostIds: postIds.slice(0, 3),
    });
  } catch (err) {
    console.error('[Collections] REMOVE POST error:', err.message);
    res.status(500).json({ message: 'Failed to remove post from collection' });
  }
});

export default router;
