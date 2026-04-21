import express from 'express';

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/subscribe
router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  const listId = Number(process.env.BREVO_LIST_ID);
  if (!listId) {
    console.error('[Subscribe] BREVO_LIST_ID not set');
    return res.status(500).json({ message: 'Subscription service not configured.' });
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key':      process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      body: JSON.stringify({
        email:         email.toLowerCase().trim(),
        listIds:       [listId],
        updateEnabled: true,
      }),
    });

    // 201 = created, 204 = updated (already existed) — both are success
    if (brevoRes.status === 201 || brevoRes.status === 204) {
      console.log('[Subscribe] Added:', email);
      return res.json({ message: 'Subscribed successfully!' });
    }

    const body = await brevoRes.json().catch(() => ({}));

    // Brevo returns 400 with code DUPLICATE_PARAMETER when contact already exists
    // in some API versions — treat as success
    if (body?.code === 'DUPLICATE_PARAMETER') {
      return res.json({ message: 'Subscribed successfully!' });
    }

    console.error('[Subscribe] Brevo error:', brevoRes.status, body);
    return res.status(502).json({ message: 'Could not subscribe. Please try again.' });
  } catch (err) {
    console.error('[Subscribe] Network error:', err.message);
    res.status(502).json({ message: 'Could not subscribe. Please try again.' });
  }
});

export default router;
