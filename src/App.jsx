import { useEffect, useMemo, useState } from 'react';
import logoDefault from './assets/logo.png';
import { sections, stories, plannerOptions, plannerSuggestions, mapStops } from './data/index.js';

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedStoryId, setSelectedStoryId] = useState("triveni-sangam");
  const [modalStoryId, setModalStoryId] = useState("");
  const [planner, setPlanner] = useState({ mood: "food", time: "morning" });
  const [searchTerm, setSearchTerm] = useState("");
  const [logoSrc, setLogoSrc] = useState(logoDefault);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("baithak-theme") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-25% 0px -45% 0px",
        threshold: [0.2, 0.4, 0.6],
      }
    );

    sections.forEach((section) => {
      const node = document.getElementById(section.id);
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    try {
      localStorage.setItem("baithak-theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    let isCancelled = false;
    const sourceImage = new Image();

    sourceImage.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      canvas.width = sourceImage.naturalWidth;
      canvas.height = sourceImage.naturalHeight;
      context.drawImage(sourceImage, 0, 0);

      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = frame;

      for (let index = 0; index < data.length; index += 4) {
        const minChannel = Math.min(data[index], data[index + 1], data[index + 2]);

        if (minChannel >= 245) {
          data[index + 3] = 0;
          continue;
        }

        if (minChannel >= 220) {
          const alphaScale = (245 - minChannel) / 25;
          data[index + 3] = Math.round(data[index + 3] * alphaScale);
        }
      }

      context.putImageData(frame, 0, 0);

      if (!isCancelled) {
        setLogoSrc(canvas.toDataURL("image/png"));
      }
    };

    sourceImage.onerror = () => {
      if (!isCancelled) {
        setLogoSrc(logoDefault);
      }
    };

    sourceImage.src = logoDefault;

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", Boolean(modalStoryId));
    return () => document.body.classList.remove("modal-open");
  }, [modalStoryId]);

  const filteredStories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return stories.filter((story) => {
      const matchesFilter = activeFilter === "all" || story.category === activeFilter;
      const matchesSearch =
        !query ||
        [story.title, story.summary, story.detail, story.location, story.categoryLabel]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchTerm]);

  const selectedStory = stories.find((story) => story.id === selectedStoryId) ?? stories[0];
  const modalStory = stories.find((story) => story.id === modalStoryId) ?? selectedStory;
  const plannerKey = `${planner.mood}-${planner.time}`;
  const plannerSuggestion = plannerSuggestions[plannerKey];

  const jumpToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(sectionId);
  };

  const openStory = (storyId) => {
    setSelectedStoryId(storyId);
    setModalStoryId(storyId);
  };

  return (
    <>
      <div className={`page-shell ${modalStoryId ? "is-blurred" : ""}`}>
        <header className="hero-header" id="home">
          <div className="hero-backdrop"></div>
          <div className="container site-container intro">
            <div className="eyebrow-pill">Digital baithak for culture, food, and local travel</div>
            <img className="site-logo" src={logoSrc} alt="Baithak and Beyond logo" />
            <h1>Prayagraj stories with a warmer, more modern home online.</h1>
            <p className="brand-kicker">
              Browse heritage notes, food trails, and street-level city guides with immersive cards,
              quick previews, and full blog pages.
            </p>

            <div className="hero-toolbar glass-panel">
              <label className="search-shell" aria-label="Search posts">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm9.2 14.8 1.4 1.4-3.4-3.4 1.4-1.4 0.6 0.6Z"></path>
                </svg>
                <input
                  type="search"
                  placeholder="Search stories, food spots, or landmarks"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <button className="hero-cta" type="button" onClick={() => jumpToSection("stories")}>
                Explore Stories
              </button>
            </div>
          </div>
        </header>

        <nav className="container site-container top-nav glass-panel" aria-label="Primary">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`nav-link ${activeSection === section.id ? "active" : ""}`}
              onClick={() => jumpToSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <main className="container site-container page-content">
          <section className="section-stack" id="stories">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Featured journal</p>
              </div>
            </div>

            <div className="panel-row">
              <div className="filter-row" aria-label="Story filters">
                {[
                  { value: "all", label: "All Stories" },
                  { value: "history", label: "History" },
                  { value: "food", label: "Food" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={`filter-chip ${activeFilter === filter.value ? "active" : ""}`}
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <p className="result-copy">
                {filteredStories.length} post{filteredStories.length === 1 ? "" : "s"} matching your
                view
              </p>
            </div>

            <div className="story-grid row g-4">
              {filteredStories.map((story) => (
                <div key={story.id} className="col-12 col-md-6">
                  <article
                    className={`story-card glass-panel ${
                      selectedStoryId === story.id ? "selected" : ""
                    }`}
                  >
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
                          onClick={() => openStory(story.id)}
                        >
                          Quick View
                        </button>
                        <a className="ghost-link" href={`posts/${story.slug}`}>
                          Read full page
                        </a>
                      </div>
                    </div>
                  </article>
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

          <section className="content-with-sidebar row g-4 align-items-start" id="planner">
            <div className="col-12 col-xl-8">
              <section className="interactive-panel row g-4">
                <div className="story-spotlight col-12 col-lg-7">
                  <div className="section-heading">
                    <div>
                      <p className="section-kicker">Spotlight</p>
                      <h2>Selected story card</h2>
                    </div>
                  </div>
                  <div className="spotlight-card glass-panel">
                    <div className="spotlight-copy">
                      <p className="discover-label">{selectedStory.location}</p>
                      <h2>{selectedStory.title}</h2>
                      <img
                        className="spotlight-image"
                        src={selectedStory.image}
                        alt={selectedStory.alt}
                      />
                      <p>{selectedStory.detail}</p>
                      <div className="spotlight-actions">
                        <button
                          type="button"
                          className={`card-button ${selectedStory.accent}`}
                          onClick={() => openStory(selectedStory.id)}
                        >
                          Open card view
                        </button>
                        <a className="ghost-link" href={`posts/${selectedStory.slug}`}>
                          Open blog page
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="planner-card glass-panel col-12 col-lg-5">
                  <div className="section-heading planner-heading">
                    <div>
                      <p className="section-kicker">Trip switchboard</p>
                      <h2>Plan your visit</h2>
                    </div>
                  </div>
                  <p className="planner-copy">
                    Pick a mood and time of day to generate a locally grounded starting point.
                  </p>
                  <label className="planner-field">
                    <span>Mood</span>
                    <select
                      value={planner.mood}
                      onChange={(event) =>
                        setPlanner((current) => ({ ...current, mood: event.target.value }))
                      }
                    >
                      {plannerOptions.mood.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="planner-field">
                    <span>Time</span>
                    <select
                      value={planner.time}
                      onChange={(event) =>
                        setPlanner((current) => ({ ...current, time: event.target.value }))
                      }
                    >
                      {plannerOptions.time.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="planner-result">
                    <strong>Suggested Start</strong>
                    <p>{plannerSuggestion}</p>
                  </div>
                </aside>
              </section>
            </div>

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
                    <a
                      key={story.id}
                      href={`posts/${story.slug}`}
                      className={`recent-post-link ${selectedStoryId === story.id ? "active" : ""}`}
                    >
                      <span className="recent-post-category">{story.categoryLabel}</span>
                      <strong>{story.title}</strong>
                      <span>{story.location}</span>
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          <section className="map-section" id="map">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Real map integration</p>
                <h2>Map the stories directly into the city.</h2>
              </div>
            </div>

            <div className="map-layout row g-4 align-items-stretch">
              <div className="col-12 col-lg-8">
                <div className="map-frame glass-panel">
                  <iframe
                    title={`Map of ${selectedStory.title}`}
                    src={selectedStory.mapEmbed}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
              <div className="col-12 col-lg-4">
                <div className="map-card-stack">
                  {mapStops.map((stop) => (
                    <a
                      key={stop.title}
                      className="map-stop-card glass-panel"
                      href={stop.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="map-stop-kicker">Google Maps</span>
                      <strong>{stop.title}</strong>
                      <p>{stop.subtitle}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="discover-panel glass-panel" id="about">
            <div className="discover-copy">
              <p className="discover-label">About the platform</p>
              <h2>Built like a magazine, navigated like a modern landing page.</h2>
              <p>
                The homepage now supports dark mode, quick-view overlays, separate post pages, live
                search, and map-driven discovery while keeping the local tone at the center.
              </p>
            </div>
            <div className="discover-actions">
              <a className="card-button" href="mailto:hello@baithakandbeyond.com">
                Contact
              </a>
              <a className="ghost-link" href="posts/triveni-sangam.html">
                View sample blog page
              </a>
            </div>
          </section>
        </main>

        <footer className="subscribe-bar">
          <div className="container site-container subscribe-inner">
            <div>
              <p className="section-kicker footer-kicker">Stay in the loop</p>
              <h2>Join the Baithak</h2>
              <p>Subscribe for city stories, seasonal food notes, and travel routes from Prayagraj.</p>
            </div>
            <a className="subscribe-button" href="mailto:hello@baithakandbeyond.com">
              Subscribe
            </a>
          </div>
        </footer>

        <button
          type="button"
          className="theme-switch"
          onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <span className="theme-switch-track">
            <span className={`theme-switch-thumb ${theme === "dark" ? "is-dark" : ""}`}></span>
          </span>
          <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
        </button>
      </div>

      {modalStoryId && (
        <div
          className="story-modal-backdrop"
          role="presentation"
          onClick={() => setModalStoryId("")}
        >
          <article
            className="story-modal glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Close quick view"
              onClick={() => setModalStoryId("")}
            >
              ×
            </button>
            <img src={modalStory.image} alt={modalStory.alt} />
            <div className="story-modal-copy">
              <p className="story-tag">{modalStory.categoryLabel}</p>
              <h2 id="story-modal-title">{modalStory.title}</h2>
              <p className="story-location">{modalStory.location}</p>
              <p>{modalStory.excerpt}</p>
              <p>{modalStory.detail}</p>
              <div className="story-actions">
                <a className={`card-button ${modalStory.accent}`} href={`posts/${modalStory.slug}`}>
                  Read full story
                </a>
                <button type="button" className="ghost-link" onClick={() => setModalStoryId("")}>
                  Close preview
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
