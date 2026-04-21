import { useEffect, useRef, useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { saveToken } from '../api/index.js';
import './AuthModal.css';

const BASE = import.meta.env.VITE_API_URL || 'https://baithakn-beyond-backend.onrender.com/api';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const RESEND_COOLDOWN = 30;

export default function AuthModal({ onClose, onAuth }) {
  // step: 'email' | 'otp'
  const [step, setStep]           = useState('email');
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [cooldown, setCooldown]   = useState(0);
  const backdropRef               = useRef(null);
  const timerRef                  = useRef(null);
  const otpInputRef               = useRef(null);

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpInputRef.current?.focus(), 80);
  }, [step]);

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  const finish = (userData) => {
    saveToken(userData.token);
    onAuth(userData);
    onClose();
  };

  // ── Google ────────────────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async ({ access_token }) => {
      setError('');
      setLoading(true);
      try {
        const res  = await fetch(`${BASE}/auth/google`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ access_token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Server error');
        finish(data);
      } catch (err) {
        setError(err.message || 'Google sign-in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in failed — check your browser allows popups.'),
  });

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter your email address.');
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/send-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP.');
      setStep('otp');
      startCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return setError('Please enter the OTP.');
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed.');
      finish(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setOtp('');
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/send-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      startCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div className="auth-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Sign in">

        <button className="auth-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="auth-header">
          {step === 'email' ? (
            <>
              <h2>Welcome back</h2>
              <p>Sign in or create an account to save stories and personalise your experience</p>
            </>
          ) : (
            <>
              <h2>Check your inbox</h2>
              <p>We sent a 6-digit code to <strong>{email}</strong></p>
            </>
          )}
        </div>

        {step === 'email' && (
          <>
            {/* Google */}
            <div className="auth-social">
              <button className="oauth-btn oauth-btn--google" onClick={() => googleLogin()} disabled={loading}>
                <GoogleIcon />
                Continue with Google
              </button>
            </div>

            <div className="auth-divider">or continue with email</div>

            {/* Email form */}
            <form className="auth-form" onSubmit={handleSendOTP}>
              <div className="auth-field">
                <label htmlFor="auth-email">Email address</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <form className="auth-form" onSubmit={handleVerifyOTP}>
            <div className="auth-field">
              <label htmlFor="auth-otp">One-time password</label>
              <input
                id="auth-otp"
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="6-digit code"
                autoComplete="one-time-code"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-submit" type="submit" disabled={loading || otp.length < 6}>
              {loading ? 'Verifying…' : 'Verify & Sign in'}
            </button>

            <div className="auth-resend-row">
              <button
                type="button"
                className="auth-resend-btn"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </button>
              <button type="button" className="auth-back-btn" onClick={() => { setStep('email'); setOtp(''); setError(''); }}>
                Change email
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
