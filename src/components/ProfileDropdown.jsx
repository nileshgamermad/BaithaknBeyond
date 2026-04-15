import { useEffect, useRef } from 'react';
import './ProfileDropdown.css';

export default function ProfileDropdown({ user, bookmarkCount, onSignOut, onClose, onViewSaved }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="profile-dropdown" ref={ref}>
      <div className="profile-top">
        {user.avatar
          ? <img className="profile-avatar" src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
          : <div className="profile-initials">{initials}</div>
        }
        <div className="profile-info">
          <span className="profile-name">{user.name}</span>
          <span className="profile-email">{user.email}</span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{bookmarkCount}</span>
          <span className="profile-stat-label">Saved stories</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{user.role === 'admin' ? 'Admin' : 'Member'}</span>
          <span className="profile-stat-label">Account type</span>
        </div>
      </div>

      {onViewSaved && (
        <button className="profile-view-saved" onClick={onViewSaved}>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" style={{ flexShrink: 0 }}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          View Saved Stories
          {bookmarkCount > 0 && (
            <span className="profile-view-saved-count">{bookmarkCount}</span>
          )}
        </button>
      )}

      <button className="profile-signout" onClick={() => { onSignOut(); onClose(); }}>
        Sign out
      </button>
    </div>
  );
}
