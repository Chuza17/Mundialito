const groups = [
  {
    name: 'Grupo A',
    teams: ['Costa Rica', 'Brasil', 'Japón', 'Alemania'],
  },
  {
    name: 'Grupo B',
    teams: ['Argentina', 'México', 'Estados Unidos', 'Corea del Sur'],
  },
  {
    name: 'Grupo C',
    teams: ['España', 'Francia', 'Canadá', 'Marruecos'],
  },
]

function PredictionsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="section-tag">Mis predicciones</span>
          <h2>Organiza tus grupos</h2>
          <p>Luego aquí vamos a agregar inputs, drag and drop y guardado real.</p>
        </div>
      </div>

      <div className="prediction-grid">
        {groups.map((group) => (
          <div className="prediction-card" key={group.name}>
            <div className="section-header">
              <h3>{group.name}</h3>
              <span>4 equipos</span>
            </div>

            <div className="team-list">
              {group.teams.map((team, index) => (
                <div className="team-row" key={team}>
                  <div className="team-left">
                    <span className="team-position">{index + 1}</span>
                    <span>{team}</span>
                  </div>
                  <input className="points-input" type="number" placeholder="Pts" />
                </div>
              ))}
            </div>

            <button className="primary-action">Editar predicción</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PredictionsPage