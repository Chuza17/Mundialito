const settings = [
  {
    title: 'Cierre de predicciones',
    value: '60 minutos antes del partido',
    detail: 'Bloquea cambios de ultima hora y protege la competencia.',
  },
  {
    title: 'Sistema de puntos',
    value: '3 exacto / 1 resultado / 2 grupo perfecto',
    detail: 'Balanceado para quiniela larga con fase de grupos.',
  },
  {
    title: 'Recordatorios',
    value: 'Activos para apertura y cierre',
    detail: 'Ideal para no perder participacion en jornadas tempranas.',
  },
]

function SettingsPage() {
  return (
    <section className="settings-layout">
      <article className="panel panel-accent">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Configuracion</span>
            <h3>Parametros listos para afinar</h3>
          </div>
        </div>

        <div className="settings-grid">
          {settings.map((setting) => (
            <article key={setting.title} className="setting-card">
              <span>{setting.title}</span>
              <strong>{setting.value}</strong>
              <p>{setting.detail}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  )
}

export default SettingsPage
