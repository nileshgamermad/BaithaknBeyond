import express from 'express';
import jwt from 'jsonwebtoken';
import Collection from '../models/Collection.js';
import Interaction from '../models/Interaction.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users/me/stats
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

// PUT /api/users/me/profile
// Protected. Requires a valid editToken (issued by /auth/verify-otp-secure).
// Body: { name?, avatar?, editToken }
router.put('/me/profile', protect, async (req, res) => {
  const { name, avatar, editToken } = req.body;

  // Validate the edit token
  if (!editToken) {
    return res.status(403).json({ message: 'OTP verification required to update profile.' });
  }
  try {
    const decoded = jwt.verify(editToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'profile_update' || String(decoded.id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Invalid edit token.' });
    }
  } catch {
    return res.status(403).json({ message: 'Edit token expired or invalid. Please verify OTP again.' });
  }

  const updates = {};
  if (name?.trim()) updates.name = name.trim();
  if (avatar) {
    if (avatar.startsWith('data:image/') || avatar.startsWith('http')) {
      updates.avatar = avatar;
    } else {
      return res.status(400).json({ message: 'Invalid avatar format.' });
    }
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'No changes provided.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    );
    console.log('[Users] PROFILE UPDATE userId:', req.user._id);
    res.json({
      _id:    user._id,
      name:   user.name,
      email:  user.email,
      avatar: user.avatar,
      role:   user.role,
    });
  } catch (err) {
    console.error('[Users] PROFILE UPDATE error:', err.message);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

export default router;
