export const slugifyTag = (tag) => tag.toLowerCase().trim().replace(/\s+/g, '-');

export const getTagPath = (tag) => `/tags/${slugifyTag(tag)}/`;

export const findStoriesByTag = (stories, tagSlug) =>
  stories.filter((story) => story.tags?.some((tag) => slugifyTag(tag) === tagSlug));

export const getRelatedStories = (stories, story, limit = 3) =>
  stories
    .filter((candidate) => candidate.id !== story.id)
    .map((candidate) => {
      const sharedTags = candidate.tags?.filter((tag) => story.tags?.includes(tag)).length || 0;
      const sameCategory = candidate.category === story.category ? 2 : 0;
      return { ...candidate, _score: sharedTags + sameCategory };
    })
    .filter((candidate) => candidate._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
