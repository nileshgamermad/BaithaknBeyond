export default function NavBar({ sections, activeSection, onSectionClick }) {
  return (
    <nav className="container site-container top-nav glass-panel" aria-label="Primary">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`nav-link ${activeSection === section.id ? 'active' : ''}`}
          onClick={() => onSectionClick(section.id)}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
