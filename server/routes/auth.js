import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const getResend = () => new Resend(process.env.RESEND_API_KEY);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── In-memory OTP store ───────────────────────────────────────────────────────
// Map<`${email}:${purpose}`, { otpHash, expiresAt, attempts, lastSentAt }>
// Works without MongoDB; OTPs expire in 5 min so server restarts are harmless.
const otpStore = new Map();
const OTP_TTL_MS    = 5 * 60 * 1000;
const RESEND_GAP_MS = 30 * 1000;      // 30s cooldown between resends
const MAX_ATTEMPTS  = 5;
const BCRYPT_ROUNDS = 10;

function purgeExpired() {
  const now = Date.now();
  for (const [key, rec] of otpStore) {
    if (rec.expiresAt < now) otpStore.delete(key);
  }
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Shared OTP email builder ──────────────────────────────────────────────────
function otpEmailHtml(otp) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#FAF8F4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F4;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:16px;border:1px solid #E8E5DF;
               box-shadow:0 4px 24px rgba(0,0,0,0.07);overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#6B7A52 0%,#4e5a3a 100%);
                     padding:28px 36px;text-align:center;">
            <p style="margin:0;color:#fff;font-size:13px;letter-spacing:0.14em;
                       text-transform:uppercase;font-weight:700;opacity:0.85;">
              Baithak &amp; Beyond
            </p>
            <h1 style="margin:10px 0 0;color:#fff;font-size:24px;font-weight:700;
                       letter-spacing:-0.02em;">Verify your email</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 36px 28px;">
            <p style="margin:0 0 20px;color:#4A4A4A;font-size:15px;line-height:1.65;">
              Use the code below to continue. It expires in <strong>5 minutes</strong> and is single-use.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 28px;">
                  <div style="display:inline-block;background:#F5F3EF;
                              border:2px solid #E8E5DF;border-radius:14px;padding:20px 40px;">
                    <span style="font-size:38px;font-weight:800;letter-spacing:0.18em;
                                 color:#6B7A52;font-family:'Courier New',monospace;">
                      ${otp}
                    </span>
                  </div>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 10px;color:#7A7A7A;font-size:13px;line-height:1.6;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F3EF;border-top:1px solid #E8E5DF;
                     padding:18px 36px;text-align:center;">
            <p style="margin:0;color:#9A9A9A;font-size:12px;">
              © ${new Date().getFullYear()} Baithak &amp; Beyond · Prayagraj
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Internal: send OTP ────────────────────────────────────────────────────────
async function sendOTPToEmail(email, purpose = 'login') {
  purgeExpired();
  const key = `${email}:${purpose}`;
  const existing = otpStore.get(key);

  // Enforce resend cooldown
  if (existing && existing.lastSentAt && Date.now() - existing.lastSentAt < RESEND_GAP_MS) {
    const wait = Math.ceil((RESEND_GAP_MS - (Date.now() - existing.lastSentAt)) / 1000);
    throw Object.assign(new Error(`Please wait ${wait}s before requesting another OTP.`), { status: 429 });
  }

  const otp       = generateOTP();
  const otpHash   = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = Date.now() + OTP_TTL_MS;

  otpStore.set(key, { otpHash, expiresAt, attempts: 0, lastSentAt: Date.now() });

  await getResend().emails.send({
    from:    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to:      email,
    subject: 'Your Baithak & Beyond verification code',
    html:    otpEmailHtml(otp),
  });

  console.log(`[OTP] Sent to ${email} | purpose=${purpose}`);
}

// ── Internal: verify OTP ──────────────────────────────────────────────────────
async function verifyOTPFromStore(email, otp, purpose = 'login') {
  purgeExpired();
  const key    = `${email}:${purpose}`;
  const record = otpStore.get(key);

  if (!record)                       throw Object.assign(new Error('OTP not found or expired. Request a new one.'), { status: 400 });
  if (Date.now() > record.expiresAt) { otpStore.delete(key); throw Object.assign(new Error('OTP has expired. Request a new one.'), { status: 400 }); }
  if (record.attempts >= MAX_ATTEMPTS) { otpStore.delete(key); throw Object.assign(new Error('Too many incorrect attempts. Request a new OTP.'), { status: 429 }); }

  const match = await bcrypt.compare(String(otp).trim(), record.otpHash);
  if (!match) {
    record.attempts += 1;
    const left = MAX_ATTEMPTS - record.attempts;
    throw Object.assign(new Error(`Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} remaining.`), { status: 400 });
  }

  otpStore.delete(key); // single-use
}

// ── Google OAuth helper ───────────────────────────────────────────────────────
const oauthLogin = async (providerField, providerId, { name, email, avatar }) => {
  let user = await User.findOne({ [providerField]: providerId });

  if (!user && email) {
    user = await User.findOne({ email });
    if (user) {
      user[providerField] = providerId;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
    }
  }

  if (!user) {
    user = await User.create({
      name,
      email,
      avatar,
      [providerField]: providerId,
      provider: providerField.replace('Id', ''),
    });
  }

  console.log('[Auth] OAUTH LOGIN email:', user.email, '| provider:', providerField.replace('Id', ''));
  return buildPayload(user);
};

function buildPayload(user) {
  return {
    _id:       user._id,
    name:      user.name,
    email:     user.email,
    avatar:    user.avatar,
    role:      user.role,
    createdAt: user.createdAt,
    token:     generateToken(user._id),
  };
}

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
// Public. Body: { email }
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }
  try {
    await sendOTPToEmail(email.toLowerCase().trim(), 'login');
    res.json({ message: 'OTP sent. Check your inbox.' });
  } catch (err) {
    console.error('[OTP] send error:', err.message);
    res.status(err.status || 502).json({ message: err.message || 'Failed to send OTP. Please try again.' });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
// Public. Body: { email, otp }
// Logs in an existing user or creates a new account.
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

  try {
    await verifyOTPFromStore(email.toLowerCase().trim(), otp, 'login');

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    const isNew = !user;

    if (!user) {
      user = await User.create({
        name:     email.split('@')[0], // default name from email prefix
        email:    email.toLowerCase().trim(),
        provider: 'otp',
      });
    }

    console.log(`[Auth] OTP ${isNew ? 'REGISTER' : 'LOGIN'} email:`, user.email);
    res.json({ ...buildPayload(user), isNew });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Verification failed.' });
  }
});

// ── POST /api/auth/send-otp-secure ────────────────────────────────────────────
// Protected. Sends OTP to the authenticated user's email for profile changes.
router.post('/send-otp-secure', protect, async (req, res) => {
  const email = req.user.email;
  try {
    await sendOTPToEmail(email, 'profile_update');
    res.json({ message: 'Verification OTP sent to your email.' });
  } catch (err) {
    console.error('[OTP] secure send error:', err.message);
    res.status(err.status || 502).json({ message: err.message || 'Failed to send OTP.' });
  }
});

// ── POST /api/auth/verify-otp-secure ─────────────────────────────────────────
// Protected. Verifies OTP and returns a short-lived edit token.
router.post('/verify-otp-secure', protect, async (req, res) => {
  const { otp } = req.body;
  const email   = req.user.email;
  if (!otp) return res.status(400).json({ message: 'OTP is required.' });

  try {
    await verifyOTPFromStore(email, otp, 'profile_update');
    // Issue a 15-minute edit token
    const editToken = jwt.sign(
      { id: req.user._id, purpose: 'profile_update' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ verified: true, editToken });
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
});

// ── POST /api/auth/google ─────────────────────────────────────────────────────
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

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

export default router;
