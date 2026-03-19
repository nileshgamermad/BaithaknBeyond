export default function StoryCard({ story, isSelected, onOpen }) {
  return (
    <article className={`story-card glass-panel ${isSelected ? 'selected' : ''}`}>
      <div className="story-media">
        <img src={story.image} alt={story.alt} />
        <div className="story-badge-row">
          <span className="story-tag">{story.categoryLabel}</span>
          <span className="read-pill">{story.readTime}</span>
        </div>
      </div>
      <div className="story-copy">
        <p className="story-location">{story.location}</p>
        <h3>{story.title}</h3>
        <p>{story.summary}</p>
        <div className="story-actions">
          <button
            type="button"
            className={`card-button ${story.accent}`}
            onClick={() => onOpen(story.id)}
          >
            Quick View
          </button>
          <a className="ghost-link" href={`posts/${story.slug}`}>
            Read full page
          </a>
        </div>
      </div>
    </article>
  );
}
