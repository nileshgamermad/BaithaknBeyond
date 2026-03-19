export default function MapSection({ selectedStory, mapStops }) {
  return (
    <section className="map-section" id="map">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Real map integration</p>
          <h2>Map the stories directly into the city.</h2>
        </div>
      </div>

      <div className="map-layout row g-4 align-items-stretch">
        <div className="col-12 col-lg-8">
          <div className="map-frame glass-panel">
            <iframe
              title={`Map of ${selectedStory.title}`}
              src={selectedStory.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="map-card-stack">
            {mapStops.map((stop) => (
              <a
                key={stop.title}
                className="map-stop-card glass-panel"
                href={stop.href}
                target="_blank"
                rel="noreferrer"
              >
                <span className="map-stop-kicker">Google Maps</span>
                <strong>{stop.title}</strong>
                <p>{stop.subtitle}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
