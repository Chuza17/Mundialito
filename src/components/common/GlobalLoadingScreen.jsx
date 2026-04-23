import { useEffect, useState } from 'react'
import { useAppConfig } from '../../hooks/useAppConfig'
import { useAuth } from '../../hooks/useAuth'

const GLOBAL_LOADER_VIDEO = '/dashboard-videos/global-loader.mp4'
const MINIMUM_LOADER_TIME_MS = 1800
const MAXIMUM_LOADER_TIME_MS = 4200
const EXIT_ANIMATION_MS = 460

export default function GlobalLoadingScreen({ children }) {
  const { loading: authLoading } = useAuth()
  const { loading: appConfigLoading } = useAppConfig()
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false)
  const [maximumTimeElapsed, setMaximumTimeElapsed] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const isAppLoading = authLoading || appConfigLoading
  const isLeaving = minimumTimeElapsed && (!isAppLoading || maximumTimeElapsed)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinimumTimeElapsed(true)
    }, MINIMUM_LOADER_TIME_MS)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMaximumTimeElapsed(true)
    }, MAXIMUM_LOADER_TIME_MS)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLeaving) {
      setIsVisible(true)
      return undefined
    }

    const timer = window.setTimeout(() => {
      setIsVisible(false)
    }, EXIT_ANIMATION_MS)

    return () => window.clearTimeout(timer)
  }, [isLeaving])

  return (
    <>
      {children}
      {isVisible ? (
        <div
          className={`global-loading-screen${isLeaving ? ' is-leaving' : ''}`}
          role="status"
          aria-live="polite"
          aria-label="Cargando El Mundialito"
        >
          <video
            className="global-loading-video"
            src={GLOBAL_LOADER_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        </div>
      ) : null}
    </>
  )
}
