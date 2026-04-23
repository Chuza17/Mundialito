const standings = [
  { name: 'Gabriela', points: 68, exact: 9, trend: 'Subio 2 puestos' },
  { name: 'Diego', points: 64, exact: 8, trend: 'Se mantiene' },
  { name: 'Sofi', points: 61, exact: 7, trend: 'Subio 1 puesto' },
  { name: 'Carlos', points: 59, exact: 6, trend: 'Cerro fuerte la fecha' },
  { name: 'Andrea', points: 54, exact: 5, trend: 'Necesita una jornada grande' },
]

function ScoreboardPage() {
  return (
    <section className="scoreboard-layout">
      <article className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Tabla de puntuacion</span>
            <h3>Scoreboard general</h3>
          </div>
        </div>

        <div className="scoreboard-list">
          {standings.map((player, index) => (
            <article key={player.name} className="scoreboard-row">
              <div className="scoreboard-rank">#{index + 1}</div>
              <div className="scoreboard-player">
                <strong>{player.name}</strong>
                <span>{player.trend}</span>
              </div>
              <div className="scoreboard-points">
                <strong>{player.points}</strong>
                <span>pts</span>
              </div>
              <div className="scoreboard-bonus">{player.exact} exactos</div>
            </article>
          ))}
        </div>
      </article>
    </section>
  )
}

export default ScoreboardPage
