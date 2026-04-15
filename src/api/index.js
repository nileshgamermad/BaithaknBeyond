const BASE = import.meta.env.VITE_API_URL || 'https://baithakn-beyond-backend.onrender.com/api';

// ── Stories ──────────────────────────────────────────────────────────────────

export const fetchStories = async () => {
  const res = await fetch(`${BASE}/stories`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
};

export const fetchStory = async (id) => {
  const res = await fetch(`${BASE}/stories/${id}`);
  if (!res.ok) throw new Error('Story not found');
  return res.json();
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export const register = async (name, email, password) => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  return data;
};

export const login = async (email, password) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
};

export const getMe = async (token) => {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
};

// ── Bookmarks ─────────────────────────────────────────────────────────────────

// Returns the array of saved story IDs for the authenticated user
export const fetchBookmarks = async (token) => {
  const res = await fetch(`${BASE}/bookmarks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
};

// Toggles a story bookmark server-side; returns the updated array of IDs
export const toggleBookmarkApi = async (token, storyId) => {
  const res = await fetch(`${BASE}/bookmarks/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ storyId }),
  });
  if (!res.ok) throw new Error('Failed to toggle bookmark');
  return res.json();
};

// ── Personalization ───────────────────────────────────────────────────────────

// Fire-and-forget: records a story interaction for personalization scoring.
// Never throws — caller doesn't need to await or handle errors.
export const recordInteraction = (token, { storyId, category, type }) => {
  if (!token || !storyId || !category || !type) return;
  fetch(`${BASE}/interactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ storyId, category, type }),
  }).catch(() => {}); // silently swallow network errors
};

// ── Token helpers ─────────────────────────────────────────────────────────────

export const saveToken  = (token) => localStorage.setItem('baithak-token', token);
export const getToken   = ()      => localStorage.getItem('baithak-token');
export const clearToken = ()      => localStorage.removeItem('baithak-token');
