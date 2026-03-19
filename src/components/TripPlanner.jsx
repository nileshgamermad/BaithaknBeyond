export default function TripPlanner({ planner, plannerOptions, onPlannerChange, suggestion }) {
  return (
    <aside className="planner-card glass-panel col-12 col-lg-5">
      <div className="section-heading planner-heading">
        <div>
          <p className="section-kicker">Trip switchboard</p>
          <h2>Plan your visit</h2>
        </div>
      </div>
      <p className="planner-copy">
        Pick a mood and time of day to generate a locally grounded starting point.
      </p>
      <label className="planner-field">
        <span>Mood</span>
        <select
          value={planner.mood}
          onChange={(e) => onPlannerChange('mood', e.target.value)}
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
          onChange={(e) => onPlannerChange('time', e.target.value)}
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
        <p>{suggestion}</p>
      </div>
    </aside>
  );
}
