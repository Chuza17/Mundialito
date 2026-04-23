import { groups } from '../data/officialGroups'

function PredictionPage() {
  return (
    <section className="predictions-layout">
      <article className="panel panel-accent">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Predicciones</span>
            <h3>Grupos oficiales del Mundial 2026</h3>
          </div>
        </div>

        <p className="section-copy">
          Basado en el sorteo final publicado por FIFA. Los cupos que siguen en repechaje
          se muestran con todas las selecciones candidatas para no inventar clasificados.
        </p>

        <div className="legend-row">
          <span className="legend-pill">🇲🇽 🇧🇷 🇫🇷 Selecciones confirmadas</span>
          <span className="legend-pill">🏁 Cupos pendientes de repechaje</span>
          <span className="legend-pill">12 grupos listos para pronosticar</span>
        </div>
      </article>

      <div className="groups-grid">
        {groups.map((group) => (
          <article key={group.id} className="group-card">
            <div className="group-card-header">
              <span className="group-tag">Grupo {group.id}</span>
              <strong>{group.highlight}</strong>
            </div>

            <ul className="team-list">
              {group.teams.map((team) => (
                <li key={`${group.id}-${team.name}`} className="team-row">
                  <div className="team-main">
                    <span className="team-flags">{team.flag}</span>
                    <div>
                      <strong>{team.name}</strong>
                      <span>{team.note}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export default PredictionPage
