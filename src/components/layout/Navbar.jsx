import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

const NAV_LINKS = [
  { label: 'Stories',     href: '#stories'     },
  { label: 'Places',      href: '#map'          },
  { label: 'Collections', href: '#collections'  },
  { label: 'Plan',        href: '#planner'      },
  { label: 'About',       href: '#about'        },
];

export default function Navbar({ currentUser, theme, onToggleTheme, onAuthOpen, onProfileOpen }) {
  const [scrolled,     setScrolled]     = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [activeLink,   setActiveLink]   = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <motion.header
        style={{
          ...styles.header,
          ...(scrolled ? styles.headerScrolled : {}),
        }}
        initial={false}
        animate={{ backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)' }}
      >
        <div style={styles.inner}>

          {/* Brand */}
          <a href="#home" style={styles.brand}>
            <span style={styles.brandText}>Baithak</span>
            <span style={styles.brandAmp}>&nbsp;&amp;&nbsp;</span>
            <span style={styles.brandText}>Beyond</span>
          </a>

          {/* Desktop nav links */}
          <nav style={styles.nav}>
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                style={{
                  ...styles.navLink,
                  ...(activeLink === href ? styles.navLinkActive : {}),
                }}
                onClick={() => setActiveLink(href)}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div style={styles.actions}>

            {/* Theme toggle */}
            <motion.button
              style={styles.iconBtn}
              onClick={onToggleTheme}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </motion.button>

            {/* Auth */}
            {currentUser ? (
              <motion.button
                style={styles.avatar}
                onClick={onProfileOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open profile"
              >
                {currentUser.avatar
                  ? <img src={currentUser.avatar} alt="" style={styles.avatarImg} />
                  : <span style={styles.avatarInitial}>{currentUser.name?.[0] ?? '?'}</span>
                }
              </motion.button>
            ) : (
              <motion.button
                style={styles.signInBtn}
                onClick={onAuthOpen}
                whileHover={{ scale: 1.03, backgroundColor: '#7A8C60' }}
                whileTap={{ scale: 0.97 }}
              >
                Sign in
              </motion.button>
            )}

            {/* Mobile hamburger */}
            <motion.button
              style={styles.hamburger}
              onClick={() => setMenuOpen((v) => !v)}
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle menu"
            >
              <HamburgerIcon open={menuOpen} />
            </motion.button>

          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            style={styles.mobileMenu}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease }}
          >
            {NAV_LINKS.map(({ label, href }, i) => (
              <motion.a
                key={label}
                href={href}
                style={styles.mobileLink}
                onClick={() => { setActiveLink(href); setMenuOpen(false); }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25, ease }}
              >
                {label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function HamburgerIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open
        ? <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>
        : <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>
      }
    </svg>
  );
}

const styles = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    transition: 'background 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease',
  },
  headerScrolled: {
    background: 'rgba(var(--navbar-bg, 250,248,244), 0.85)',
    boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
  },
  brand: {
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'baseline',
    flexShrink: 0,
  },
  brandText: {
    fontSize: '1.1rem',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    color: 'var(--color-ink, #1C1917)',
    letterSpacing: '-0.01em',
  },
  brandAmp: {
    fontSize: '1rem',
    fontFamily: "'Playfair Display', Georgia, serif",
    color: 'var(--color-sage, #6B7A52)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    '@media (max-width: 767px)': { display: 'none' },
  },
  navLink: {
    padding: '6px 14px',
    fontSize: '0.9rem',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    color: 'var(--color-ink-2, #44403C)',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'background 0.18s, color 0.18s',
  },
  navLinkActive: {
    color: 'var(--color-sage, #6B7A52)',
    background: 'rgba(107,122,82,0.08)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-ink-2, #44403C)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    transition: 'background 0.18s',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '2px solid var(--color-sage, #6B7A52)',
    overflow: 'hidden',
    background: 'var(--color-bg-raised, #F2EFE9)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarInitial: {
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    color: 'var(--color-sage, #6B7A52)',
  },
  signInBtn: {
    background: 'var(--color-sage, #6B7A52)',
    color: '#fff',
    border: 'none',
    borderRadius: '100px',
    padding: '8px 20px',
    fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    cursor: 'pointer',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-ink, #1C1917)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    // Shown via media query in real CSS
  },
  mobileMenu: {
    position: 'fixed',
    top: '64px',
    left: 0,
    right: 0,
    zIndex: 99,
    background: 'var(--color-surface, #fff)',
    borderBottom: '1px solid var(--color-border, #E4DED4)',
    padding: '12px 24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  },
  mobileLink: {
    padding: '12px 16px',
    fontSize: '1rem',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    color: 'var(--color-ink, #1C1917)',
    textDecoration: 'none',
    borderRadius: '10px',
    transition: 'background 0.18s',
  },
};
