import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import GlobalLoadingScreen from './components/common/GlobalLoadingScreen'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardMusicProvider } from './contexts/DashboardMusicContext'
import { PredictionsProvider } from './contexts/PredictionsContext'
import AppRouter from './AppRouter'
import { publicAsset } from './utils/publicAsset'
import './index.css'

const Router = import.meta.env.BASE_URL === '/' ? BrowserRouter : HashRouter

document.documentElement.style.setProperty(
  '--mundialito-cursor-auto',
  `url("${publicAsset('/pointer/cursor-soccer-48.png')}") 6 3, auto`,
)
document.documentElement.style.setProperty(
  '--mundialito-cursor-pointer',
  `url("${publicAsset('/pointer/cursor-soccer-48.png')}") 6 3, pointer`,
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <PredictionsProvider>
          <DashboardMusicProvider>
            <GlobalLoadingScreen>
              <AppRouter />
            </GlobalLoadingScreen>
          </DashboardMusicProvider>
        </PredictionsProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
)
