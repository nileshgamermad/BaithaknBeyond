export default function StoryModal({ story, onClose }) {
  return (
    <div
      className="story-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <article
        className="story-modal glass-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Close quick view"
          onClick={onClose}
        >
          ×
        </button>
        <img src={story.image} alt={story.alt} />
        <div className="story-modal-copy">
          <p className="story-tag">{story.categoryLabel}</p>
          <h2 id="story-modal-title">{story.title}</h2>
          <p className="story-location">{story.location}</p>
          <p>{story.excerpt}</p>
          <p>{story.detail}</p>
          <div className="story-actions">
            <a className={`card-button ${story.accent}`} href={`posts/${story.slug}`}>
              Read full story
            </a>
            <button type="button" className="ghost-link" onClick={onClose}>
              Close preview
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
