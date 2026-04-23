const featuredMatch = {
  stage: 'Partido inaugural',
  date: 'Jueves 11 de junio, 2026',
  venue: 'Estadio Azteca, Ciudad de Mexico',
  home: {
    name: 'Mexico',
    flag: '🇲🇽',
    note: 'Anfitrion y cabeza del Grupo A',
  },
  away: {
    name: 'South Africa',
    flag: '🇿🇦',
    note: 'Debut clave en un grupo muy exigente',
  },
}

function Matchoftheday() {
  return (
    <section className="matchday-layout">
      <article className="featured-match-card">
        <div className="match-badge">{featuredMatch.stage}</div>
        <h3>Mejenga del dia</h3>
        <p>
          Un partido protagonista para mover la conversacion, abrir picks del dia y
          destacar el duelo que todos van a querer comentar.
        </p>

        <div className="match-scoreline">
          <div className="team-display">
            <span className="team-flag">{featuredMatch.home.flag}</span>
            <strong>{featuredMatch.home.name}</strong>
            <span>{featuredMatch.home.note}</span>
          </div>

          <div className="versus-block">
            <span>VS</span>
            <small>{featuredMatch.date}</small>
          </div>

          <div className="team-display">
            <span className="team-flag">{featuredMatch.away.flag}</span>
            <strong>{featuredMatch.away.name}</strong>
            <span>{featuredMatch.away.note}</span>
          </div>
        </div>

        <div className="match-meta-grid">
          <article>
            <span>Estadio</span>
            <strong>{featuredMatch.venue}</strong>
          </article>
          <article>
            <span>Cierre de picks</span>
            <strong>1 hora antes del saque inicial</strong>
          </article>
          <article>
            <span>Puntaje sugerido</span>
            <strong>3 puntos por marcador exacto</strong>
          </article>
        </div>
      </article>

      <article className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Ideas rapidas</span>
            <h3>Como aprovechar esta vista</h3>
          </div>
        </div>

        <div className="checklist">
          <article>
            <strong>Abrir pronosticos express</strong>
            <p>Ideal para picks de marcador, goleador y figura del partido.</p>
          </article>
          <article>
            <strong>Activar recordatorio</strong>
            <p>Usa la configuracion para enviar avisos antes del cierre.</p>
          </article>
          <article>
            <strong>Dar protagonismo visual</strong>
            <p>
              Esta tarjeta esta lista para convertirse en el hero principal del dia.
            </p>
          </article>
        </div>
      </article>
    </section>
  )
}

export default Matchoftheday
