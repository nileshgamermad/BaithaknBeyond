import { useEffect, useState } from 'react';
import { fetchBookmarks, getToken, toggleBookmarkApi } from '../../src/api/index.js';

export default function SaveButton({ storyId }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token || !storyId) return;

    fetchBookmarks(token)
      .then((ids) => {
        setBookmarked(ids.includes(storyId));
      })
      .catch(() => {});
  }, [storyId]);

  const handleSave = async () => {
    const token = getToken();
    if (!token) {
      setMessage('Sign in from the homepage to save this story.');
      return;
    }

    if (busy) return;

    const previous = bookmarked;
    setBusy(true);
    setBookmarked(!previous);
    setMessage('');

    try {
      const updated = await toggleBookmarkApi(token, storyId);
      const nextState = updated.includes(storyId);
      setBookmarked(nextState);
      setMessage(nextState ? 'Saved to your collection.' : 'Removed from your collection.');
    } catch {
      setBookmarked(previous);
      setMessage('Could not update your saved stories right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="save-button-wrap">
      <button
        type="button"
        className={`save-button${bookmarked ? ' is-saved' : ''}`}
        onClick={handleSave}
        disabled={busy}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? 'Remove from saved stories' : 'Save story'}
      >
        <span className="save-button__icon" aria-hidden="true">
          {bookmarked ? '★' : '☆'}
        </span>
        <span>{bookmarked ? 'Saved' : 'Save'}</span>
      </button>
      {message ? <p className="save-button__message">{message}</p> : null}
    </div>
  );
}
