import { useMemo, useState } from 'react';
import './CollectionsView.css';

export default function CollectionsView({
  stories,
  collections,
  currentUser,
  onCreateCollection,
  onOpenStory,
  onNavigateHome,
  initialCollectionId = '',
}) {
  const [draftName, setDraftName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState(initialCollectionId);

  const selectedCollection = useMemo(() => {
    if (!collections.length) return null;
    return collections.find((collection) => collection.id === selectedCollectionId) || collections[0];
  }, [collections, selectedCollectionId]);

  const collectionStories = useMemo(() => {
    if (!selectedCollection) return [];
    return selectedCollection.postIds
      .map((postId) => stories.find((story) => story.id === postId))
      .filter(Boolean);
  }, [selectedCollection, stories]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!draftName.trim()) return;

    setBusy(true);
    setError('');
    try {
      const created = await onCreateCollection(draftName);
      setDraftName('');
      setSelectedCollectionId(created.id);
    } catch (err) {
      setError(err.message || 'Could not create collection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="collections-hub">
      <div className="collections-hero glass-panel">
        <div>
          <p className="section-kicker">Ownership</p>
          <h1>{currentUser ? `${currentUser.name.split(' ')[0]}'s collections` : 'Collections'}</h1>
          <p className="collections-hero-copy">
            Organize saved stories into personal shelves you can revisit any time.
          </p>
        </div>
        {onNavigateHome ? (
          <a className="ghost-link collections-home-link" href="/" onClick={onNavigateHome}>
            Back to homepage
          </a>
        ) : null}
      </div>

      <div className="collections-layout">
        <div className="collections-sidebar glass-panel">
          <div className="collections-sidebar-header">
            <div>
              <p className="section-kicker">Your library</p>
              <h2>Collections</h2>
            </div>
            <span className="collections-count">{collections.length}</span>
          </div>

          <form className="collections-create-form" onSubmit={handleCreate}>
            <input
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="New collection name"
              disabled={busy}
            />
            <button type="submit" className="card-button" disabled={busy || !draftName.trim()}>
              Create
            </button>
          </form>

          {error ? <p className="collections-error">{error}</p> : null}

          {collections.length === 0 ? (
            <div className="collections-empty glass-panel">
              <h3>Start creating collections</h3>
              <p>Save stories into named spaces so the platform feels more like yours.</p>
            </div>
          ) : (
            <div className="collections-card-grid">
              {collections.map((collection) => {
                const previewStories = collection.previewPostIds
                  .map((postId) => stories.find((story) => story.id === postId))
                  .filter(Boolean);

                return (
                  <button
                    type="button"
                    key={collection.id}
                    className={`collection-card ${selectedCollection?.id === collection.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedCollectionId(collection.id)}
                  >
                    <div className="collection-card-preview">
                      {previewStories.length > 0 ? (
                        previewStories.map((story) => (
                          <img key={story.id} src={story.image} alt={story.alt} loading="lazy" />
                        ))
                      ) : (
                        <div className="collection-card-placeholder">No stories yet</div>
                      )}
                    </div>
                    <div className="collection-card-copy">
                      <strong>{collection.name}</strong>
                      <span>{collection.postCount} {collection.postCount === 1 ? 'post' : 'posts'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="collections-detail glass-panel">
          {selectedCollection ? (
            <>
              <div className="collections-detail-header">
                <div>
                  <p className="section-kicker">Single collection view</p>
                  <h2>{selectedCollection.name}</h2>
                </div>
                <span className="collections-detail-count">
                  {collectionStories.length} {collectionStories.length === 1 ? 'story' : 'stories'}
                </span>
              </div>

              {collectionStories.length === 0 ? (
                <div className="collections-empty collections-empty--detail">
                  <h3>Save stories to see them here</h3>
                  <p>Add stories to this collection from any save button across the site.</p>
                </div>
              ) : (
                <div className="collections-story-grid">
                  {collectionStories.map((story) => (
                    <article
                      key={story.id}
                      className="collections-story-card"
                      onClick={() => onOpenStory?.(story.id)}
                    >
                      <div className="collections-story-media">
                        <img src={story.image} alt={story.alt} loading="lazy" />
                      </div>
                      <div className="collections-story-copy">
                        <p className="story-location">{story.location}</p>
                        <h3>{story.title}</h3>
                        <p>{story.summary}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="collections-empty collections-empty--detail">
              <h3>Start creating collections</h3>
              <p>Your curated story shelves will appear here as soon as you create one.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
