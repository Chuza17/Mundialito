import { useEffect, useState } from 'react'
import { ArrowUpRight, Play } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import CountdownTimer from '../common/CountdownTimer'
import { POINTER_TRAIL_STORAGE_KEY, POINTER_TRAIL_TOGGLE_EVENT } from '../common/PointerTrail'
import { useDashboardMusic } from '../../hooks/useDashboardMusic'
import audioPlayImage from '../../assets/branding/audio-play.png'
import audioStopImage from '../../assets/branding/audio-stop.png'
import dashboardLogo from '../../assets/branding/logo_mundialito_gxmz.png'
import dashboardCompactLogo from '../../assets/branding/logo_mundialito_simplificado.png'
import neonOffImage from '../../assets/branding/neon-off.png'
import neonOnImage from '../../assets/branding/neon-on.png'
import pointsHelpButtonImage from '../../assets/branding/points-help-button.png'
import pointsSystemImage from '../../assets/branding/points-system.png'
import scrollBallImage from '../../assets/branding/world-cup-ball-2026.png'
import { publicAsset } from '../../utils/publicAsset'

function getStoredNeonPreference() {
  try {
    return localStorage.getItem(POINTER_TRAIL_STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

function VideoSurface({ src, title, className = '' }) {
  const sources = Array.isArray(src) ? src : [src]
  const sourceKey = sources.join('|')
  const [sourceIndex, setSourceIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  const activeSource = publicAsset(sources[sourceIndex])

  useEffect(() => {
    setSourceIndex(0)
    setFailed(false)
  }, [sourceKey])

  function handleVideoError() {
    const nextIndex = sourceIndex + 1

    if (nextIndex < sources.length) {
      setSourceIndex(nextIndex)
      return
    }

    setFailed(true)
  }

  return (
    <div className={`cinematic-video-surface ${className}`} aria-label={title}>
      {!failed ? (
        <video
          key={activeSource}
          className="cinematic-video"
          src={activeSource}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onCanPlay={() => setFailed(false)}
          onError={handleVideoError}
        />
      ) : null}
    </div>
  )
}

function CinematicCard({ section, index }) {
  return (
    <Link
      to={section.to}
      className="cinematic-dashboard-card"
      style={{
        '--card-accent': section.accent,
        '--card-index': index,
        zIndex: 20 + index,
      }}
    >
      <div className="cinematic-card-copy">
        <span className="cinematic-card-number">{section.number}</span>
        <p className="cinematic-card-kicker">{section.subtitle}</p>
        <h2 className="cinematic-card-title">{section.title}</h2>
        <p className="cinematic-card-description">{section.description}</p>

        <div className="cinematic-card-meta">
          <span>{section.summary}</span>
          <strong>{section.status}</strong>
        </div>

        <span className="cinematic-card-cta">
          Entrar al modulo
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="cinematic-card-media-wrap">
        <VideoSurface src={section.video} title={section.title} />
        <div className="cinematic-card-play">
          <Play className="h-4 w-4 fill-current" />
        </div>
      </div>
    </Link>
  )
}

export default function CinematicDashboard({ deadline, loadErrors, name, progress, score = 0, sections, userId }) {
  const location = useLocation()
  const { tracks: musicTracks, selectedTrackId, musicPlaying, playTrack, toggleMusic } = useDashboardMusic()
  const [hasScrolled, setHasScrolled] = useState(false)
  const [hasStartedScroll, setHasStartedScroll] = useState(false)
  const storageKey = userId ? `hero-text-seen-${userId}` : null
  const alreadySeen = storageKey ? localStorage.getItem(storageKey) === '1' : false
  const [heroTextVisible, setHeroTextVisible] = useState(!alreadySeen)
  const [heroTextFading, setHeroTextFading] = useState(false)
  const [showSimplifiedLogo, setShowSimplifiedLogo] = useState(alreadySeen)
  const [neonEnabled, setNeonEnabled] = useState(getStoredNeonPreference)
  const [pointsGuideOpen, setPointsGuideOpen] = useState(false)
  const scoreNumber = Number(score ?? 0)
  const scoreLabel = Number.isFinite(scoreNumber) ? scoreNumber.toLocaleString('es-CR') : '0'
  const sectionByRoute = new Map(sections.map((section) => [section.to, section]))
  const leftSections = ['/groups', '/best-thirds', '/knockout'].map((route) => sectionByRoute.get(route)).filter(Boolean)
  const rightSections = ['/results', '/my-prediction'].map((route) => sectionByRoute.get(route)).filter(Boolean)
  const centerSection = sectionByRoute.get('/scoreboard')
  const adminSection = sections.find((section) => section.to.startsWith('/admin'))

  useEffect(() => {
    if (!heroTextVisible) return
    const fadeTimer = setTimeout(() => {
      setHeroTextFading(true)
    }, 7000)
    const hideTimer = setTimeout(() => {
      setHeroTextVisible(false)
      setShowSimplifiedLogo(true)
      if (storageKey) localStorage.setItem(storageKey, '1')
    }, 7700)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [heroTextVisible, storageKey])

  useEffect(() => {
    let frameId = 0

    function updateScrollState() {
      cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        setHasStartedScroll(scrollTop > 12)
        setHasScrolled(scrollTop > 90)
      })
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', updateScrollState)
    }
  }, [])

  useEffect(() => {
    if (!pointsGuideOpen) return undefined

    function closeOnEscape(event) {
      if (event.key === 'Escape') setPointsGuideOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [pointsGuideOpen])

  function toggleNeonTrail() {
    const nextValue = !neonEnabled
    setNeonEnabled(nextValue)
    try {
      localStorage.setItem(POINTER_TRAIL_STORAGE_KEY, nextValue ? '1' : '0')
    } catch {
      // The visual state can still update even if storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent(POINTER_TRAIL_TOGGLE_EVENT, { detail: { enabled: nextValue } }))
  }

  return (
    <section className="cinematic-dashboard">
      <div className={`cinematic-control-cluster${hasStartedScroll ? ' is-logo-faded' : ''}`}>
        <button
          type="button"
          className={`cinematic-neon-toggle${neonEnabled ? ' is-active' : ' is-muted'}`}
          aria-label={neonEnabled ? 'Desactivar luz del cursor' : 'Activar luz del cursor'}
          aria-pressed={neonEnabled}
          onClick={toggleNeonTrail}
        >
          <img src={neonEnabled ? neonOnImage : neonOffImage} alt="" />
        </button>

        <div className="cinematic-music-controls" aria-label="Controles de musica">
          <div className={`cinematic-music-play-wrap${musicPlaying ? ' is-playing' : ''}`}>
            <button
              type="button"
              className="cinematic-music-button is-play"
              aria-label={musicPlaying ? 'Pausar musica' : 'Reproducir musica'}
              onClick={toggleMusic}
            >
              <img src={musicPlaying ? audioStopImage : audioPlayImage} alt="" />
            </button>

            <div className="cinematic-music-popover" role="menu" aria-label="Elegir cancion">
              <span className="cinematic-music-popover-title">Cambiar cancion</span>
              {musicTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className={`cinematic-music-track${selectedTrackId === track.id ? ' is-selected' : ''}`}
                  onClick={() => playTrack(track.id)}
                >
                  <span className="cinematic-music-track-dot" />
                  <span>{track.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="cinematic-top-guide-wrap">
        <button
          type="button"
          className="cinematic-points-guide-button is-topbar"
          aria-label="Ver sistema de puntos"
          onClick={() => setPointsGuideOpen(true)}
        >
          <img src={pointsHelpButtonImage} alt="" />
        </button>
      </div>

      {pointsGuideOpen ? (
        <div
          className="cinematic-points-guide-layer"
          role="dialog"
          aria-modal="true"
          aria-label="Sistema de puntos"
          onClick={(event) => {
            if (event.currentTarget === event.target) setPointsGuideOpen(false)
          }}
        >
          <div className="cinematic-points-guide-frame">
            <button
              type="button"
              className="cinematic-points-guide-close"
              aria-label="Cerrar sistema de puntos"
              onClick={() => setPointsGuideOpen(false)}
            >
              X
            </button>
            <img src={pointsSystemImage} alt="Sistema de puntos de El Mundialito" />
          </div>
        </div>
      ) : null}

      <div className={`cinematic-floating-hud${hasScrolled ? ' is-scrolled' : ''}`}>
        <nav className="cinematic-floating-menu" aria-label="Menu principal del dashboard">
          {sections.map((section) => (
            <Link key={section.to} to={section.to}>
              {section.title}
            </Link>
          ))}
        </nav>

        <Link to="/dashboard" className="cinematic-floating-logo" aria-label="Volver al inicio del dashboard">
          <img src={dashboardCompactLogo} alt="El Mundialito" />
        </Link>
      </div>

      <nav className="mobile-dock-nav mobile-dashboard-dock lg:hidden" aria-label="Menu movil del dashboard">
        {adminSection ? (
          <div className="mobile-dock-admin-row">
            <Link
              to={adminSection.to}
              aria-label={adminSection.title}
              className={`mobile-dock-admin-link${location.pathname === adminSection.to ? ' is-active' : ''}`}
            >
              <adminSection.icon className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </div>
        ) : null}

        <div className="mobile-dock-shell">
          <div className="mobile-dock-side">
            {leftSections.map((section) => (
              <Link
                key={section.to}
                to={section.to}
                aria-label={section.title}
                className={`mobile-dock-link${location.pathname === section.to ? ' is-active' : ''}`}
              >
                <section.icon className="h-4 w-4" />
                <span className="sr-only">{section.title}</span>
              </Link>
            ))}
          </div>

          {centerSection ? (
            <Link
              to={centerSection.to}
              aria-label={centerSection.title}
              className={`mobile-dock-center${location.pathname === centerSection.to ? ' is-active' : ''}`}
            >
              <centerSection.icon className="h-5 w-5" />
              <span className="sr-only">{centerSection.title}</span>
            </Link>
          ) : null}

          <div className="mobile-dock-side">
            {rightSections.map((section) => (
              <Link
                key={section.to}
                to={section.to}
                aria-label={section.title}
                className={`mobile-dock-link${location.pathname === section.to ? ' is-active' : ''}`}
              >
                <section.icon className="h-4 w-4" />
                <span className="sr-only">{section.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {loadErrors.length ? (
        <div className="dashboard-alert">
          <p className="dashboard-alert-title">Hay datos que no cargaron bien desde Supabase.</p>
          <p className="dashboard-alert-copy">
            La vista puede usar datos de respaldo mientras revisamos tablas, policies RLS o el perfil del usuario.
          </p>
        </div>
      ) : null}

      <div className="cinematic-hero">
        <VideoSurface
          src={[
            '/dashboard-videos/hero.mp4',
            '/dashboard-videos/principal.mp4',
            '/dashboard-videos/main.mp4',
            '/dashboard-videos/hero.webm',
            '/dashboard-videos/principal.webm',
          ]}
          title="El Mundialito"
          className="cinematic-hero-video"
        />
        <div className="cinematic-hero-overlay" />

        <div className="cinematic-hero-nav">
          <span>El Mundialito</span>
          <span>Quiniela privada</span>
        </div>

        <div className="cinematic-hero-content">
          <div className="cinematic-hero-logo-wrap">
            <img
              src={dashboardLogo}
              alt="El Mundialito"
              className={`cinematic-hero-logo cinematic-hero-logo-full${heroTextFading ? ' is-fading' : ''}${showSimplifiedLogo ? ' is-hidden' : ''}`}
            />
          </div>
          {heroTextVisible && (
            <div className={`cinematic-hero-text-block${heroTextFading ? ' is-fading' : ''}`}>
              <p className="cinematic-hero-kicker">Dashboard oficial</p>
              <h1 className="cinematic-hero-title">Tu camino al mundial empieza aqui.</h1>
            </div>
          )}
        </div>

        <img
          src={dashboardCompactLogo}
          alt="El Mundialito"
          className={`cinematic-hero-logo-compact${showSimplifiedLogo ? ' is-visible' : ''}${hasStartedScroll ? ' is-scroll-faded' : ''}`}
        />

        <div className="cinematic-hero-stats">
          <article>
            <span>Jugador</span>
            <strong>{name}</strong>
          </article>
          <article>
            <span>Puntuacion</span>
            <strong>{scoreLabel} pts</strong>
          </article>
          <article>
            <span>Progreso</span>
            <strong>{progress}%</strong>
          </article>
          <article>
            <span>Cierre</span>
            <strong>
              <CountdownTimer deadline={deadline} />
            </strong>
          </article>
        </div>
      </div>

      <div className="cinematic-scroll-intro">
        <span className="scroll-ball">
          <img src={scrollBallImage} alt="" />
        </span>
        <p className="scroll-label">Bajá</p>
        <div className="scroll-arrows">
          <span />
          <span />
          <span />
        </div>
        <p className="scroll-sublabel">Explora las fases</p>
      </div>

      <div className="cinematic-dashboard-stack">
        {sections.map((section, index) => (
          <CinematicCard key={section.to} section={section} index={index} />
        ))}
      </div>
    </section>
  )
}
