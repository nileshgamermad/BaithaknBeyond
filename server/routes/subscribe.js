import express from 'express';

const router  = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BREVO_BASE = 'https://api.brevo.com/v3';

async function brevoPost(path, body) {
  return fetch(`${BREVO_BASE}${path}`, {
    method:  'POST',
    headers: {
      'api-key':      process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function addContactToList(email, listId) {
  const res = await brevoPost('/contacts', {
    email,
    listIds:       [listId],
    updateEnabled: true,
  });

  if (res.status === 201) return 'created';
  if (res.status === 204) return 'existed';

  const body = await res.json().catch(() => ({}));
  if (body?.code === 'DUPLICATE_PARAMETER') return 'existed';

  throw Object.assign(
    new Error(`Brevo contact error ${res.status}: ${JSON.stringify(body)}`),
    { status: 502 }
  );
}

async function sendConfirmationEmail(email) {
  const res = await brevoPost('/smtp/email', {
    sender:      { name: 'Baithak & Beyond', email: process.env.BREVO_FROM_EMAIL },
    to:          [{ email }],
    subject:     'Welcome to Baithak & Beyond',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#FAF8F4;
             font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#FAF8F4;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:16px;border:1px solid #E8E5DF;
                    box-shadow:0 4px 24px rgba(0,0,0,0.07);overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6B7A52 0%,#4e5a3a 100%);
                     padding:28px 36px;text-align:center;">
            <p style="margin:0;color:#fff;font-size:13px;letter-spacing:0.14em;
                      text-transform:uppercase;font-weight:700;opacity:0.85;">
              Baithak &amp; Beyond
            </p>
            <h1 style="margin:10px 0 0;color:#fff;font-size:24px;font-weight:700;
                       letter-spacing:-0.02em;">
              You're in the Baithak
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px;">
            <p style="margin:0 0 16px;color:#4A4A4A;font-size:15px;line-height:1.65;">
              You have subscribed to city stories, seasonal food notes, and travel
              routes from Prayagraj.
            </p>
            <p style="margin:0 0 24px;color:#4A4A4A;font-size:15px;line-height:1.65;">
              We will show up in your inbox when there is something worth reading —
              no noise, just good writing.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 28px;">
                  <a href="https://baithaknbeyond.com"
                     style="display:inline-block;background:#6B7A52;color:#fff;
                            text-decoration:none;font-size:15px;font-weight:600;
                            padding:14px 32px;border-radius:10px;">
                    Visit Baithak &amp; Beyond
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#7A7A7A;font-size:13px;line-height:1.6;">
              If you didn't sign up for this, you can safely ignore this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
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
</html>`,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Brevo email API error ${res.status}: ${JSON.stringify(body)}`);
  }
}

// POST /api/subscribe
router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_LIST_ID || !process.env.BREVO_FROM_EMAIL) {
    console.error('[Subscribe] Missing env vars: BREVO_API_KEY, BREVO_LIST_ID, or BREVO_FROM_EMAIL');
    return res.status(500).json({ message: 'Subscription service not configured.' });
  }

  const normalised = email.toLowerCase().trim();
  const listId     = Number(process.env.BREVO_LIST_ID);

  let result;
  try {
    result = await addContactToList(normalised, listId);
    console.log(`[Subscribe] Contact ${result}:`, normalised);
  } catch (err) {
    console.error('[Subscribe] Brevo contact error:', err.message);
    return res.status(502).json({ message: 'Could not subscribe. Please try again.' });
  }

  // Only send confirmation email to genuinely new subscribers
  if (result === 'created') {
    try {
      await sendConfirmationEmail(normalised);
      console.log('[Subscribe] Confirmation email sent:', normalised);
    } catch (err) {
      // Log the error but do not fail the subscription response
      console.error('[Subscribe] Confirmation email error:', err.message);
    }
  }

  return res.json({ message: 'Subscribed successfully!' });
});

export default router;
