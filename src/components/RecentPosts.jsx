export default function RecentPosts({ stories, selectedStoryId, onSelect }) {
  return (
    <aside className="col-12 col-xl-4">
      <div className="recent-posts-panel glass-panel">
        <div className="section-heading recent-posts-heading">
          <div>
            <p className="section-kicker">Browse faster</p>
            <h2>Recent posts</h2>
          </div>
        </div>
        <div className="recent-posts-list" aria-label="Recent posts">
          {stories.map((story) => (
            <button
              key={story.id}
              type="button"
              className={`recent-post-link ${selectedStoryId === story.id ? 'active' : ''}`}
              onClick={() => onSelect(story.id)}
            >
              <span className="recent-post-category">{story.categoryLabel}</span>
              <strong>{story.title}</strong>
              <span>{story.location}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
