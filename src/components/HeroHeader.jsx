export default function HeroHeader({ logoSrc, searchTerm, onSearchChange, onExploreClick }) {
  return (
    <header className="hero-header" id="home">
      <div className="hero-backdrop"></div>
      <div className="container site-container intro">
        <div className="eyebrow-pill">Digital baithak for culture, food, and local travel</div>
        <img className="site-logo" src={logoSrc} alt="Baithak and Beyond logo" />
        <h1>Prayagraj stories with a warmer, more modern home online.</h1>
        <p className="brand-kicker">
          Browse heritage notes, food trails, and street-level city guides with immersive cards,
          quick previews, and full blog pages.
        </p>
        <div className="hero-toolbar glass-panel">
          <label className="search-shell" aria-label="Search posts">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm9.2 14.8 1.4 1.4-3.4-3.4 1.4-1.4 0.6 0.6Z"></path>
            </svg>
            <input
              type="search"
              placeholder="Search stories, food spots, or landmarks"
              value={searchTerm}
              onChange={onSearchChange}
            />
          </label>
          <button className="hero-cta" type="button" onClick={onExploreClick}>
            Explore Stories
          </button>
        </div>
      </div>
    </header>
  );
}
