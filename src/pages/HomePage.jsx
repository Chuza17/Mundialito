const leaderboard = [
  { id: 1, name: 'Gabriel', points: 128, streak: '🔥 +12 esta semana' },
  { id: 2, name: 'Sofía', points: 121, streak: '⚽ acertó 3 partidos' },
  { id: 3, name: 'Andrés', points: 118, streak: '🎯 líder en grupos' },
  { id: 4, name: 'Mariana', points: 104, streak: '📈 subió 2 puestos' },
]

function HomePage() {
  return (
    <div className="page">
      <section className="hero-banner">
        <div className="hero-overlay">
          <span className="section-tag">Tablero principal</span>
          <h2>Bienvenido a El Mundialito</h2>
          <p>
            Sigue el ranking, revisa tu progreso y compite con tus amigos por el primer lugar.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h3>Top jugadores</h3>
          <span>Ranking general</span>
        </div>

        <div className="leaderboard-grid">
          {leaderboard.map((player, index) => (
            <div className="leader-card" key={player.id}>
              <div className="leader-top">
                <span className="leader-rank">#{index + 1}</span>
                <span className="leader-points">{player.points} pts</span>
              </div>
              <h4>{player.name}</h4>
              <p>{player.streak}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section two-columns">
        <div className="panel">
          <div className="section-header">
            <h3>Actividad reciente</h3>
          </div>
          <div className="list-item">Gabriel acertó el resultado de Argentina vs Japón</div>
          <div className="list-item">Sofía completó todos los grupos</div>
          <div className="list-item">Andrés ganó puntos extra en La mejenga del día</div>
        </div>

        <div className="panel">
          <div className="section-header">
            <h3>Tu resumen</h3>
          </div>
          <div className="stat-row">
            <span>Puntos actuales</span>
            <strong>87</strong>
          </div>
          <div className="stat-row">
            <span>Posición</span>
            <strong>#6</strong>
          </div>
          <div className="stat-row">
            <span>Predicciones completadas</span>
            <strong>5/8</strong>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage