import { useState } from 'react'
import HomePage from './pages/HomePage'
import PredictionsPage from './pages/PredictionsPage'
import MatchOfDayPage from './pages/MatchOfDayPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const [activePage, setActivePage] = useState('home')

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-badge">EM</div>
          <div>
            <h1>El Mundialito</h1>
            <p>Fantasy del Mundial</p>
          </div>
        </div>

        <nav className="nav">
          <button
            className={activePage === 'home' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActivePage('home')}
          >
            Tablero principal
          </button>

          <button
            className={activePage === 'predictions' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActivePage('predictions')}
          >
            Mis predicciones
          </button>

          <button
            className={activePage === 'match' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActivePage('match')}
          >
            La mejenga del día
          </button>

          <button
            className={activePage === 'settings' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActivePage('settings')}
          >
            Configuración
          </button>
        </nav>
      </aside>

      <main className="content">
        {activePage === 'home' && <HomePage />}
        {activePage === 'predictions' && <PredictionsPage />}
        {activePage === 'match' && <MatchOfDayPage />}
        {activePage === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}

export default App