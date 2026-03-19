import { useEffect, useMemo, useState } from 'react';
import { sections } from './data/sections';
import { stories } from './data/stories';
import { plannerOptions, plannerSuggestions } from './data/planner';
import { mapStops } from './data/mapStops';
import HeroHeader from './components/HeroHeader';
import NavBar from './components/NavBar';
import StoriesSection from './components/StoriesSection';
import StorySpotlight from './components/StorySpotlight';
import TripPlanner from './components/TripPlanner';
import RecentPosts from './components/RecentPosts';
import MapSection from './components/MapSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import StoryModal from './components/StoryModal';
import ThemeToggle from './components/ThemeToggle';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedStoryId, setSelectedStoryId] = useState('triveni-sangam');
  const [modalStoryId, setModalStoryId] = useState('');
  const [planner, setPlanner] = useState({ mood: 'food', time: 'morning' });
  const [searchTerm, setSearchTerm] = useState('');
  const [logoSrc, setLogoSrc] = useState('logo.png');
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('baithak-theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-25% 0px -45% 0px', threshold: [0.2, 0.4, 0.6] }
    );

    sections.forEach((section) => {
      const node = document.getElementById(section.id);
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    try {
      localStorage.setItem('baithak-theme', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    let isCancelled = false;
    const sourceImage = new Image();

    sourceImage.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = sourceImage.naturalWidth;
      canvas.height = sourceImage.naturalHeight;
      context.drawImage(sourceImage, 0, 0);

      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = frame;

      for (let index = 0; index < data.length; index += 4) {
        const minChannel = Math.min(data[index], data[index + 1], data[index + 2]);
        if (minChannel >= 245) {
          data[index + 3] = 0;
          continue;
        }
        if (minChannel >= 220) {
          const alphaScale = (245 - minChannel) / 25;
          data[index + 3] = Math.round(data[index + 3] * alphaScale);
        }
      }

      context.putImageData(frame, 0, 0);
      if (!isCancelled) setLogoSrc(canvas.toDataURL('image/png'));
    };

    sourceImage.onerror = () => {
      if (!isCancelled) setLogoSrc('logo.png');
    };

    sourceImage.src = 'logo.png';
    return () => { isCancelled = true; };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('modal-open', Boolean(modalStoryId));
    return () => document.body.classList.remove('modal-open');
  }, [modalStoryId]);

  const filteredStories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return stories.filter((story) => {
      const matchesFilter = activeFilter === 'all' || story.category === activeFilter;
      const matchesSearch =
        !query ||
        [story.title, story.summary, story.detail, story.location, story.categoryLabel]
          .join(' ')
          .toLowerCase()
          .includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchTerm]);

  const selectedStory = stories.find((s) => s.id === selectedStoryId) ?? stories[0];
  const modalStory = stories.find((s) => s.id === modalStoryId) ?? selectedStory;
  const plannerSuggestion = plannerSuggestions[`${planner.mood}-${planner.time}`];

  const jumpToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
  };

  const openStory = (storyId) => {
    setSelectedStoryId(storyId);
    setModalStoryId(storyId);
  };

  return (
    <>
      <div className={`page-shell ${modalStoryId ? 'is-blurred' : ''}`}>
        <HeroHeader
          logoSrc={logoSrc}
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onExploreClick={() => jumpToSection('stories')}
        />
        <NavBar
          sections={sections}
          activeSection={activeSection}
          onSectionClick={jumpToSection}
        />
        <main className="container site-container page-content">
          <StoriesSection
            filteredStories={filteredStories}
            selectedStoryId={selectedStoryId}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onStoryOpen={openStory}
          />
          <section className="content-with-sidebar row g-4 align-items-start" id="planner">
            <div className="col-12 col-xl-8">
              <section className="interactive-panel row g-4">
                <StorySpotlight story={selectedStory} onOpen={openStory} />
                <TripPlanner
                  planner={planner}
                  plannerOptions={plannerOptions}
                  onPlannerChange={(key, value) =>
                    setPlanner((current) => ({ ...current, [key]: value }))
                  }
                  suggestion={plannerSuggestion}
                />
              </section>
            </div>
            <RecentPosts
              stories={stories}
              selectedStoryId={selectedStoryId}
              onSelect={setSelectedStoryId}
            />
          </section>
          <MapSection selectedStory={selectedStory} mapStops={mapStops} />
          <AboutSection />
        </main>
        <Footer />
        <ThemeToggle
          theme={theme}
          onToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        />
      </div>

      {modalStoryId && (
        <StoryModal story={modalStory} onClose={() => setModalStoryId('')} />
      )}
    </>
  );
}
