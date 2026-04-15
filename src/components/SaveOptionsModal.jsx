import { useEffect, useState } from 'react';
import './SaveOptionsModal.css';

export default function SaveOptionsModal({
  story,
  collections,
  onClose,
  onSaveDirect,
  onAddToCollection,
  onCreateCollection,
}) {
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || '');
  const [collectionName, setCollectionName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedCollectionId(collections[0]?.id || '');
  }, [collections]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [busy, onClose]);

  const handleDirectSave = async () => {
    setBusy(true);
    setError('');
    try {
      await onSaveDirect(story.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save this story.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddToCollection = async () => {
    setBusy(true);
    setError('');
    try {
      let collectionId = selectedCollectionId;

      if (!collectionId) {
        const created = await onCreateCollection(collectionName);
        collectionId = created.id;
      }

      await onAddToCollection(story.id, collectionId);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not add this story to a collection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="save-modal-backdrop" onClick={() => !busy && onClose()}>
      <div
        className="save-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="save-modal-close"
          onClick={onClose}
          disabled={busy}
          aria-label="Close save options"
        >
          ×
        </button>

        <p className="save-modal-kicker">Save story</p>
        <h2 id="save-modal-title">{story.title}</h2>
        <p className="save-modal-copy">
          Choose a quick save or place this story inside one of your collections.
        </p>

        <div className="save-modal-actions">
          <button
            type="button"
            className="save-modal-primary"
            onClick={handleDirectSave}
            disabled={busy}
          >
            Save directly
          </button>

          <div className="save-modal-panel">
            <label className="save-modal-label" htmlFor="collection-select">
              Add to collection
            </label>
            {collections.length > 0 ? (
              <select
                id="collection-select"
                className="save-modal-select"
                value={selectedCollectionId}
                onChange={(event) => setSelectedCollectionId(event.target.value)}
                disabled={busy}
              >
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <p className="save-modal-empty">Start creating collections.</p>
                <input
                  className="save-modal-input"
                  type="text"
                  placeholder="Collection name"
                  value={collectionName}
                  onChange={(event) => setCollectionName(event.target.value)}
                  disabled={busy}
                />
              </>
            )}
            <button
              type="button"
              className="save-modal-secondary"
              onClick={handleAddToCollection}
              disabled={busy || (!selectedCollectionId && !collectionName.trim())}
            >
              {collections.length > 0 ? 'Save to collection' : 'Create & save'}
            </button>
          </div>
        </div>

        {collections.length > 0 && (
          <div className="save-modal-create-row">
            <input
              className="save-modal-input"
              type="text"
              placeholder="New collection name"
              value={collectionName}
              onChange={(event) => setCollectionName(event.target.value)}
              disabled={busy}
            />
            <button
              type="button"
              className="save-modal-tertiary"
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  const created = await onCreateCollection(collectionName);
                  setCollectionName('');
                  setSelectedCollectionId(created.id);
                } catch (err) {
                  setError(err.message || 'Could not create collection.');
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy || !collectionName.trim()}
            >
              Create
            </button>
          </div>
        )}

        {error ? <p className="save-modal-error">{error}</p> : null}
      </div>
    </div>
  );
}
