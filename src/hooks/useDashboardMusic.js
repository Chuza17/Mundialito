import { useContext } from 'react'
import { DashboardMusicContext } from '../contexts/DashboardMusicContext'

export function useDashboardMusic() {
  const context = useContext(DashboardMusicContext)
  if (!context) {
    throw new Error('useDashboardMusic must be used inside DashboardMusicProvider.')
  }
  return context
}
