const { useEffect, useMemo, useState } = React;

const sections = [
  { id: "home", label: "Home" },
  { id: "history", label: "History" },
  { id: "food", label: "Food" },
  { id: "travel", label: "Travel" },
  { id: "about", label: "About" },
];

const stories = [
  {
    id: "triveni-sangam",
    category: "history",
    title: "The Legends of Triveni Sangam",
    image: "https://dharmikbharatyatra.com/wp-content/uploads/2024/12/Boat-ride-in-prayagraj-1024x576.webp",
    alt: "Boats gathered near the riverbank",
    summary:
      "Walk through the layered myths, pilgrim rituals, and living memory that continue to shape the city's most sacred meeting point.",
    detail:
      "Morning boat rides, winter mist, and ritual gatherings make the Sangam one of Prayagraj's most emotional public spaces. It is a place where epic memory and daily devotion continue to overlap.",
    cta: "Read More",
    accent: "",
  },
  {
    id: "allahabad-fort",
    category: "history",
    title: "Inside Allahabad Fort",
    image: "https://www.optimatravels.com/images/allahabad-images/allahabad-fort-head.jpg",
    alt: "Historic fort architecture lit by sunlight",
    summary:
      "Discover the Mughal grandeur, hidden courtyards, and enduring riverfront presence of one of Prayagraj's most iconic landmarks.",
    detail:
      "Built under Akbar and shaped by later layers of use, the fort still anchors conversations about empire, spirituality, and the geography of the riverfront.",
    cta: "Read More",
    accent: "",
  },
  {
    id: "netram-kachori",
    category: "food",
    title: "The Legendary Netram Kachori",
    image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2f/c8/46/f9/caption.jpg?w=1000&h=1000&s=1",
    alt: "Fresh kachori served with curry",
    summary:
      "A crisp, comforting classic that locals swear by, served with spiced sabzi and stories that begin long before breakfast.",
    detail:
      "The charm is not only in the plate but in the ritual: early queues, familiar banter, and the warm feeling of eating something the city truly claims as its own.",
    cta: "Read More",
    accent: "gold",
  },
  {
    id: "chowk-street-food",
    category: "food",
    title: "Street Food of Chowk",
    image: "https://www.thecitizen.in/h-upload/old_images/1500x900_155909-c4a62b6e399ac05a08d9e8e5bb402dc6.webp",
    alt: "Busy Indian street food lane with shops and crowds",
    summary:
      "From quick chaat stops to deep-fried favourites, Chowk remains a delicious map of everyday life in the old city.",
    detail:
      "Every lane offers a different rhythm, from evening snack circuits to heritage sweet shops. It is the sort of place where local memory is passed down by recommendation.",
    cta: "Discover",
    accent: "gold",
  },
];

const plannerOptions = {
  mood: [
    { value: "calm", label: "Calm riverside" },
    { value: "heritage", label: "Heritage walk" },
    { value: "food", label: "Food trail" },
  ],
  time: [
    { value: "morning", label: "Morning" },
    { value: "afternoon", label: "Afternoon" },
    { value: "evening", label: "Evening" },
  ],
};

const plannerSuggestions = {
  "calm-morning": "Start at Triveni Sangam for a peaceful boat ride and soft morning light.",
  "calm-afternoon": "Take a slower riverfront detour and settle into a shaded baithak with chai.",
  "calm-evening": "Pick a sunset walk near the river and end with a quiet tea stop.",
  "heritage-morning": "Visit Allahabad Fort early, then continue toward older lanes before the crowds build.",
  "heritage-afternoon": "Spend the afternoon on a layered city walk through forts, shrines, and markets.",
  "heritage-evening": "Choose an old-city stroll with architecture spotting and a light snack stop.",
  "food-morning": "Begin at Netram for kachori, then wander toward sweet shops while the city wakes up.",
  "food-afternoon": "Build a compact tasting trail with chaat, lassi, and one classic local dessert.",
  "food-evening": "Head to Chowk for a fuller street-food circuit with the liveliest atmosphere.",
};

function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedStoryId, setSelectedStoryId] = useState("triveni-sangam");
  const [planner, setPlanner] = useState({ mood: "food", time: "morning" });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-30% 0px -45% 0px",
        threshold: [0.2, 0.4, 0.6],
      }
    );

    sections.forEach((section) => {
      const node = document.getElementById(section.id);
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, []);

  const filteredStories = useMemo(() => {
    if (activeFilter === "all") {
      return stories;
    }
    return stories.filter((story) => story.category === activeFilter);
  }, [activeFilter]);

  const selectedStory =
    stories.find((story) => story.id === selectedStoryId) ?? stories[0];

  const plannerKey = `${planner.mood}-${planner.time}`;
  const plannerSuggestion = plannerSuggestions[plannerKey];

  const jumpToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(sectionId);
  };

  return (
    <div className="page-shell">
      <header className="hero-header" id="home">
        <div className="container intro">
          <img className="site-logo" src="logo.png" alt="Baithak and Beyond logo" />
          <p className="brand-kicker">
            Stories, Culture, and Flavours from the Heart of Prayagraj
          </p>
          <div className="ornament" aria-hidden="true">
            <span></span>
            <i></i>
            <span></span>
          </div>
        </div>

        <section className="container hero-frame">
          <div className="hero-image-wrap">
            <img
              src="https://cdn.britannica.com/29/266229-050-F795307B/Sadhu-Hindu-holy-man-gestures-during-religious-procession-of-the-Niranjani-Akhara-ahead-of-Maha-Kumbh-Mela-Prayagraj-2025.jpg"
              alt="Hindu holy man gestures"
            />
          </div>
          <button className="hero-cta" type="button" onClick={() => jumpToSection("discover")}>
            Explore Prayagraj
          </button>
        </section>
      </header>

      <nav className="container top-nav" aria-label="Primary">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`nav-link ${activeSection === section.id ? "active" : ""} ${
              section.id === "discover" ? "nav-button" : ""
            }`}
            onClick={() => jumpToSection(section.id)}
          >
            {section.label}
          </button>
        ))}
        <button
          type="button"
          className="nav-link nav-button"
          onClick={() => jumpToSection("discover")}
        >
          Discover Prayagraj
        </button>
      </nav>

      <main className="container page-content">
        <section className="content-section" id="history">
          <div className="section-heading">
            <h2>Featured Stories</h2>
          </div>

          <div className="filter-row" aria-label="Story filters">
            {[
              { value: "all", label: "All Stories" },
              { value: "history", label: "History" },
              { value: "food", label: "Food" },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`filter-chip ${activeFilter === filter.value ? "active" : ""}`}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="story-grid">
            {filteredStories.map((story) => (
              <article
                key={story.id}
                className={`story-card ${selectedStoryId === story.id ? "selected" : ""}`}
              >
                <img src={story.image} alt={story.alt} />
                <div className="story-copy">
                  <p className="story-tag">
                    {story.category === "history" ? "Heritage Story" : "Food Story"}
                  </p>
                  <h3>{story.title}</h3>
                  <p>{story.summary}</p>
                  <div className="story-actions">
                    <button
                      type="button"
                      className={`card-button ${story.accent}`}
                      onClick={() => setSelectedStoryId(story.id)}
                    >
                      {selectedStoryId === story.id ? "Selected" : story.cta}
                    </button>
                    <button
                      type="button"
                      className="story-toggle"
                      onClick={() =>
                        setSelectedStoryId((current) => (current === story.id ? "" : story.id))
                      }
                    >
                      {selectedStoryId === story.id ? "Hide Details" : "Quick View"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="interactive-panel">
          <div className="story-spotlight" id="travel">
            <div className="section-heading">
              <h2>Story Spotlight</h2>
            </div>
            <div className="spotlight-card">
              <img src={selectedStory.image} alt={selectedStory.alt} />
              <div className="spotlight-copy">
                <p className="discover-label">Now Exploring</p>
                <h2>{selectedStory.title}</h2>
                <p>{selectedStory.detail}</p>
                <button
                  type="button"
                  className={`card-button ${selectedStory.accent}`}
                  onClick={() => jumpToSection("discover")}
                >
                  Build This Route
                </button>
              </div>
            </div>
          </div>

          <aside className="planner-card">
            <div className="section-heading planner-heading">
              <h2>Plan Your Visit</h2>
            </div>
            <p className="planner-copy">
              Choose the mood and time of day, and the page will suggest a starting point.
            </p>
            <label className="planner-field">
              <span>Mood</span>
              <select
                value={planner.mood}
                onChange={(event) =>
                  setPlanner((current) => ({ ...current, mood: event.target.value }))
                }
              >
                {plannerOptions.mood.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="planner-field">
              <span>Time</span>
              <select
                value={planner.time}
                onChange={(event) =>
                  setPlanner((current) => ({ ...current, time: event.target.value }))
                }
              >
                {plannerOptions.time.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="planner-result">
              <strong>Suggested Start</strong>
              <p>{plannerSuggestion}</p>
            </div>
          </aside>
        </section>

        <section className="content-section" id="food">
          <div className="section-heading">
            <h2>Food Stories</h2>
          </div>
          <div className="food-callout">
            <p>
              Prayagraj tastes best when you follow the local rhythm: breakfast first, chatter
              second, and one extra plate you did not plan for.
            </p>
            <button
              type="button"
              className="ghost-link ghost-button"
              onClick={() => {
                setActiveFilter("food");
                jumpToSection("history");
              }}
            >
              Show Food Picks
            </button>
          </div>
        </section>

        <section className="discover-panel" id="discover">
          <div className="discover-copy">
            <p className="discover-label">Discover Prayagraj</p>
            <h2>Stories that feel rooted, warm, and unmistakably local.</h2>
            <p>
              Explore heritage walks, riverside rituals, neighbourhood food trails, and the
              quieter textures of a city that carries history in everyday life.
            </p>
          </div>
          <div className="discover-actions">
            <a className="card-button" href="mailto:hello@baithakandbeyond.com">
              Contact
            </a>
            <button
              type="button"
              className="ghost-link ghost-button"
              onClick={() => jumpToSection("about")}
            >
              Learn More
            </button>
          </div>
        </section>
      </main>

      <footer className="subscribe-bar" id="about">
        <div className="container subscribe-inner">
          <div>
            <h2>Join the Baithak!</h2>
            <p>Subscribe for stories, recipes, and travel notes from Prayagraj.</p>
          </div>
          <a className="subscribe-button" href="mailto:hello@baithakandbeyond.com">
            Subscribe
          </a>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
