import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoDefault from './assets/logo.png';
import { sections, plannerOptions, plannerSuggestions, mapStops, categories, stories as staticStories } from './data/index.js';
import {
  fetchStories,
  clearToken,
  getToken,
  getMe,
  fetchBookmarks,
  toggleBookmarkApi,
  recordInteraction,
  fetchCollections,
  createCollectionApi,
  addPostToCollectionApi,
  fetchUserStats,
} from './api/index.js';
import AuthModal from './components/AuthModal.jsx';
import ProfileDropdown from './components/ProfileDropdown.jsx';
import SaveOptionsModal from './components/SaveOptionsModal.jsx';
import CollectionsView from './components/CollectionsView.jsx';

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
  const [toast, setToast] = useState(null);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [userStats, setUserStats] = useState({ savedPostsCount: 0, postsReadCount: 0, collectionsCount: 0 });
  const [saveOptionsStoryId, setSaveOptionsStoryId] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('baithak-recent') || '[]'); }
    catch { return []; }
  });
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

  // ── Session validation on mount ───────────────────────────────────────────
  // We optimistically restore currentUser from localStorage so the UI renders
  // immediately. Then we verify the JWT against the backend. If it has expired
  // (7-day window) we sign the user out cleanly instead of silently failing.
  useEffect(() => {
    const token = getToken();
    if (!token) return; // not logged in — nothing to validate

    console.log('[Auth] Token found in storage, validating session…');
    getMe(token)
      .then((freshUser) => {
        // Server confirmed the token is valid — update with latest user data
        // (name / avatar may have changed). Keep the token in the object so
        // the stored shape stays consistent.
        console.log('[Auth] Session valid ✓  user:', freshUser.email, ' id:', freshUser._id);
        const merged = { ...freshUser, token };
        setCurrentUser(merged);
        try { localStorage.setItem('baithak-user', JSON.stringify(merged)); } catch {}
      })
      .catch((err) => {
        // 401 → token expired or tampered. Sign the user out.
        console.warn('[Auth] Session invalid, signing out:', err.message);
        clearToken();
        try { localStorage.removeItem('baithak-user'); } catch {}
        setCurrentUser(null);
      });
  }, []); // run exactly once on mount

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

  // ── Bookmark sync ────────────────────────────────────────────────────────
  // Keyed off _id (not the whole object) so it only re-fires when the
  // actual account changes, not on every user-object update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!currentUser?._id) { setBookmarks([]); return; }

    const token = getToken();
    if (!token) {
      console.warn('[Bookmarks] currentUser present but no token — cannot fetch');
      return;
    }

    console.log('[Bookmarks] Fetching for', currentUser.email, '(id:', currentUser._id + ')');
    fetchBookmarks(token)
      .then((ids) => {
        console.log('[Bookmarks] Loaded', ids.length, 'saved post(s):', ids);
        setBookmarks(ids);
      })
      .catch((err) => {
        console.error('[Bookmarks] Fetch failed:', err.message);
        setBookmarks([]);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]); // only re-run when the logged-in account changes

  useEffect(() => {
    if (!currentUser?._id) {
      setCollections([]);
      setUserStats({ savedPostsCount: 0, postsReadCount: 0, collectionsCount: 0 });
      return;
    }

    const token = getToken();
    if (!token) return;

    Promise.all([fetchCollections(token), fetchUserStats(token)])
      .then(([nextCollections, nextStats]) => {
        setCollections(nextCollections);
        setUserStats(nextStats);
      })
      .catch((err) => {
        console.error('[Ownership] Fetch failed:', err.message);
        setCollections([]);
        setUserStats({ savedPostsCount: 0, postsReadCount: 0, collectionsCount: 0 });
      });
  }, [currentUser?._id]);

  const allTags = useMemo(() => {
    const set = new Set();
    stories.forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return [...set];
  }, []);

  const trendingStories = useMemo(() => stories.filter((s) => s.trending), [stories]);
  const editorsPicks    = useMemo(() => stories.filter((s) => s.editorsPick), [stories]);
  const recentStories   = useMemo(
    () => recentlyViewed.map((id) => stories.find((s) => s.id === id)).filter(Boolean),
    [recentlyViewed, stories]
  );
  const savedStories    = useMemo(
    () => bookmarks.map((id) => stories.find((s) => s.id === id)).filter(Boolean),
    [bookmarks, stories]
  );

  // ── Personalization ──────────────────────────────────────────────────────
  // Compute per-category affinity scores entirely client-side from the two
  // signals we already have: bookmarks (weight 2) and reading history (weight 1).
  // No extra network request needed — scores update instantly as the user
  // saves/views stories. Backend records the same events for future server-side use.
  const categoryScores = useMemo(() => {
    const scores = {};
    bookmarks.forEach((id) => {
      const s = stories.find((x) => x.id === id);
      if (s?.category) scores[s.category] = (scores[s.category] || 0) + 2;
    });
    recentlyViewed.forEach((id) => {
      const s = stories.find((x) => x.id === id);
      if (s?.category) scores[s.category] = (scores[s.category] || 0) + 1;
    });
    return scores; // e.g. { food: 5, history: 2 }
  }, [bookmarks, recentlyViewed, stories]);

  // "For You" — stories that match the user's top categories, sorted by affinity.
  // Only populated once the user has at least one saved or viewed story.
  const forYouStories = useMemo(() => {
    if (!Object.keys(categoryScores).length) return [];
    return [...stories]
      .filter((s) => (categoryScores[s.category] || 0) > 0)
      .sort((a, b) => (categoryScores[b.category] || 0) - (categoryScores[a.category] || 0))
      .slice(0, 4);
  }, [categoryScores, stories]);

  // "Because You Liked X" — one group per top-2 categories, showing up to 3 stories each.
  const becauseYouLiked = useMemo(() => {
    return Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([cat]) => ({
        category: cat,
        label: categories.find((c) => c.id === cat)?.label || cat,
        stories: stories.filter((s) => s.category === cat).slice(0, 3),
      }))
      .filter((g) => g.stories.length > 0);
  }, [categoryScores, stories, categories]);

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
  const saveOptionsStory = stories.find((s) => s.id === saveOptionsStoryId) ?? null;
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
    // Prepend to reading history, keep max 6 unique entries
    setRecentlyViewed((prev) => {
      const isNewStory = !prev.includes(storyId);
      const updated = [storyId, ...prev.filter((id) => id !== storyId)].slice(0, 6);
      try { localStorage.setItem('baithak-recent', JSON.stringify(updated)); } catch {}
      if (currentUser && isNewStory) {
        setUserStats((stats) => ({ ...stats, postsReadCount: stats.postsReadCount + 1 }));
      }
      return updated;
    });
    // Record view interaction for personalisation (fire-and-forget, logged-in only)
    const token = getToken();
    if (token) {
      const story = stories.find((s) => s.id === storyId);
      if (story?.category) recordInteraction(token, { storyId, category: story.category, type: 'view' });
    }
  };

  const createCollection = async (name) => {
    if (!currentUser) {
      setAuthOpen(true);
      throw new Error('Sign in to create a collection.');
    }

    const token = getToken();
    if (!token) {
      setAuthOpen(true);
      throw new Error('Sign in to create a collection.');
    }

    const created = await createCollectionApi(token, name.trim());
    setCollections((prev) => [created, ...prev]);
    setUserStats((stats) => ({ ...stats, collectionsCount: stats.collectionsCount + 1 }));
    showToast(`Created ${created.name}`);
    return created;
  };

  const commitBookmark = async (storyId, shouldSave) => {
    if (!currentUser) {
      console.log('[Bookmark] Not signed in — opening auth modal');
      setAuthOpen(true);
      throw new Error('Sign in to save stories.');
    }

    const token = getToken();
    if (!token) {
      console.warn('[Bookmark] currentUser set but no token found — opening auth modal');
      setAuthOpen(true);
      throw new Error('Sign in to save stories.');
    }

    const snapshot = [...bookmarks];
    const wasBookmarked = snapshot.includes(storyId);
    if (wasBookmarked === shouldSave) return snapshot;

    const optimistic = shouldSave
      ? [...snapshot, storyId]
      : snapshot.filter((id) => id !== storyId);

    setBookmarks(optimistic);
    setUserStats((stats) => ({ ...stats, savedPostsCount: optimistic.length }));

    try {
      const updated = await toggleBookmarkApi(token, storyId);
      console.log('[Bookmark] Toggled', storyId, '→', shouldSave ? 'saved' : 'removed',
                  '| total saved:', updated.length);
      setBookmarks(updated);
      setUserStats((stats) => ({ ...stats, savedPostsCount: updated.length }));
      showToast(shouldSave ? '★  Saved to your collection' : 'Removed from saved');
      const story = stories.find((s) => s.id === storyId);
      if (story?.category) {
        recordInteraction(token, { storyId, category: story.category, type: shouldSave ? 'bookmark' : 'unbookmark' });
      }
      return updated;
    } catch (err) {
      console.error('[Bookmark] API call failed, rolling back:', err.message);
      setBookmarks(snapshot);
      setUserStats((stats) => ({ ...stats, savedPostsCount: snapshot.length }));
      throw err;
    }
  };

  const toggleBookmark = async (storyId) => {
    const shouldSave = !bookmarks.includes(storyId);
    return commitBookmark(storyId, shouldSave);
  };

  const handleBookmarkAction = (storyId) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }

    if (!getToken()) {
      setAuthOpen(true);
      return;
    }

    if (bookmarks.includes(storyId)) {
      toggleBookmark(storyId).catch(() => {});
      return;
    }

    setSaveOptionsStoryId(storyId);
  };

  const saveStoryDirect = async (storyId) => {
    await commitBookmark(storyId, true);
  };

  const addStoryToCollection = async (storyId, collectionId) => {
    const token = getToken();
    if (!token) {
      setAuthOpen(true);
      throw new Error('Sign in to save stories.');
    }

    if (!bookmarks.includes(storyId)) {
      await commitBookmark(storyId, true);
    }

    const updatedCollection = await addPostToCollectionApi(token, collectionId, storyId);
    setCollections((prev) => {
      const exists = prev.some((collection) => collection.id === updatedCollection.id);
      return exists
        ? prev.map((collection) => (collection.id === updatedCollection.id ? updatedCollection : collection))
        : [updatedCollection, ...prev];
    });
    showToast(`Saved to ${updatedCollection.name}`);
    return updatedCollection;
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

  // Auto-dismissing toast — id prevents stale timer from hiding a newer toast
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2800);
  };

  const handleAuth = (userData) => {
    setCurrentUser(userData);
    try { localStorage.setItem('baithak-user', JSON.stringify(userData)); } catch {}
  };

  const handleSignOut = () => {
    clearToken();
    try { localStorage.removeItem('baithak-user'); } catch {}
    setCurrentUser(null);
    setBookmarks([]);
    setCollections([]);
    setUserStats({ savedPostsCount: 0, postsReadCount: 0, collectionsCount: 0 });
    setSavedPanelOpen(false);
    setSaveOptionsStoryId('');
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
                        stats={userStats}
                        onSignOut={handleSignOut}
                        onClose={() => setProfileOpen(false)}
                        onViewSaved={() => { setSavedPanelOpen(true); setProfileOpen(false); }}
                        onViewCollections={() => { window.location.href = '/collections/'; }}
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

          {/* ─── For You ─── */}
          {forYouStories.length > 0 && (
            <motion.section
              className="section-stack for-you-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease }}
            >
              <div className="section-heading">
                <div>
                  <p className="section-kicker for-you-kicker">
                    {currentUser ? `Picked for you, ${currentUser.name?.split(' ')[0]}` : 'Based on your reading'}
                  </p>
                  <h2 className="for-you-heading">
                    <span className="for-you-spark" aria-hidden="true">✦</span> For You
                  </h2>
                </div>
                <span className="for-you-hint">
                  {Object.keys(categoryScores).length === 1
                    ? `You enjoy ${categories.find((c) => c.id === Object.keys(categoryScores)[0])?.label || Object.keys(categoryScores)[0]}`
                    : `${Object.keys(categoryScores).length} interests detected`}
                </span>
              </div>

              <div className="trending-strip">
                {forYouStories.map((story, i) => (
                  <motion.article
                    key={story.id}
                    className="trending-card"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.07, ease }}
                    whileHover={{ y: -5, transition: { duration: 0.25, ease } }}
                    onClick={() => openStory(story.id)}
                  >
                    <div className="trending-card-media">
                      <img src={story.image} alt={story.alt} loading="lazy" />
                      <div className="trending-overlay" />
                      <div className="trending-badges">
                        <span className="label-badge badge-for-you">For You</span>
                        <span className="read-pill">{story.readTime}</span>
                      </div>
                      <motion.button
                        type="button"
                        className={`bookmark-btn ${bookmarks.includes(story.id) ? 'bookmarked' : ''}`}
                        aria-label={bookmarks.includes(story.id) ? 'Remove bookmark' : 'Bookmark'}
                        onClick={(e) => { e.stopPropagation(); handleBookmarkAction(story.id); }}
                        whileHover={{ scale: 1.22 }}
                        whileTap={{ scale: 0.85 }}
                        style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
                      >
                        {bookmarks.includes(story.id) ? '★' : '☆'}
                      </motion.button>
                    </div>
                    <div className="trending-card-copy">
                      <p className="story-location">{story.location}</p>
                      <h3>{story.title}</h3>
                      <p>{story.summary}</p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          )}

          {/* ─── Continue Reading / Recently Viewed ─── */}
          {recentStories.length > 0 && (
            <motion.section
              className="section-stack continue-reading-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease }}
            >
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Pick up where you left off</p>
                  <h2>Recently Viewed</h2>
                </div>
                <motion.button
                  type="button"
                  className="ghost-link continue-clear-btn"
                  onClick={() => {
                    setRecentlyViewed([]);
                    try { localStorage.removeItem('baithak-recent'); } catch {}
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Clear history
                </motion.button>
              </div>

              <div className="trending-strip">
                {recentStories.map((story, i) => (
                  <motion.article
                    key={story.id}
                    className="trending-card"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.07, ease }}
                    whileHover={{ y: -5, transition: { duration: 0.25, ease } }}
                    onClick={() => openStory(story.id)}
                  >
                    <div className="trending-card-media">
                      <img src={story.image} alt={story.alt} loading="lazy" />
                      <div className="trending-overlay" />
                      <div className="trending-badges">
                        {i === 0
                          ? <span className="label-badge badge-continue">▶ Continue</span>
                          : <span className="label-badge badge-recent">Viewed</span>
                        }
                        <span className="read-pill">{story.readTime}</span>
                      </div>
                      <motion.button
                        type="button"
                        className={`bookmark-btn ${bookmarks.includes(story.id) ? 'bookmarked' : ''}`}
                        aria-label={bookmarks.includes(story.id) ? 'Remove bookmark' : 'Bookmark'}
                        onClick={(e) => { e.stopPropagation(); handleBookmarkAction(story.id); }}
                        whileHover={{ scale: 1.22 }}
                        whileTap={{ scale: 0.85 }}
                        style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
                      >
                        {bookmarks.includes(story.id) ? '★' : '☆'}
                      </motion.button>
                    </div>
                    <div className="trending-card-copy">
                      <p className="story-location">{story.location}</p>
                      <h3>{story.title}</h3>
                      <p>{story.summary}</p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          )}

          {/* Stories */}
          <section className="section-stack" id="stories">
            <motion.div
              className="section-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
            >
              <div>
                <p className="section-kicker">The full collection</p>
                <h2>Latest Stories</h2>
              </div>
            </motion.div>

            {/* ─── Trending Now ─── */}
            {trendingStories.length > 0 && (
              <motion.div
                className="trending-now"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
              >
                <div className="trending-header">
                  <span className="trending-title">
                    <span aria-hidden="true">🔥</span> Trending Now
                  </span>
                </div>
                <div className="trending-strip">
                  {trendingStories.map((story) => (
                    <motion.article
                      key={story.id}
                      className="trending-card"
                      whileHover={{ y: -5, transition: { duration: 0.25, ease } }}
                      onClick={() => openStory(story.id)}
                    >
                      <div className="trending-card-media">
                        <img src={story.image} alt={story.alt} loading="lazy" />
                        <div className="trending-overlay" />
                        <div className="trending-badges">
                          <span className="label-badge badge-trending">Trending</span>
                          <span className="read-pill">{story.readTime}</span>
                        </div>
                        <motion.button
                          type="button"
                          className={`bookmark-btn ${bookmarks.includes(story.id) ? 'bookmarked' : ''}`}
                          aria-label={bookmarks.includes(story.id) ? 'Remove bookmark' : 'Bookmark'}
                          onClick={(e) => { e.stopPropagation(); handleBookmarkAction(story.id); }}
                          whileHover={{ scale: 1.22 }}
                          whileTap={{ scale: 0.85 }}
                          style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
                        >
                          {bookmarks.includes(story.id) ? '★' : '☆'}
                        </motion.button>
                      </div>
                      <div className="trending-card-copy">
                        <p className="story-location">{story.location}</p>
                        <h3>{story.title}</h3>
                        <p>{story.summary}</p>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </motion.div>
            )}

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
                            <div className="badge-left">
                              <span className="story-tag">{story.categoryLabel}</span>
                              {story.isNew && <span className="label-badge badge-new">New</span>}
                            </div>
                            <div className="badge-right">
                              <span className="read-pill">{story.readTime}</span>
                              <motion.button
                                type="button"
                                className={`bookmark-btn ${bookmarks.includes(story.id) ? "bookmarked" : ""}`}
                                aria-label={bookmarks.includes(story.id) ? "Remove bookmark" : "Bookmark"}
                                onClick={() => handleBookmarkAction(story.id)}
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

          {/* ─── Editor's Picks ─── */}
          {editorsPicks.length > 0 && (
            <section className="section-stack editors-picks-section">
              <motion.div
                className="section-heading"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
              >
                <div>
                  <p className="section-kicker">Curated reads</p>
                  <h2><span aria-hidden="true">⭐</span> Editor's Picks</h2>
                </div>
              </motion.div>

              <div className="editors-grid row g-4">
                {/* Large featured pick */}
                <motion.div
                  className="col-12 col-lg-7"
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.65, ease }}
                >
                  <article
                    className="editors-feature-card story-card"
                    onClick={() => openStory(editorsPicks[0].id)}
                  >
                    <div className="story-media">
                      <img src={editorsPicks[0].image} alt={editorsPicks[0].alt} loading="lazy" />
                      <div className="story-badge-row">
                        <div className="badge-left">
                          <span className="label-badge badge-editors">Editor's Pick</span>
                        </div>
                        <div className="badge-right">
                          <span className="read-pill">{editorsPicks[0].readTime}</span>
                          <motion.button
                            type="button"
                            className={`bookmark-btn ${bookmarks.includes(editorsPicks[0].id) ? 'bookmarked' : ''}`}
                            aria-label="Bookmark"
                            onClick={(e) => { e.stopPropagation(); handleBookmarkAction(editorsPicks[0].id); }}
                            whileHover={{ scale: 1.22 }}
                            whileTap={{ scale: 0.85 }}
                          >
                            {bookmarks.includes(editorsPicks[0].id) ? '★' : '☆'}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    <div className="story-copy editors-feature-copy">
                      <p className="story-location">{editorsPicks[0].location}</p>
                      <h3>{editorsPicks[0].title}</h3>
                      <p>{editorsPicks[0].detail}</p>
                      <div className="story-actions">
                        <motion.a
                          className={`card-button ${editorsPicks[0].accent}`}
                          href={`posts/${editorsPicks[0].slug}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Read Full Story
                        </motion.a>
                        <motion.button
                          type="button"
                          className="ghost-link"
                          onClick={(e) => { e.stopPropagation(); openStory(editorsPicks[0].id); }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          Quick preview
                        </motion.button>
                      </div>
                    </div>
                  </article>
                </motion.div>

                {/* Side picks */}
                <div className="col-12 col-lg-5">
                  <div className="editors-side-stack">
                    {editorsPicks.slice(1).map((story, i) => (
                      <motion.article
                        key={story.id}
                        className="editors-side-card story-card"
                        initial={{ opacity: 0, x: 24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, delay: i * 0.12, ease }}
                        whileHover={{ y: -3, transition: { duration: 0.22 } }}
                        onClick={() => openStory(story.id)}
                      >
                        <div className="editors-side-media">
                          <img src={story.image} alt={story.alt} loading="lazy" />
                          <span className="label-badge badge-editors" style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>Pick</span>
                        </div>
                        <div className="editors-side-copy story-copy">
                          <p className="story-location">{story.location}</p>
                          <h3>{story.title}</h3>
                          <p>{story.summary}</p>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── Because You Liked ─── */}
          {becauseYouLiked.length > 0 && (
            <section className="section-stack because-section">
              {becauseYouLiked.map((group, gi) => (
                <motion.div
                  key={group.category}
                  className="because-group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: gi * 0.12, ease }}
                >
                  <div className="because-group-header">
                    <div>
                      <p className="section-kicker">Based on your activity</p>
                      <h2 className="because-heading">
                        More like <span className="because-category">{group.label}</span>
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="ghost-link"
                      onClick={() => { setActiveFilter(group.category); setActiveTag(''); jumpToSection('stories'); }}
                    >
                      See all →
                    </button>
                  </div>

                  <div className="trending-strip">
                    {group.stories.map((story, i) => (
                      <motion.article
                        key={story.id}
                        className="trending-card"
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: i * 0.07, ease }}
                        whileHover={{ y: -5, transition: { duration: 0.25, ease } }}
                        onClick={() => openStory(story.id)}
                      >
                        <div className="trending-card-media">
                          <img src={story.image} alt={story.alt} loading="lazy" />
                          <div className="trending-overlay" />
                          <div className="trending-badges">
                            <span className="label-badge badge-because">{group.label}</span>
                            <span className="read-pill">{story.readTime}</span>
                          </div>
                          <motion.button
                            type="button"
                            className={`bookmark-btn ${bookmarks.includes(story.id) ? 'bookmarked' : ''}`}
                            aria-label={bookmarks.includes(story.id) ? 'Remove bookmark' : 'Bookmark'}
                            onClick={(e) => { e.stopPropagation(); handleBookmarkAction(story.id); }}
                            whileHover={{ scale: 1.22 }}
                            whileTap={{ scale: 0.85 }}
                            style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
                          >
                            {bookmarks.includes(story.id) ? '★' : '☆'}
                          </motion.button>
                        </div>
                        <div className="trending-card-copy">
                          <p className="story-location">{story.location}</p>
                          <h3>{story.title}</h3>
                          <p>{story.summary}</p>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </motion.div>
              ))}
            </section>
          )}

          {/* ─── Category Preview ─── */}
          <section className="section-stack category-preview-section">
            <motion.div
              className="section-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
            >
              <div>
                <p className="section-kicker">Browse by interest</p>
                <h2>Explore categories</h2>
              </div>
            </motion.div>

            <div className="category-preview-grid row g-3">
              {categories.map((cat, i) => {
                const count = stories.filter((s) => s.category === cat.id).length;
                return (
                  <motion.div
                    key={cat.id}
                    className="col-6 col-lg-3"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease }}
                  >
                    <motion.button
                      type="button"
                      className="category-preview-card"
                      onClick={() => { setActiveFilter(cat.id); setActiveTag(''); jumpToSection('stories'); }}
                      whileHover={{ y: -5, transition: { duration: 0.22 } }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className="category-preview-img">
                        <img src={cat.image} alt={cat.label} loading="lazy" />
                        <div className="category-preview-overlay" />
                      </div>
                      <div className="category-preview-copy">
                        <span className="category-preview-name">{cat.label}</span>
                        <span className="category-preview-desc">{cat.description}</span>
                        {count > 0 && (
                          <span className="category-preview-count">
                            {count} {count === 1 ? 'story' : 'stories'}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <motion.section
            className="collections-section"
            id="collections"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease }}
          >
            {currentUser ? (
              <CollectionsView
                currentUser={currentUser}
                stories={stories}
                collections={collections}
                onCreateCollection={createCollection}
                onOpenStory={openStory}
              />
            ) : (
              <div className="profile-guest glass-panel">
                <p>Create collections once you sign in, then organize your saved stories however you like.</p>
                <div className="discover-actions">
                  <button type="button" className="nav-auth-btn" onClick={() => setAuthOpen(true)}>
                    Sign in
                  </button>
                  <a className="ghost-link" href="/collections/">
                    View collections page
                  </a>
                </div>
              </div>
            )}
          </motion.section>

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
                    <span>{userStats.savedPostsCount}</span>
                    <label>Saved stories</label>
                  </div>
                  <div className="profile-card-stat">
                    <span>{userStats.collectionsCount}</span>
                    <label>Collections</label>
                  </div>
                  <div className="profile-card-stat">
                    <span>{userStats.postsReadCount}</span>
                    <label>Stories read</label>
                  </div>
                </div>
                <div className="story-actions" style={{ justifyContent: 'center' }}>
                  <a className="card-button" href="/collections/">
                    Open collections
                  </a>
                  <button type="button" className="ghost-link" onClick={() => setSavedPanelOpen(true)}>
                    View saved posts
                  </button>
                </div>
                <p className="profile-card-role">
                  {currentUser.role === 'admin' ? 'Admin account' : 'Member account'}
                </p>
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

      {saveOptionsStory && (
        <SaveOptionsModal
          story={saveOptionsStory}
          collections={collections}
          onClose={() => setSaveOptionsStoryId('')}
          onSaveDirect={saveStoryDirect}
          onAddToCollection={addStoryToCollection}
          onCreateCollection={createCollection}
        />
      )}

      {/* ─── Saved Posts Panel ─── */}
      <AnimatePresence>
        {savedPanelOpen && (
          <>
            {/* Scrim */}
            <motion.div
              className="saved-panel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSavedPanelOpen(false)}
            />
            {/* Panel */}
            <motion.div
              className="saved-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            >
              {/* Header */}
              <div className="saved-panel-header">
                <div>
                  <p className="saved-panel-kicker">Your collection</p>
                  <h2 className="saved-panel-title">
                    Saved Stories
                    {savedStories.length > 0 && (
                      <span className="saved-panel-count">{savedStories.length}</span>
                    )}
                  </h2>
                </div>
                <button
                  type="button"
                  className="saved-panel-close"
                  aria-label="Close saved panel"
                  onClick={() => setSavedPanelOpen(false)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="saved-panel-body">
                {savedStories.length === 0 ? (
                  <div className="saved-panel-empty">
                    <div className="saved-panel-empty-icon">☆</div>
                    <h3>Save stories to see them here</h3>
                    <p>Tap the ☆ on any story to save it here for later, then sort them into collections.</p>
                    <motion.button
                      type="button"
                      className="card-button"
                      onClick={() => { setSavedPanelOpen(false); jumpToSection('stories'); }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      Browse Stories
                    </motion.button>
                    <a className="ghost-link" href="/collections/">
                      Open collections
                    </a>
                  </div>
                ) : (
                  <div className="saved-panel-grid">
                    {savedStories.map((story, i) => (
                      <motion.article
                        key={story.id}
                        className="saved-panel-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35, delay: i * 0.06, ease }}
                        onClick={() => { setSavedPanelOpen(false); openStory(story.id); }}
                      >
                        <div className="saved-panel-card-img">
                          <img src={story.image} alt={story.alt} loading="lazy" />
                          <span className="story-tag saved-panel-cat">{story.categoryLabel}</span>
                        </div>
                        <div className="saved-panel-card-copy">
                          <p className="story-location">{story.location}</p>
                          <h3>{story.title}</h3>
                          <p>{story.summary}</p>
                          <div className="saved-panel-card-actions">
                            <motion.button
                              type="button"
                              className="card-button"
                              style={{ fontSize: '0.74rem', padding: '8px 16px', minHeight: 36 }}
                              onClick={(e) => { e.stopPropagation(); setSavedPanelOpen(false); openStory(story.id); }}
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Quick view
                            </motion.button>
                            <motion.button
                              type="button"
                              className="ghost-link saved-remove-btn"
                              onClick={(e) => { e.stopPropagation(); toggleBookmark(story.id); }}
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Remove
                            </motion.button>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Toast Notification ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={`toast-notification toast-${toast.type}`}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.28, ease }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
