import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import GlobalLoadingScreen from './components/common/GlobalLoadingScreen'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardMusicProvider } from './contexts/DashboardMusicContext'
import { PredictionsProvider } from './contexts/PredictionsContext'
import AppRouter from './AppRouter'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PredictionsProvider>
          <DashboardMusicProvider>
            <GlobalLoadingScreen>
              <AppRouter />
            </GlobalLoadingScreen>
          </DashboardMusicProvider>
        </PredictionsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
