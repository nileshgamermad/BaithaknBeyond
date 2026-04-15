import { useEffect, useState } from 'react';

export default function ReadingProgress({ targetRef }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const target = targetRef.current;
      if (!target) {
        setProgress(0);
        return;
      }

      const rect = target.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset;
      const articleTop = scrollTop + rect.top;
      const articleHeight = target.offsetHeight;
      const viewportHeight = window.innerHeight;
      const totalScrollable = Math.max(articleHeight - viewportHeight * 0.45, 1);
      const current = scrollTop - articleTop + viewportHeight * 0.2;
      const nextProgress = Math.min(100, Math.max(0, (current / totalScrollable) * 100));

      setProgress(nextProgress);
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [targetRef]);

  return (
    <div className="reading-progress" aria-hidden="true">
      <div className="reading-progress__bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
