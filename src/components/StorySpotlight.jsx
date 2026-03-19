export default function StorySpotlight({ story, onOpen }) {
  return (
    <div className="story-spotlight col-12 col-lg-7">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Spotlight</p>
          <h2>Selected story card</h2>
        </div>
      </div>
      <div className="spotlight-card glass-panel">
        <div className="spotlight-copy">
          <p className="discover-label">{story.location}</p>
          <h2>{story.title}</h2>
          <img className="spotlight-image" src={story.image} alt={story.alt} />
          <p>{story.detail}</p>
          <div className="spotlight-actions">
            <button
              type="button"
              className={`card-button ${story.accent}`}
              onClick={() => onOpen(story.id)}
            >
              Open card view
            </button>
            <a className="ghost-link" href={`posts/${story.slug}`}>
              Open blog page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
