import { useEffect, useMemo, useRef, useState } from 'react';
import logoDefault from './assets/logo.png';
import { sections, stories, plannerOptions, plannerSuggestions, mapStops } from './data/index.js';

function highlight(text, query) {
  if (!query) return text;
  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

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
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("baithak-bookmarks") || "[]");
    } catch {
      return [];
    }
  });
  const [navScrolled, setNavScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [activeTag, setActiveTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Section intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-25% 0px -45% 0px", threshold: [0.2, 0.4, 0.6] }
    );
    sections.forEach((s) => {
      const node = document.getElementById(s.id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);

  // Theme persistence
  useEffect(() => {
    document.body.dataset.theme = theme;
    try {
      localStorage.setItem("baithak-theme", theme);
    } catch {}
  }, [theme]);

  // Logo white-pixel removal
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = frame;
        for (let i = 0; i < data.length; i += 4) {
          const min = Math.min(data[i], data[i + 1], data[i + 2]);
          if (min >= 245) { data[i + 3] = 0; continue; }
          if (min >= 220) data[i + 3] = Math.round(data[i + 3] * (245 - min) / 25);
        }
        ctx.putImageData(frame, 0, 0);
        if (!cancelled) setLogoSrc(canvas.toDataURL("image/png"));
      } catch {
        if (!cancelled) setLogoSrc(logoDefault);
      }
    };
    img.onerror = () => { if (!cancelled) setLogoSrc(logoDefault); };
    img.src = logoDefault;
    return () => { cancelled = true; };
  }, []);

  // Modal body lock
  useEffect(() => {
    document.body.classList.toggle("modal-open", Boolean(modalStoryId));
    return () => document.body.classList.remove("modal-open");
  }, [modalStoryId]);

  // Scroll: nav shrink + back to top
  useEffect(() => {
    const handle = () => {
      setNavScrolled(window.scrollY > 60);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  // Skeleton loading
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem("baithak-bookmarks", JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  const cardsRef = useRef(null);

  const allTags = useMemo(() => {
    const set = new Set();
    stories.forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return [...set];
  }, []);

  const filteredStories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return stories.filter((story) => {
      const matchesFilter =
        activeFilter === "bookmarked"
          ? bookmarks.includes(story.id)
          : activeFilter === "all" || story.category === activeFilter;
      const matchesTag = !activeTag || story.tags?.includes(activeTag);
      const matchesSearch =
        !query ||
        [story.title, story.summary, story.detail, story.location, story.categoryLabel]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesFilter && matchesTag && matchesSearch;
    });
  }, [activeFilter, searchTerm, activeTag, bookmarks]);

  // Card scroll fade-in
  useEffect(() => {
    if (isLoading) return;
    const parent = cardsRef.current;
    if (!parent) return;
    const cards = parent.querySelectorAll('.story-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [filteredStories, isLoading]);

  const selectedStory = stories.find((s) => s.id === selectedStoryId) ?? stories[0];
  const modalStory = stories.find((s) => s.id === modalStoryId) ?? selectedStory;
  const plannerKey = `${planner.mood}-${planner.time}`;
  const plannerSuggestion = plannerSuggestions[plannerKey];
  const q = searchTerm.trim();

  const jumpToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
    setMenuOpen(false);
  };

  const openStory = (storyId) => {
    setSelectedStoryId(storyId);
    setModalStoryId(storyId);
  };

  const toggleBookmark = (storyId) => {
    setBookmarks((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem("baithak-subscribers") || "[]");
      localStorage.setItem("baithak-subscribers", JSON.stringify([...existing, email.trim()]));
    } catch {}
    setEmailSubmitted(true);
    setEmail("");
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

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
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
              <button className="hero-cta" type="button" onClick={() => jumpToSection("stories")}>
                Explore Stories
              </button>
            </div>
          </div>
        </header>

        <nav
          className={`container site-container top-nav glass-panel ${navScrolled ? "nav-scrolled" : ""}`}
          aria-label="Primary"
        >
          <div className="nav-links">
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
          </div>
          <button
            type="button"
            className={`hamburger ${menuOpen ? "is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          {menuOpen && (
            <div className="mobile-menu glass-panel">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`mobile-nav-link ${activeSection === section.id ? "active" : ""}`}
                  onClick={() => jumpToSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </div>
          )}
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
                  { value: "bookmarked", label: `Saved (${bookmarks.length})` },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={`filter-chip ${activeFilter === filter.value ? "active" : ""}`}
                    onClick={() => { setActiveFilter(filter.value); setActiveTag(""); }}
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

            {allTags.length > 0 && (
              <div className="tag-row" aria-label="Tag filters">
                <button
                  type="button"
                  className={`tag-pill ${!activeTag ? "active" : ""}`}
                  onClick={() => setActiveTag("")}
                >
                  All tags
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-pill ${activeTag === tag ? "active" : ""}`}
                    onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <div className="story-grid row g-4" ref={cardsRef}>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="col-12 col-md-6">
                      <div className="story-card skeleton-card glass-panel">
                        <div className="skeleton skeleton-image"></div>
                        <div className="story-copy">
                          <div className="skeleton skeleton-line short"></div>
                          <div className="skeleton skeleton-line"></div>
                          <div className="skeleton skeleton-line medium"></div>
                        </div>
                      </div>
                    </div>
                  ))
                : filteredStories.map((story) => (
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
                            <div className="badge-right">
                              <span className="read-pill">{story.readTime}</span>
                              <button
                                type="button"
                                className={`bookmark-btn ${bookmarks.includes(story.id) ? "bookmarked" : ""}`}
                                aria-label={
                                  bookmarks.includes(story.id)
                                    ? "Remove bookmark"
                                    : "Bookmark this story"
                                }
                                onClick={() => toggleBookmark(story.id)}
                              >
                                {bookmarks.includes(story.id) ? "★" : "☆"}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="story-copy">
                          <p className="story-location">{story.location}</p>
                          <h3>{highlight(story.title, q)}</h3>
                          <p>{highlight(story.summary, q)}</p>
                          {story.tags && (
                            <div className="story-tags">
                              {story.tags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  className={`tag-chip ${activeTag === tag ? "active" : ""}`}
                                  onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          )}
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

            {!isLoading && !filteredStories.length && (
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
                      onChange={(e) =>
                        setPlanner((c) => ({ ...c, mood: e.target.value }))
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
                      onChange={(e) =>
                        setPlanner((c) => ({ ...c, time: e.target.value }))
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
            {emailSubmitted ? (
              <div className="subscribe-success">
                <p>You are in! We will be in touch soon.</p>
              </div>
            ) : (
              <form className="subscribe-form" onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="subscribe-button">Subscribe</button>
              </form>
            )}
          </div>
        </footer>

        <button
          type="button"
          className="theme-switch"
          onClick={() => setTheme((c) => (c === "light" ? "dark" : "light"))}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <span className="theme-switch-track">
            <span className={`theme-switch-thumb ${theme === "dark" ? "is-dark" : ""}`}></span>
          </span>
          <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
        </button>
      </div>

      {showBackToTop && (
        <button
          type="button"
          className="back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}

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
            onClick={(e) => e.stopPropagation()}
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
