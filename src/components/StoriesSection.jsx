import StoryCard from './StoryCard';

const filters = [
  { value: 'all', label: 'All Stories' },
  { value: 'history', label: 'History' },
  { value: 'food', label: 'Food' },
];

export default function StoriesSection({
  filteredStories,
  selectedStoryId,
  activeFilter,
  onFilterChange,
  onStoryOpen,
}) {
  return (
    <section className="section-stack" id="stories">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Featured journal</p>
        </div>
      </div>

      <div className="panel-row">
        <div className="filter-row" aria-label="Story filters">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`filter-chip ${activeFilter === filter.value ? 'active' : ''}`}
              onClick={() => onFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p className="result-copy">
          {filteredStories.length} post{filteredStories.length === 1 ? '' : 's'} matching your view
        </p>
      </div>

      <div className="story-grid row g-4">
        {filteredStories.map((story) => (
          <div key={story.id} className="col-12 col-md-6">
            <StoryCard
              story={story}
              isSelected={selectedStoryId === story.id}
              onOpen={onStoryOpen}
            />
          </div>
        ))}
      </div>

      {!filteredStories.length && (
        <div className="empty-state glass-panel">
          <h3>No posts match that search yet.</h3>
          <p>Try searching for a landmark, a food spot, or switch back to all stories.</p>
        </div>
      )}
    </section>
  );
}
