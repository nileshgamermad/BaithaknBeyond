import { useEffect, useMemo, useState } from 'react';
import { stories as staticStories } from './data/index.js';
import { fetchStories, fetchTags } from './api/index.js';
import { findStoriesByTag, getTagPath } from './discovery.js';

export default function TagPageApp() {
  const [stories, setStories] = useState(staticStories);
  const [allTags, setAllTags] = useState([]);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('baithak-theme') || 'light'; }
    catch { return 'light'; }
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    try { localStorage.setItem('baithak-theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    fetchStories()
      .then((data) => setStories(data.items?.length ? data.items : staticStories))
      .catch(() => setStories(staticStories));
    fetchTags().then(setAllTags).catch(() => setAllTags([]));
  }, []);

  const tagSlug = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[1] || '';
  }, []);

  const matchingStories = useMemo(() => findStoriesByTag(stories, tagSlug), [stories, tagSlug]);
  const tagLabel = useMemo(
    () => allTags.find((tag) => getTagPath(tag).includes(`/${tagSlug}/`)) || tagSlug.replace(/-/g, ' '),
    [allTags, tagSlug]
  );

  return (
    <div className="page-shell">
      <main className="container site-container" style={{ paddingTop: '48px', paddingBottom: '72px' }}>
        <section className="collections-hub">
          <div className="collections-hero glass-panel">
            <div>
              <p className="section-kicker">Tag discovery</p>
              <h1>#{tagLabel}</h1>
              <p className="collections-hero-copy">
                Explore every story connected to this topic and keep following the thread.
              </p>
            </div>
            <a className="ghost-link collections-home-link" href="/">Back to homepage</a>
          </div>

          {matchingStories.length === 0 ? (
            <div className="collections-empty glass-panel">
              <h3>No stories under this tag yet.</h3>
              <p>Try another tag from the homepage or keep exploring the latest stories.</p>
            </div>
          ) : (
            <div className="collections-story-grid">
              {matchingStories.map((story) => (
                <a key={story.id} className="collections-story-card" href={`/posts/${story.slug}`}>
                  <div className="collections-story-media">
                    <img src={story.image} alt={story.alt} loading="lazy" />
                  </div>
                  <div className="collections-story-copy">
                    <p className="story-location">{story.location}</p>
                    <h3>{story.title}</h3>
                    <p>{story.summary}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>

      <div className="theme-switch-bar">
        <button
          type="button"
          className="theme-switch"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
        >
          <span className="theme-switch-track">
            <span className={`theme-switch-thumb${theme === 'dark' ? ' is-dark' : ''}`} />
          </span>
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </div>
  );
}
