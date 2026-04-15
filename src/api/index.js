const BASE = import.meta.env.VITE_API_URL || 'https://baithakn-beyond-backend.onrender.com/api';

// ── Stories ──────────────────────────────────────────────────────────────────

export const fetchStories = async (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') searchParams.set(key, value);
  });

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const res = await fetch(`${BASE}/stories${suffix}`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  const data = await res.json();
  if (Array.isArray(data)) {
    return { items: data, total: data.length, hasMore: false };
  }
  return data;
};

export const fetchStory = async (id) => {
  const res = await fetch(`${BASE}/stories/${id}`);
  if (!res.ok) throw new Error('Story not found');
  return res.json();
};

export const fetchStorySuggestions = async (query) => {
  if (!query?.trim()) return { posts: [], categories: [], tags: [] };
  const res = await fetch(`${BASE}/stories/search/suggestions?q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) return { posts: [], categories: [], tags: [] };
  return res.json();
};

export const fetchRelatedStories = async (id) => {
  const res = await fetch(`${BASE}/stories/related/${id}`);
  if (!res.ok) return [];
  return res.json();
};

export const fetchTags = async () => {
  const res = await fetch(`${BASE}/stories/tags`);
  if (!res.ok) return [];
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

export const fetchCollections = async (token) => {
  const res = await fetch(`${BASE}/collections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
};

export const createCollectionApi = async (token, name) => {
  const res = await fetch(`${BASE}/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create collection');
  return data;
};

export const addPostToCollectionApi = async (token, collectionId, postId) => {
  const res = await fetch(`${BASE}/collections/${collectionId}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ postId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add post to collection');
  return data;
};

export const removePostFromCollectionApi = async (token, collectionId, postId) => {
  const res = await fetch(`${BASE}/collections/${collectionId}/posts/${postId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to remove post from collection');
  return data;
};

export const fetchUserStats = async (token) => {
  const res = await fetch(`${BASE}/users/me/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { savedPostsCount: 0, postsReadCount: 0, collectionsCount: 0 };
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
