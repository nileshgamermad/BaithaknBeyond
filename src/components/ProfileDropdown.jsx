import { useEffect, useRef } from 'react';
import './ProfileDropdown.css';

export default function ProfileDropdown({ user, bookmarkCount, onSignOut, onClose }) {
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

      <button className="profile-signout" onClick={() => { onSignOut(); onClose(); }}>
        Sign out
      </button>
    </div>
  );
}
