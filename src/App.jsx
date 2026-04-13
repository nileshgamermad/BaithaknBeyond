import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoDefault from './assets/logo.png';
import { sections, plannerOptions, plannerSuggestions, mapStops, stories as staticStories } from './data/index.js';
import { fetchStories, clearToken, getToken, fetchBookmarks, toggleBookmarkApi } from './api/index.js';
import AuthModal from './components/AuthModal.jsx';
import ProfileDropdown from './components/ProfileDropdown.jsx';

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

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
  const [bookmarks, setBookmarks] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [activeTag, setActiveTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stories, setStories] = useState(staticStories);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('baithak-user') || 'null'); }
    catch { return null; }
  });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("baithak-theme") || "light"; }
    catch { return "light"; }
  });

  // Theme sync
  useEffect(() => {
    document.body.dataset.theme = theme;
    try { localStorage.setItem("baithak-theme", theme); } catch {}
  }, [theme]);

  // Fetch stories from API, fall back to static data
  useEffect(() => {
    fetchStories()
      .then((data) => setStories(data.length ? data : staticStories))
      .catch(() => setStories(staticStories))
      .finally(() => setIsLoading(false));
  }, []);

  // Section intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-25% 0px -45% 0px", threshold: [0.2, 0.4, 0.6] }
    );
    sections.forEach((s) => {
      const n = document.getElementById(s.id);
      if (n) observer.observe(n);
    });
    return () => observer.disconnect();
  }, []);

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

  // Scroll: back to top
  useEffect(() => {
    const handle = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  // Skeleton
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Sync bookmarks from server whenever the logged-in user changes
  useEffect(() => {
    if (!currentUser) { setBookmarks([]); return; }
    const token = getToken();
    if (!token) return;
    fetchBookmarks(token).then(setBookmarks).catch(() => setBookmarks([]));
  }, [currentUser]);

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
          .join(" ").toLowerCase().includes(query);
      return matchesFilter && matchesTag && matchesSearch;
    });
  }, [activeFilter, searchTerm, activeTag, bookmarks]);

  const selectedStory = stories.find((s) => s.id === selectedStoryId) ?? stories[0];
  const modalStory   = stories.find((s) => s.id === modalStoryId)   ?? selectedStory;
  const plannerKey        = `${planner.mood}-${planner.time}`;
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

  const toggleBookmark = async (storyId) => {
    // Require sign-in
    if (!currentUser) { setAuthOpen(true); return; }

    const token = getToken();
    if (!token) return;

    // Optimistic update — flip immediately for snappy UX
    const prev = bookmarks;
    setBookmarks(prev.includes(storyId)
      ? prev.filter((id) => id !== storyId)
      : [...prev, storyId]);

    try {
      const updated = await toggleBookmarkApi(token, storyId);
      setBookmarks(updated); // authoritative server state
    } catch {
      setBookmarks(prev); // roll back on error
    }
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

  const handleAuth = (userData) => {
    setCurrentUser(userData);
    try { localStorage.setItem('baithak-user', JSON.stringify(userData)); } catch {}
  };

  const handleSignOut = () => {
    clearToken();
    try { localStorage.removeItem('baithak-user'); } catch {}
    setCurrentUser(null);
  };

  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <div className={`page-shell ${modalStoryId ? "is-blurred" : ""}`}>

        {/* ─── HERO ─── */}
        <header className="hero-header" id="home">
          <div className="hero-backdrop" />
          <div className="hero-orb orb-purple" />
          <div className="hero-orb orb-blue" />
          <div className="hero-orb orb-gold" />

          <motion.div
            className="container site-container intro"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="eyebrow-pill">
              Digital baithak for culture, food, and local travel
            </motion.div>

            <motion.img
              variants={fadeUp}
              className="site-logo"
              src={logoSrc}
              alt="Baithak and Beyond logo"
            />

            <motion.h1 variants={fadeUp}>
              Prayagraj stories with a warmer, more modern home online.
            </motion.h1>

            <motion.p variants={fadeUp} className="brand-kicker">
              Browse heritage notes, food trails, and street-level city guides with immersive
              cards, quick previews, and full blog pages.
            </motion.p>

            <motion.div variants={fadeUp} className="hero-toolbar glass-panel">
              <label className="search-shell" aria-label="Search posts">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm9.2 14.8 1.4 1.4-3.4-3.4 1.4-1.4 0.6 0.6Z" />
                </svg>
                <input
                  type="search"
                  placeholder="Search stories, food spots, or landmarks"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
            </motion.div>

            <motion.div variants={fadeUp} className="hero-actions">
              <motion.button
                className="hero-cta"
                type="button"
                onClick={() => jumpToSection("stories")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                Explore Stories
              </motion.button>
              {stories[0] && (
                <motion.a
                  className="hero-ghost"
                  href={`posts/${stories[0].slug}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Read Featured Article
                </motion.a>
              )}
            </motion.div>
          </motion.div>
        </header>

        {/* ─── NAV ─── */}
        <nav className="container site-container top-nav glass-panel" aria-label="Primary">
          <div className="nav-inner">

            {/* LEFT — Home, Stories (flex: 1 for true centering) */}
            <div className="nav-left">
              {sections
                .filter((s) => ['home', 'stories'].includes(s.id))
                .map((section) => (
                  <motion.button
                    key={section.id}
                    type="button"
                    className={`nav-link ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => jumpToSection(section.id)}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.93 }}
                  >
                    {section.label}
                  </motion.button>
                ))}
            </div>

            {/* CENTER — brand wordmark (in-flow, no absolute positioning) */}
            <button
              type="button"
              className="nav-brand"
              onClick={() => jumpToSection('home')}
              aria-label="Go to home"
            >
              Baithak &amp; Beyond
            </button>

            {/* RIGHT — Planner, Map, About + search + join/avatar + hamburger (flex: 1) */}
            <div className="nav-right">
              {/* Section links — hidden on mobile */}
              <div className="nav-links-right">
                {sections
                  .filter((s) => ['planner', 'map', 'about'].includes(s.id))
                  .map((section) => (
                    <motion.button
                      key={section.id}
                      type="button"
                      className={`nav-link ${activeSection === section.id ? 'active' : ''}`}
                      onClick={() => jumpToSection(section.id)}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.93 }}
                    >
                      {section.label}
                    </motion.button>
                  ))}
              </div>

              {/* Actions — search + auth + hamburger */}
              <div className="nav-actions">
                {/* Search icon — hidden on mobile */}
                <button
                  type="button"
                  className="nav-icon-btn"
                  aria-label="Search"
                  onClick={() => { jumpToSection('home'); setTimeout(() => { document.querySelector('.search-shell input')?.focus(); }, 350); }}
                >
                  <svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </button>

                {/* Auth */}
                {currentUser ? (
                  <div className="nav-user" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="nav-avatar-btn"
                      aria-label="Open profile"
                      onClick={() => setProfileOpen((o) => !o)}
                    >
                      {currentUser.avatar
                        ? <img className="nav-user-avatar" src={currentUser.avatar} alt={currentUser.name} referrerPolicy="no-referrer" />
                        : <span className="nav-user-initials">{userInitials}</span>
                      }
                    </button>
                    {profileOpen && (
                      <ProfileDropdown
                        user={currentUser}
                        bookmarkCount={bookmarks.length}
                        onSignOut={handleSignOut}
                        onClose={() => setProfileOpen(false)}
                      />
                    )}
                  </div>
                ) : (
                  <button type="button" className="nav-join-btn" onClick={() => setAuthOpen(true)}>
                    Join Now
                  </button>
                )}

                {/* Hamburger — mobile only */}
                <button
                  type="button"
                  className={`hamburger ${menuOpen ? 'is-open' : ''}`}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <span /><span /><span />
                </button>
              </div>
            </div>
          </div>

        </nav>

        {/* ─── MOBILE DRAWER ─── */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Scrim */}
              <motion.div
                className="mobile-drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => setMenuOpen(false)}
              />
              {/* Drawer */}
              <motion.div
                className="mobile-menu"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              >
                {/* Header */}
                <div className="mobile-drawer-header">
                  <span className="mobile-drawer-brand">Baithak &amp; Beyond</span>
                  <button
                    type="button"
                    className="mobile-drawer-close"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Links */}
                <nav className="mobile-drawer-links">
                  {sections
                    .filter((s) => s.id !== 'profile')
                    .map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        className={`mobile-nav-link ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => jumpToSection(section.id)}
                      >
                        {section.label}
                      </button>
                    ))}
                </nav>

                {/* Footer action */}
                {!currentUser && (
                  <div className="mobile-drawer-actions">
                    <button
                      type="button"
                      className="card-button"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => { setAuthOpen(true); setMenuOpen(false); }}
                    >
                      Join Now
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ─── MAIN ─── */}
        <main className="container site-container page-content">

          {/* Stories */}
          <section className="section-stack" id="stories">
            <motion.div
              className="section-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
            >
              <div><p className="section-kicker">Featured journal</p></div>
            </motion.div>

            {/* Category strip */}
            <div className="category-strip">
              {[
                { value: "all",     name: "All Stories",  label: "Browse"   },
                { value: "history", name: "Heritage",     label: "Category" },
                { value: "food",    name: "Food Trails",  label: "Category" },
              ].map((cat) => {
                const count =
                  cat.value === "all"
                    ? stories.length
                    : stories.filter((s) => s.category === cat.value).length;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    className={`category-tile ${activeFilter === cat.value ? "active" : ""}`}
                    onClick={() => { setActiveFilter(cat.value); setActiveTag(""); }}
                  >
                    <span className="category-tile-label">{cat.label}</span>
                    <span className="category-tile-name">{cat.name}</span>
                    <span className="category-tile-count">{count} {count === 1 ? "post" : "posts"}</span>
                  </button>
                );
              })}
            </div>

            <motion.div
              className="panel-row"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="filter-row" aria-label="Story filters">
                {[
                  { value: "all",        label: "All Stories" },
                  { value: "history",    label: "History" },
                  { value: "food",       label: "Food" },
                  { value: "bookmarked", label: `Saved (${bookmarks.length})` },
                ].map((filter) => (
                  <motion.button
                    key={filter.value}
                    type="button"
                    className={`filter-chip ${activeFilter === filter.value ? "active" : ""}`}
                    onClick={() => { setActiveFilter(filter.value); setActiveTag(""); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    {filter.label}
                  </motion.button>
                ))}
              </div>
              <p className="result-copy">
                {filteredStories.length} post{filteredStories.length === 1 ? "" : "s"} matching your view
              </p>
            </motion.div>

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

            <div className="story-grid row g-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="col-12 col-md-6">
                      <div className="story-card skeleton-card glass-panel">
                        <div className="skeleton skeleton-image" />
                        <div className="story-copy">
                          <div className="skeleton skeleton-line short" />
                          <div className="skeleton skeleton-line" />
                          <div className="skeleton skeleton-line medium" />
                        </div>
                      </div>
                    </div>
                  ))
                : filteredStories.map((story, i) => (
                    <motion.div
                      key={story.id}
                      className={i === 0 ? "col-12" : "col-12 col-md-6"}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.65, delay: i * 0.1, ease }}
                    >
                      <motion.article
                        className={`story-card glass-panel ${selectedStoryId === story.id ? "selected" : ""}${i === 0 ? " story-card--featured" : ""}`}
                        whileHover={{ y: i === 0 ? -5 : -8, scale: i === 0 ? 1.005 : 1.02, transition: { duration: 0.3, ease } }}
                      >
                        <div className="story-media">
                          <img src={story.image} alt={story.alt} />
                          <div className="story-badge-row">
                            <span className="story-tag">{story.categoryLabel}</span>
                            <div className="badge-right">
                              <span className="read-pill">{story.readTime}</span>
                              <motion.button
                                type="button"
                                className={`bookmark-btn ${bookmarks.includes(story.id) ? "bookmarked" : ""}`}
                                aria-label={bookmarks.includes(story.id) ? "Remove bookmark" : "Bookmark"}
                                onClick={() => toggleBookmark(story.id)}
                                whileHover={{ scale: 1.22 }}
                                whileTap={{ scale: 0.85 }}
                              >
                                {bookmarks.includes(story.id) ? "★" : "☆"}
                              </motion.button>
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
                            {i === 0 && <span className="featured-eyebrow">Featured Story</span>}
                            {i === 0 ? (
                              <>
                                <motion.a
                                  className={`card-button ${story.accent}`}
                                  href={`posts/${story.slug}`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Read Featured Article
                                </motion.a>
                                <motion.button
                                  type="button"
                                  className="ghost-link"
                                  onClick={() => openStory(story.id)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.96 }}
                                >
                                  Quick preview
                                </motion.button>
                              </>
                            ) : (
                              <>
                                <motion.button
                                  type="button"
                                  className={`card-button ${story.accent}`}
                                  onClick={() => openStory(story.id)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Quick View
                                </motion.button>
                                <a className="ghost-link" href={`posts/${story.slug}`}>
                                  Read full page
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    </motion.div>
                  ))}
            </div>

            {!isLoading && !filteredStories.length && (
              <motion.div
                className="empty-state glass-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease }}
              >
                <h3>No posts match that search yet.</h3>
                <p>Try searching for a landmark, a food spot, or switch back to all stories.</p>
              </motion.div>
            )}

            {!isLoading && filteredStories.length > 1 && (
              <motion.div
                className="section-cta-row"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease }}
              >
                <motion.button
                  type="button"
                  className="ghost-link"
                  onClick={() => jumpToSection("planner")}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Explore More Stories
                </motion.button>
              </motion.div>
            )}
          </section>

          {/* Planner + Spotlight */}
          <section className="content-with-sidebar row g-4 align-items-start" id="planner">
            <div className="col-12 col-xl-8">
              <section className="interactive-panel row g-4">
                <div className="story-spotlight col-12 col-lg-7">
                  <motion.div
                    className="section-heading"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease }}
                  >
                    <div>
                      <p className="section-kicker">Spotlight</p>
                      <h2>Selected story card</h2>
                    </div>
                  </motion.div>

                  <motion.div
                    className="spotlight-card glass-panel"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.65, delay: 0.1, ease }}
                  >
                    <div className="spotlight-copy">
                      <p className="discover-label">{selectedStory.location}</p>
                      <h2>{selectedStory.title}</h2>
                      <img className="spotlight-image" src={selectedStory.image} alt={selectedStory.alt} />
                      <p>{selectedStory.detail}</p>
                      <div className="spotlight-actions">
                        <motion.button
                          type="button"
                          className={`card-button ${selectedStory.accent}`}
                          onClick={() => openStory(selectedStory.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Open card view
                        </motion.button>
                        <a className="ghost-link" href={`posts/${selectedStory.slug}`}>
                          Open blog page
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.aside
                  className="planner-card glass-panel col-12 col-lg-5"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.65, delay: 0.2, ease }}
                >
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
                      onChange={(e) => setPlanner((c) => ({ ...c, mood: e.target.value }))}
                    >
                      {plannerOptions.mood.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="planner-field">
                    <span>Time</span>
                    <select
                      value={planner.time}
                      onChange={(e) => setPlanner((c) => ({ ...c, time: e.target.value }))}
                    >
                      {plannerOptions.time.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <div className="planner-result">
                    <strong>Suggested Start</strong>
                    <p>{plannerSuggestion}</p>
                  </div>
                </motion.aside>
              </section>
            </div>

            <aside className="col-12 col-xl-4">
              <motion.div
                className="recent-posts-panel glass-panel"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease }}
              >
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
              </motion.div>
            </aside>
          </section>

          {/* Map */}
          <section className="map-section" id="map">
            <motion.div
              className="section-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
            >
              <div>
                <p className="section-kicker">Real map integration</p>
                <h2>Map the stories directly into the city.</h2>
              </div>
            </motion.div>

            <div className="map-layout row g-4 align-items-stretch">
              <motion.div
                className="col-12 col-lg-8"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease }}
              >
                <div className="map-frame glass-panel">
                  <iframe
                    title={`Map of ${selectedStory.title}`}
                    src={selectedStory.mapEmbed}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </motion.div>

              <div className="col-12 col-lg-4">
                <div className="map-card-stack">
                  {mapStops.map((stop, i) => (
                    <motion.a
                      key={stop.title}
                      className="map-stop-card glass-panel"
                      href={stop.href}
                      target="_blank"
                      rel="noreferrer"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1, ease }}
                      whileHover={{ x: 5 }}
                    >
                      <span className="map-stop-kicker">Google Maps</span>
                      <strong>{stop.title}</strong>
                      <p>{stop.subtitle}</p>
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <motion.section
            className="discover-panel glass-panel"
            id="about"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
          >
            <div className="discover-copy">
              <p className="discover-label">About the platform</p>
              <h2>Built like a magazine, navigated like a modern landing page.</h2>
              <p>
                The homepage supports quick-view overlays, separate post pages, live search, and
                map-driven discovery while keeping the local tone at the center.
              </p>
            </div>
            <div className="discover-actions">
              <motion.a
                className="card-button"
                href="mailto:hello@baithakandbeyond.com"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contact
              </motion.a>
              <a className="ghost-link" href="posts/triveni-sangam.html">
                View sample blog page
              </a>
            </div>
          </motion.section>
          {/* Profile */}
          <motion.section
            className="profile-section"
            id="profile"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
          >
            <div className="section-heading">
              <div>
                <p className="section-kicker">Your account</p>
                <h2>Profile</h2>
              </div>
            </div>

            {currentUser ? (
              <div className="profile-card glass-panel">
                <div className="profile-card-photo-wrap">
                  {currentUser.avatar
                    ? <img className="profile-card-photo" src={currentUser.avatar} alt={currentUser.name} referrerPolicy="no-referrer" />
                    : <div className="profile-card-initials">
                        {currentUser.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                  }
                </div>
                <h3 className="profile-card-name">{currentUser.name}</h3>
                <p className="profile-card-joined">
                  Joined {currentUser.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'recently'}
                </p>
                <p className="profile-card-email">{currentUser.email}</p>
                <div className="profile-card-stats">
                  <div className="profile-card-stat">
                    <span>{bookmarks.length}</span>
                    <label>Saved stories</label>
                  </div>
                  <div className="profile-card-stat">
                    <span>{currentUser.role === 'admin' ? 'Admin' : 'Member'}</span>
                    <label>Account type</label>
                  </div>
                </div>
                <button type="button" className="profile-card-signout" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            ) : (
              <div className="profile-guest glass-panel">
                <p>Sign in to view your profile, saved stories, and more.</p>
                <button type="button" className="nav-auth-btn" onClick={() => setAuthOpen(true)}>
                  Sign in
                </button>
              </div>
            )}
          </motion.section>

        </main>

        {/* Footer */}
        <footer className="subscribe-bar">
          <div className="container site-container subscribe-inner">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
            >
              <p className="section-kicker footer-kicker">Stay in the loop</p>
              <h2>Join the Baithak</h2>
              <p>Subscribe for city stories, seasonal food notes, and travel routes from Prayagraj.</p>
            </motion.div>

            <AnimatePresence mode="wait">
              {emailSubmitted ? (
                <motion.div
                  key="success"
                  className="subscribe-success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <p>You are in! We will be in touch soon.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  className="subscribe-form"
                  onSubmit={handleEmailSubmit}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: 0.12, ease }}
                >
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <motion.button
                    type="submit"
                    className="subscribe-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Subscribe
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </footer>

        {/* Theme toggle */}
        <div className="theme-switch-bar">
          <button
            type="button"
            className="theme-switch"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            <span className="theme-switch-track">
              <span className={`theme-switch-thumb${theme === "dark" ? " is-dark" : ""}`} />
            </span>
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </div>

      {/* Back to top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            className="back-to-top"
            onClick={scrollToTop}
            aria-label="Back to top"
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 10 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.88 }}
            transition={{ duration: 0.25, ease }}
          >
            ↑
          </motion.button>
        )}
      </AnimatePresence>

      {/* Story modal */}
      <AnimatePresence>
        {modalStoryId && (
          <motion.div
            className="story-modal-backdrop"
            role="presentation"
            onClick={() => setModalStoryId("")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <motion.article
              className="story-modal glass-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="story-modal-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ duration: 0.38, ease }}
            >
              <motion.button
                type="button"
                className="modal-close"
                aria-label="Close quick view"
                onClick={() => setModalStoryId("")}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
              <img src={modalStory.image} alt={modalStory.alt} />
              <div className="story-modal-copy">
                <p className="story-tag">{modalStory.categoryLabel}</p>
                <h2 id="story-modal-title">{modalStory.title}</h2>
                <p className="story-location">{modalStory.location}</p>
                <p>{modalStory.excerpt}</p>
                <p>{modalStory.detail}</p>
                <div className="story-actions">
                  <motion.a
                    className={`card-button ${modalStory.accent}`}
                    href={`posts/${modalStory.slug}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Read full story
                  </motion.a>
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => setModalStoryId("")}
                  >
                    Close preview
                  </button>
                </div>
              </div>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onAuth={handleAuth}
        />
      )}
    </>
  );
}
