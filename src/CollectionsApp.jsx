import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { stories as staticStories } from './data/index.js';
import {
  clearToken,
  createCollectionApi,
  fetchCollections,
  fetchStories,
  getMe,
  getToken,
} from './api/index.js';
import AuthModal from './components/AuthModal.jsx';
import CollectionsView from './components/CollectionsView.jsx';

export default function CollectionsApp() {
  const [stories, setStories] = useState(staticStories);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('baithak-user') || 'null'); }
    catch { return null; }
  });
  const [collections, setCollections] = useState([]);
  const [authOpen, setAuthOpen] = useState(false);
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
      .then((data) => setStories(data.length ? data : staticStories))
      .catch(() => setStories(staticStories));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    getMe(token)
      .then((user) => {
        const merged = { ...user, token };
        setCurrentUser(merged);
        try { localStorage.setItem('baithak-user', JSON.stringify(merged)); } catch {}
      })
      .catch(() => {
        clearToken();
        try { localStorage.removeItem('baithak-user'); } catch {}
        setCurrentUser(null);
      });
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token || !currentUser?._id) {
      setCollections([]);
      return;
    }

    fetchCollections(token)
      .then(setCollections)
      .catch(() => setCollections([]));
  }, [currentUser?._id]);

  const featuredCollectionId = useMemo(() => collections[0]?.id || '', [collections]);

  const handleCreateCollection = async (name) => {
    const token = getToken();
    if (!token) {
      setAuthOpen(true);
      throw new Error('Sign in to create a collection.');
    }

    const created = await createCollectionApi(token, name.trim());
    setCollections((prev) => [created, ...prev]);
    return created;
  };

  const handleAuth = (userData) => {
    setCurrentUser(userData);
    try { localStorage.setItem('baithak-user', JSON.stringify(userData)); } catch {}
  };

  return (
    <>
      <div className="page-shell">
        <main className="container site-container" style={{ paddingTop: '48px', paddingBottom: '72px' }}>
          {currentUser ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <CollectionsView
                currentUser={currentUser}
                stories={stories}
                collections={collections}
                initialCollectionId={featuredCollectionId}
                onCreateCollection={handleCreateCollection}
                onOpenStory={(storyId) => {
                  const story = stories.find((item) => item.id === storyId);
                  if (story) window.location.href = `../posts/${story.slug}`;
                }}
                onNavigateHome={(event) => {
                  event.preventDefault();
                  window.location.href = '/';
                }}
              />
            </motion.div>
          ) : (
            <section className="profile-guest glass-panel" style={{ marginTop: '48px' }}>
              <p>Sign in to create collections and organize the stories you save.</p>
              <button type="button" className="nav-auth-btn" onClick={() => setAuthOpen(true)}>
                Sign in
              </button>
            </section>
          )}
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

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuth={handleAuth} />}
    </>
  );
}
