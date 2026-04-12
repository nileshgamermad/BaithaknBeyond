import { useEffect, useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { login, register, saveToken } from '../api/index.js';
import './AuthModal.css';

/* ── SVG icons ──────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

/* ── Facebook SDK loader ─────────────────────────────────────── */
const loadFacebookSDK = (appId) =>
  new Promise((resolve) => {
    if (window.FB) { resolve(window.FB); return; }
    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: true, xfbml: true, version: 'v19.0' });
      resolve(window.FB);
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });

/* ── Apple SDK loader ────────────────────────────────────────── */
const loadAppleSDK = () =>
  new Promise((resolve) => {
    if (window.AppleID) { resolve(window.AppleID); return; }
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.onload = () => resolve(window.AppleID);
    document.body.appendChild(script);
  });

/* ─────────────────────────────────────────────────────────────── */
export default function AuthModal({ onClose, onAuth }) {
  const [tab, setTab]         = useState('signin');
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const backdropRef           = useRef(null);

  const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
  const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID;
  const APPLE_REDIRECT  = import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  const finish = (userData) => {
    saveToken(userData.token);
    onAuth(userData);
    onClose();
  };

  /* ── Google ──────────────────────────────────────────────── */
  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async ({ access_token }) => {
      setError('');
      setLoading(true);
      try {
        const base = import.meta.env.VITE_API_URL || 'https://baithakn-beyond-backend.onrender.com/api';
        const res = await fetch(`${base}/auth/google`, {
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
    onError: (err) => {
      console.error('Google OAuth error:', err);
      setError('Google sign-in failed — check your browser allows popups for this site.');
    },
  });

  /* ── Facebook ────────────────────────────────────────────── */
  const handleFacebook = async () => {
    setError('');
    setLoading(true);
    try {
      const FB = await loadFacebookSDK(FACEBOOK_APP_ID);
      FB.login(async (response) => {
        if (response.authResponse) {
          const { accessToken } = response.authResponse;
          const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/facebook`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ accessToken }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          finish(data);
        } else {
          setError('Facebook sign-in was cancelled');
        }
        setLoading(false);
      }, { scope: 'public_profile,email' });
    } catch (err) {
      setError(err.message || 'Facebook sign-in failed');
      setLoading(false);
    }
  };

  /* ── Apple ───────────────────────────────────────────────── */
  const handleApple = async () => {
    setError('');
    setLoading(true);
    try {
      const AppleID = await loadAppleSDK();
      AppleID.auth.init({
        clientId:    APPLE_CLIENT_ID,
        scope:       'name email',
        redirectURI: APPLE_REDIRECT,
        usePopup:    true,
      });
      const appleResponse = await AppleID.auth.signIn();
      const { id_token: idToken } = appleResponse.authorization;
      const user = appleResponse.user || null;

      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/apple`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken, user }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      finish(data);
    } catch (err) {
      if (err?.error !== 'popup_closed_by_user') {
        setError(err.message || 'Apple sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Email form ──────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = tab === 'signin'
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
      finish(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    value:    form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    disabled: loading,
  });

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="auth-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Sign in">

        <button className="auth-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="auth-header">
          <h2>{tab === 'signin' ? 'Welcome back' : 'Create account'}</h2>
          <p>Save your favourite stories and personalise your experience</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'signin' ? 'active' : ''}`} onClick={() => { setTab('signin'); setError(''); }}>
            Sign in
          </button>
          <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>
            Sign up
          </button>
        </div>

        {/* Social buttons */}
        <div className="auth-social">
          <button className="oauth-btn oauth-btn--google" onClick={() => googleLogin()} disabled={loading}>
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        <div className="auth-divider">or</div>

        {/* Email form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-name">Full name</label>
              <input id="auth-name" type="text" placeholder="Your name" autoComplete="name" required {...field('name')} />
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" placeholder="you@example.com" autoComplete="email" required {...field('email')} />
          </div>
          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder={tab === 'signup' ? 'Create a password' : 'Your password'}
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              minLength={tab === 'signup' ? 8 : undefined}
              required
              {...field('password')}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : tab === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

      </div>
    </div>
  );
}
