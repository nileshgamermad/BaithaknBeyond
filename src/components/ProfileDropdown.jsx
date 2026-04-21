import { useEffect, useRef } from 'react';
import './ProfileDropdown.css';

export default function ProfileDropdown({ user, stats, onSignOut, onClose, onViewSaved, onViewCollections, onEditProfile }) {
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
          <span className="profile-stat-value">{stats?.savedPostsCount ?? 0}</span>
          <span className="profile-stat-label">Saved stories</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{stats?.collectionsCount ?? 0}</span>
          <span className="profile-stat-label">Collections</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{stats?.postsReadCount ?? 0}</span>
          <span className="profile-stat-label">Stories read</span>
        </div>
      </div>

      {onViewSaved && (
        <button className="profile-view-saved" onClick={onViewSaved}>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" style={{ flexShrink: 0 }}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          View Saved Stories
          {(stats?.savedPostsCount ?? 0) > 0 && (
            <span className="profile-view-saved-count">{stats.savedPostsCount}</span>
          )}
        </button>
      )}

      {onViewCollections && (
        <button className="profile-view-collections" onClick={() => { onViewCollections(); onClose(); }}>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" style={{ flexShrink: 0 }}>
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          Open Collections
          {(stats?.collectionsCount ?? 0) > 0 && (
            <span className="profile-view-saved-count">{stats.collectionsCount}</span>
          )}
        </button>
      )}

      {onEditProfile && (
        <button className="profile-edit-btn" onClick={() => { onEditProfile(); onClose(); }}>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" style={{ flexShrink: 0 }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit Profile
        </button>
      )}

      <button className="profile-signout" onClick={() => { onSignOut(); onClose(); }}>
        Sign out
      </button>
    </div>
  );
}
