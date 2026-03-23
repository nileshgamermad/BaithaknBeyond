import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Helper — find or create an OAuth user, then return JWT payload
const oauthLogin = async (providerField, providerId, { name, email, avatar }) => {
  // 1. Try to find by provider ID
  let user = await User.findOne({ [providerField]: providerId });

  // 2. If not found, try by email (link existing account)
  if (!user && email) {
    user = await User.findOne({ email });
    if (user) {
      user[providerField] = providerId;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
    }
  }

  // 3. Create new user
  if (!user) {
    user = await User.create({
      name,
      email,
      avatar,
      [providerField]: providerId,
      provider: providerField.replace('Id', ''),
    });
  }

  return {
    _id:    user._id,
    name:   user.name,
    email:  user.email,
    avatar: user.avatar,
    role:   user.role,
    token:  generateToken(user._id),
  };
};

// ── Email auth ────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({
      _id:    user._id,
      name:   user.name,
      email:  user.email,
      avatar: user.avatar,
      role:   user.role,
      token:  generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Google OAuth ──────────────────────────────────────────────────────────────

// POST /api/auth/google  — body: { access_token }
router.post('/google', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ message: 'Google access token required' });
  try {
    const googleRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
    );
    if (!googleRes.ok) throw new Error('Failed to fetch Google user info');
    const { sub: googleId, name, email, picture: avatar } = await googleRes.json();
    const payload = await oauthLogin('googleId', googleId, { name, email, avatar });
    res.json(payload);
  } catch (err) {
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

// ── Facebook OAuth ────────────────────────────────────────────────────────────

// POST /api/auth/facebook  — body: { accessToken }
router.post('/facebook', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ message: 'Facebook access token required' });
  try {
    // Verify token and get user info via Graph API
    const graphRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
    );
    if (!graphRes.ok) throw new Error('Graph API error');
    const fbUser = await graphRes.json();
    if (fbUser.error) throw new Error(fbUser.error.message);

    const { id: facebookId, name, email, picture } = fbUser;
    const avatar = picture?.data?.url;
    const payload = await oauthLogin('facebookId', facebookId, { name, email: email || `fb_${facebookId}@noemail.com`, avatar });
    res.json(payload);
  } catch (err) {
    res.status(401).json({ message: 'Facebook authentication failed' });
  }
});

// ── Apple OAuth ───────────────────────────────────────────────────────────────

// POST /api/auth/apple  — body: { idToken, user? }
// `user` object (name) is only sent on the FIRST sign-in by Apple
router.post('/apple', async (req, res) => {
  const { idToken, user: appleUser } = req.body;
  if (!idToken) return res.status(400).json({ message: 'Apple identity token required' });
  try {
    const applePayload = await appleSignin.verifyIdToken(idToken, {
      audience:        process.env.APPLE_CLIENT_ID,
      ignoreExpiration: false,
    });
    const appleId = applePayload.sub;
    const email   = applePayload.email || `apple_${appleId}@privaterelay.appleid.com`;
    // Name is only provided by Apple on first login
    const name    = appleUser?.name
      ? `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim()
      : 'Apple User';

    const payload = await oauthLogin('appleId', appleId, { name, email, avatar: null });
    res.json(payload);
  } catch (err) {
    res.status(401).json({ message: 'Apple authentication failed' });
  }
});

// ── Protected ─────────────────────────────────────────────────────────────────

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

export default router;
