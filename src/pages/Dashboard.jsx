import { useMemo, useState } from 'react'
import Matchoftheday from './Matchoftheday'
import PredictionBuilder from './PredictionBuilder'
import ScoreboardPage from './ScoreboardPage'
import SettingsPage from './SettingsPage'

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'matchday', label: 'Mejenga del dia' },
  { id: 'predictions', label: 'Predicciones' },
  { id: 'settings', label: 'Configuracion' },
  { id: 'scoreboard', label: 'Tabla de puntuacion' },
]

const summaryCards = [
  {
    label: 'Predicciones activas',
    value: '12 grupos',
    detail: 'Listas para registrar resultados y posiciones.',
  },
  {
    label: 'Cierre proximo',
    value: '11 jun 2026',
    detail: 'La jornada inaugural enciende la competencia interna.',
  },
  {
    label: 'Miembros',
    value: '24 jugadores',
    detail: 'Familia, amistades y oficina ya estan en la mejenga.',
  },
]

const livePredictions = [
  { name: 'Gabriela', points: 68, change: '+6', focus: 'Brasil lidera el Grupo C' },
  { name: 'Diego', points: 64, change: '+4', focus: 'Argentina y Portugal firmes' },
  { name: 'Sofi', points: 61, change: '+2', focus: 'Uruguay sorprende en Grupo H' },
  { name: 'Carlos', points: 59, change: '+1', focus: 'Canadá compite fuerte en casa' },
]

function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const activeLabel = useMemo(
    () => tabs.find((tab) => tab.id === activeTab)?.label ?? 'Dashboard',
    [activeTab]
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'matchday':
        return <Matchoftheday />
      case 'predictions':
        return <PredictionBuilder />
      case 'settings':
        return <SettingsPage />
      case 'scoreboard':
        return <ScoreboardPage />
      default:
        return (
          <section className="dashboard-home">
            <div className="hero-panel">
              <div className="hero-copy">
                <span className="eyebrow">El Mundialito 2026</span>
                <h1>Un centro de mando listo para jugar el torneo como se debe.</h1>
                <p>
                  Seguimiento del Mundial 2026 con una experiencia clara, elegante y
                  pensada para que las predicciones, la tabla y la configuracion vivan
                  en un solo lugar.
                </p>
                <div className="hero-actions">
                  <button type="button" onClick={() => setActiveTab('predictions')}>
                    Ver grupos oficiales
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setActiveTab('scoreboard')}
                  >
                    Abrir tabla
                  </button>
                </div>
              </div>

              <div className="hero-stats">
                <div className="metric-card emphasis">
                  <span className="metric-label">Estado del torneo</span>
                  <strong>Fase de grupos</strong>
                  <p>Panel preparado con los 12 grupos del sorteo oficial FIFA.</p>
                </div>
                <div className="metric-grid">
                  {summaryCards.map((card) => (
                    <article key={card.label} className="metric-card">
                      <span className="metric-label">{card.label}</span>
                      <strong>{card.value}</strong>
                      <p>{card.detail}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="dashboard-columns">
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Actividad</span>
                    <h2>Jugadores encendidos</h2>
                  </div>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setActiveTab('scoreboard')}
                  >
                    Ver scoreboard completo
                  </button>
                </div>

                <div className="activity-list">
                  {livePredictions.map((entry, index) => (
                    <article key={entry.name} className="activity-item">
                      <div className="activity-rank">0{index + 1}</div>
                      <div className="activity-copy">
                        <strong>{entry.name}</strong>
                        <span>{entry.focus}</span>
                      </div>
                      <div className="activity-score">
                        <strong>{entry.points} pts</strong>
                        <span>{entry.change}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel panel-accent">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Siguiente paso</span>
                    <h2>Flujo recomendado</h2>
                  </div>
                </div>

                <div className="checklist">
                  <article>
                    <strong>1. Revisar grupos</strong>
                    <p>
                      La seccion de predicciones ya incluye los cruces oficiales del
                      sorteo final y las plazas aun pendientes.
                    </p>
                  </article>
                  <article>
                    <strong>2. Destacar la mejenga del dia</strong>
                    <p>
                      Promociona el partido principal para que la familia o la oficina
                      entre a comentar y sumar puntos.
                    </p>
                  </article>
                  <article>
                    <strong>3. Ajustar reglas</strong>
                    <p>
                      Configura cierre de picks, puntaje por acierto y recordatorios
                      desde el panel de configuracion.
                    </p>
                  </article>
                </div>
              </section>
            </div>
          </section>
        )
    }
  }

  return (
    <main className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">EM</span>
          <div>
            <p className="brand-title">El Mundialito</p>
            <span className="brand-subtitle">Quiniela profesional del Mundial 2026</span>
          </div>
        </div>

        <nav className="topnav" aria-label="Secciones principales">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.id === activeTab ? 'nav-link active' : 'nav-link'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="content-shell">
        <div className="content-heading">
          <div>
            <span className="eyebrow">Vista actual</span>
            <h2>{activeLabel}</h2>
          </div>
          <p>
            Interfaz renovada para que navegar entre partidos, predicciones y ranking
            se sienta rapido y consistente.
          </p>
        </div>

        {renderContent()}
      </section>
    </main>
  )
}

export default Dashboard
