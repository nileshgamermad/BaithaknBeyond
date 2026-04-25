import { useState } from 'react';
import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

/**
 * Props:
 *  story       — { id, title, excerpt, category, tag, image, readTime, author, authorAvatar, date }
 *  onOpen      — (story) => void
 *  onBookmark  — (id) => void
 *  bookmarked  — boolean
 *  featured    — boolean (large variant)
 */
export default function StoryCard({ story, onOpen, onBookmark, bookmarked = false, featured = false }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const {
    title    = 'Untitled',
    excerpt  = '',
    category = '',
    tag      = '',
    image    = '',
    readTime = '',
    author   = '',
    date     = '',
  } = story || {};

  return (
    <motion.article
      style={{
        ...styles.card,
        ...(featured ? styles.cardFeatured : {}),
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onOpen?.(story)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease }}
      layout
    >

      {/* Image */}
      <div style={styles.imageWrap}>
        {image && !imgError ? (
          <motion.img
            src={image}
            alt={title}
            style={styles.image}
            animate={{ scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.5, ease }}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div style={styles.imageFallback}>
            <FallbackIcon />
          </div>
        )}

        {/* Gradient overlay — deepens on hover */}
        <motion.div
          style={styles.overlay}
          animate={{ opacity: hovered ? 0.85 : 0.6 }}
          transition={{ duration: 0.3 }}
        />

        {/* Category badge */}
        {category && (
          <div style={styles.badge}>
            {category}
          </div>
        )}

        {/* Bookmark button */}
        <motion.button
          style={{
            ...styles.bookmarkBtn,
            ...(bookmarked ? styles.bookmarkActive : {}),
          }}
          onClick={(e) => { e.stopPropagation(); onBookmark?.(story.id); }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
        >
          <BookmarkIcon filled={bookmarked} />
        </motion.button>

        {/* Read time — appears on hover */}
        {readTime && (
          <motion.div
            style={styles.readTime}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 4 }}
            transition={{ duration: 0.25 }}
          >
            {readTime} min read
          </motion.div>
        )}
      </div>

      {/* Body */}
      <div style={styles.body}>
        {tag && <span style={styles.tag}>{tag}</span>}

        <h3 style={styles.title}>{title}</h3>

        {excerpt && (
          <p style={styles.excerpt}>{excerpt}</p>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.meta}>
            {author && <span style={styles.author}>{author}</span>}
            {author && date && <span style={styles.dot}>·</span>}
            {date && <span style={styles.date}>{date}</span>}
          </div>

          <motion.button
            style={styles.readBtn}
            animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0.6 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => { e.stopPropagation(); onOpen?.(story); }}
            aria-label="Read story"
          >
            Read →
          </motion.button>
        </div>
      </div>

    </motion.article>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function FallbackIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--color-surface, #fff)',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
    border: '1px solid var(--color-border, #E4DED4)',
    transition: 'box-shadow 0.3s ease',
    willChange: 'transform',
  },
  cardFeatured: {
    flexDirection: 'row',
    minHeight: '280px',
  },
  imageWrap: {
    position: 'relative',
    aspectRatio: '16/10',
    overflow: 'hidden',
    backgroundColor: 'var(--color-bg-raised, #F2EFE9)',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg-raised, #F2EFE9)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(15,14,12,0.9) 0%, rgba(15,14,12,0.3) 50%, transparent 100%)',
    pointerEvents: 'none',
  },
  badge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'rgba(107,122,82,0.9)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    fontSize: '10px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: '100px',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(8px)',
    border: 'none',
    borderRadius: '50%',
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.8)',
  },
  bookmarkActive: {
    background: 'rgba(107,122,82,0.85)',
    color: '#fff',
  },
  readTime: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(8px)',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '11px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: '100px',
  },
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  tag: {
    fontSize: '11px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--color-amber, #B85C38)',
  },
  title: {
    margin: 0,
    fontSize: '1.05rem',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    lineHeight: 1.35,
    color: 'var(--color-ink, #1C1917)',
    letterSpacing: '-0.01em',
  },
  excerpt: {
    margin: 0,
    fontSize: '0.87rem',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.65,
    color: 'var(--color-ink-3, #78716C)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid var(--color-border, #E4DED4)',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  author: {
    fontSize: '12px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    color: 'var(--color-ink-2, #44403C)',
  },
  dot: {
    color: 'var(--color-ink-4, #A8A29E)',
    fontSize: '12px',
  },
  date: {
    fontSize: '12px',
    fontFamily: "'Inter', sans-serif",
    color: 'var(--color-ink-4, #A8A29E)',
  },
  readBtn: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    color: 'var(--color-sage, #6B7A52)',
    cursor: 'pointer',
    padding: 0,
  },
};
