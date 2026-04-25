import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

/**
 * Wraps any section and animates its children in when scrolled into view.
 *
 * Props:
 *   children   — content
 *   delay      — stagger delay in seconds (default 0)
 *   direction  — 'up' | 'down' | 'left' | 'right' (default 'up')
 *   className  — pass-through
 *   style      — pass-through
 */
export default function RevealSection({
  children,
  delay     = 0,
  direction = 'up',
  style,
}) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const offsets = {
    up:    { y: 40, x: 0  },
    down:  { y: -40, x: 0 },
    left:  { x: 40, y: 0  },
    right: { x: -40, y: 0 },
  };

  const { x = 0, y = 0 } = offsets[direction] || offsets.up;

  return (
    <motion.div
      ref={ref}
      style={style}
      initial={{ opacity: 0, y, x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered list — each child animates in sequentially.
 *
 * Usage:
 *   <StaggerList>
 *     {items.map(item => <Card key={item.id} ... />)}
 *   </StaggerList>
 */
export function StaggerList({ children, stagger = 0.08, style }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      style={style}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, style }) {
  return (
    <motion.div
      style={style}
      variants={{
        hidden:  { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}
