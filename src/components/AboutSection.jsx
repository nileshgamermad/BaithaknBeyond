export default function AboutSection() {
  return (
    <section className="discover-panel glass-panel" id="about">
      <div className="discover-copy">
        <p className="discover-label">About the platform</p>
        <h2>Built like a magazine, navigated like a modern landing page.</h2>
        <p>
          The homepage now supports dark mode, quick-view overlays, separate post pages, live
          search, and map-driven discovery while keeping the local tone at the center.
        </p>
      </div>
      <div className="discover-actions">
        <a className="card-button" href="mailto:hello@baithakandbeyond.com">
          Contact
        </a>
        <a className="ghost-link" href="posts/triveni-sangam.html">
          View sample blog page
        </a>
      </div>
    </section>
  );
}
