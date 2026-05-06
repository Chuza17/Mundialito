function MatchOfDayPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="section-tag">La mejenga del día</span>
          <h2>Predice el partido destacado</h2>
          <p>Si aciertas el marcador exacto, ganas puntos extra.</p>
        </div>
      </div>

      <section className="match-card featured">
        <div className="match-meta">Hoy · 7:00 PM</div>

        <div className="match-teams">
          <div className="team-box">
            <h3>Costa Rica</h3>
            <input type="number" placeholder="0" className="score-input" />
          </div>

          <span className="vs-text">VS</span>

          <div className="team-box">
            <h3>México</h3>
            <input type="number" placeholder="0" className="score-input" />
          </div>
        </div>

        <div className="bonus-box">
          <strong>Bono:</strong> +15 puntos por marcador exacto
        </div>

        <button className="primary-action large-btn">Guardar predicción</button>
      </section>
    </div>
  )
}

export default MatchOfDayPage