export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      type="button"
      className="theme-switch dark-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="theme-switch-track">
        <span className={`theme-switch-thumb ${theme === 'dark' ? 'is-dark' : ''}`}></span>
      </span>
      <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
}
