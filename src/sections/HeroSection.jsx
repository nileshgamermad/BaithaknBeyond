import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

export default function HeroSection({ onSearch, onExplore }) {
  const [query, setQuery] = useState('');
  const ref  = useRef(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y       = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch?.(query.trim());
  };

  return (
    <section ref={ref} style={styles.section}>

      {/* Parallax background */}
      <motion.div style={{ ...styles.bg, y }} />

      {/* Grain texture overlay */}
      <div style={styles.grain} />

      {/* Gradient vignette */}
      <div style={styles.vignette} />

      <motion.div style={{ ...styles.content, opacity }}>

        {/* Kicker */}
        <motion.p
          style={styles.kicker}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
        >
          Stories from the heart of India
        </motion.p>

        {/* Headline */}
        <motion.h1
          style={styles.headline}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.2 }}
        >
          Where every lane<br />
          <em style={styles.headlineEm}>holds a story</em>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          style={styles.sub}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.35 }}
        >
          Discover Prayagraj through its food, culture, and living traditions —
          told by people who know every corner.
        </motion.p>

        {/* Search */}
        <motion.form
          onSubmit={handleSubmit}
          style={styles.searchWrap}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.45 }}
        >
          <div style={styles.searchInner}>
            <SearchIcon />
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search stories, places, food…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="submit" style={styles.searchBtn}>
                Search
              </button>
            )}
          </div>
        </motion.form>

        {/* CTAs */}
        <motion.div
          style={styles.ctas}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.55 }}
        >
          <motion.button
            style={styles.ctaPrimary}
            onClick={onExplore}
            whileHover={{ scale: 1.04, backgroundColor: '#7A8C60' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            Explore Stories
          </motion.button>
          <motion.button
            style={styles.ctaSecondary}
            whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.18)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            Plan a Visit
          </motion.button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          style={styles.stats}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.75 }}
        >
          {[
            { value: '120+', label: 'Stories' },
            { value: '40+',  label: 'Places' },
            { value: '18',   label: 'Neighbourhoods' },
          ].map(({ value, label }) => (
            <div key={label} style={styles.stat}>
              <span style={styles.statValue}>{value}</span>
              <span style={styles.statLabel}>{label}</span>
            </div>
          ))}
        </motion.div>

      </motion.div>

      {/* Scroll cue */}
      <motion.div
        style={styles.scrollCue}
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <ChevronDown />
      </motion.div>

    </section>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const styles = {
  section: {
    position: 'relative',
    minHeight: '100svh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#0F0E0C',
  },
  bg: {
    position: 'absolute',
    inset: '-10%',
    backgroundImage: 'url(/assets/hero-bg.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.45)',
    willChange: 'transform',
  },
  grain: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
    opacity: 0.4,
    pointerEvents: 'none',
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    padding: '0 24px',
    maxWidth: '720px',
    width: '100%',
  },
  kicker: {
    margin: '0 0 20px',
    fontSize: '12px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#A8BC82',
  },
  headline: {
    margin: '0 0 20px',
    fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    lineHeight: 1.1,
    color: '#F5F1EB',
    letterSpacing: '-0.02em',
  },
  headlineEm: {
    fontStyle: 'italic',
    color: '#C49A6C',
  },
  sub: {
    margin: '0 auto 36px',
    maxWidth: '540px',
    fontSize: '1.05rem',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.7,
    color: 'rgba(245,241,235,0.65)',
  },
  searchWrap: {
    margin: '0 auto 28px',
    width: '100%',
    maxWidth: '480px',
  },
  searchInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '100px',
    padding: '12px 20px',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '0.95rem',
    fontFamily: "'Inter', sans-serif",
    color: '#F5F1EB',
    minWidth: 0,
  },
  searchBtn: {
    background: '#6B7A52',
    color: '#fff',
    border: 'none',
    borderRadius: '100px',
    padding: '6px 16px',
    fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  ctas: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '52px',
  },
  ctaPrimary: {
    background: '#6B7A52',
    color: '#fff',
    border: 'none',
    borderRadius: '100px',
    padding: '14px 32px',
    fontSize: '0.95rem',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.01em',
  },
  ctaSecondary: {
    background: 'rgba(255,255,255,0.1)',
    color: '#F5F1EB',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '100px',
    padding: '14px 32px',
    fontSize: '0.95rem',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  stats: {
    display: 'flex',
    gap: '40px',
    justifyContent: 'center',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '28px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '1.4rem',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    color: '#C49A6C',
  },
  statLabel: {
    fontSize: '0.75rem',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(245,241,235,0.45)',
  },
  scrollCue: {
    position: 'absolute',
    bottom: '32px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
  },
};
