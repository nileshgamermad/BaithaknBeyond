import { useEffect, useRef, useState } from 'react';
import './ProfileEditModal.css';

const BASE = import.meta.env.VITE_API_URL || 'https://baithakn-beyond-backend.onrender.com/api';

export default function ProfileEditModal({ user, token, onClose, onSaved }) {
  // step: 'edit' | 'otp'
  const [step, setStep]           = useState('edit');
  const [name, setName]           = useState(user.name || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');
  const [avatarBase64, setAvatarBase64]   = useState('');
  const [otp, setOtp]             = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [cooldown, setCooldown]   = useState(0);
  const timerRef                  = useRef(null);
  const backdropRef               = useRef(null);
  const fileInputRef              = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startCooldown = () => {
    setCooldown(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setAvatarBase64(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Step 1: save intended changes + send OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name cannot be empty.');
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/send-otp-secure`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  // Step 2: verify OTP → get editToken → update profile
  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return setError('Please enter the OTP.');
    setError('');
    setLoading(true);
    try {
      // Verify OTP
      const verifyRes = await fetch(`${BASE}/auth/verify-otp-secure`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ otp: otp.trim() }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message || 'OTP verification failed.');

      // Update profile
      const updateRes = await fetch(`${BASE}/users/me/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:      name.trim(),
          avatar:    avatarBase64 || undefined,
          editToken: verifyData.editToken,
        }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.message || 'Profile update failed.');

      onSaved(updateData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setError('');
    setOtp('');
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/send-otp-secure`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="pedit-backdrop" ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}>
      <div className="pedit-modal" role="dialog" aria-modal="true">

        <button className="pedit-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="pedit-header">
          <h2>{step === 'edit' ? 'Edit Profile' : 'Verify Identity'}</h2>
          <p>{step === 'edit' ? 'Update your name and profile picture' : `Enter the code sent to ${user.email}`}</p>
        </div>

        {step === 'edit' && (
          <form className="pedit-form" onSubmit={handleRequestOTP}>
            {/* Avatar */}
            <div className="pedit-avatar-row">
              <div className="pedit-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="pedit-avatar-img" referrerPolicy="no-referrer" />
                  : <div className="pedit-avatar-initials">{initials}</div>
                }
                <div className="pedit-avatar-overlay">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="pedit-file-hidden"
                onChange={handleFileChange}
              />
              <p className="pedit-avatar-hint">Click to change photo (max 2MB)</p>
            </div>

            {/* Name */}
            <div className="pedit-field">
              <label htmlFor="pedit-name">Display name</label>
              <input
                id="pedit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                disabled={loading}
              />
            </div>

            {error && <p className="pedit-error">{error}</p>}

            <button className="pedit-submit" type="submit" disabled={loading}>
              {loading ? 'Sending OTP…' : 'Save Changes'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="pedit-form" onSubmit={handleVerifyAndSave}>
            <div className="pedit-field">
              <label htmlFor="pedit-otp">Verification code</label>
              <input
                id="pedit-otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="6-digit code"
                autoComplete="one-time-code"
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
            </div>

            {error && <p className="pedit-error">{error}</p>}

            <button className="pedit-submit" type="submit" disabled={loading || otp.length < 6}>
              {loading ? 'Saving…' : 'Confirm & Save'}
            </button>

            <div className="pedit-resend-row">
              <button type="button" className="pedit-resend-btn" onClick={handleResendOTP} disabled={cooldown > 0 || loading}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
              <button type="button" className="pedit-back-btn" onClick={() => { setStep('edit'); setOtp(''); setError(''); }}>
                Back
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
