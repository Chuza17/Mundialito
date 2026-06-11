import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, Crown, Gift, Play, Trophy, X } from 'lucide-react'
import { createPortal } from 'react-dom'
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
import { formatPrizeAmount, getPrizeCards } from '../../utils/prizes'

const PRIZE_ICONS = {
  trophy: Trophy,
  crown: Crown,
  gift: Gift,
}

const DASHBOARD_TOUR_SESSION_PREFIX = 'dashboard-tour-session-seen'
const TOUR_KEY_BY_ROUTE = {
  '/groups': 'groups',
  '/best-thirds': 'best-thirds',
  '/knockout': 'knockout',
  '/results': 'results',
  '/scoreboard': 'scoreboard',
  '/my-prediction': 'my-prediction',
}

const CONTROL_TOUR_STEPS = [
  {
    key: 'neon',
    phase: 'controls',
    eyebrow: 'Controles rapidos',
    title: 'Efecto de luz',
    description: 'Activa o desactiva el rastro luminoso que sigue al cursor.',
    placement: 'right',
  },
  {
    key: 'music',
    phase: 'controls',
    eyebrow: 'Controles rapidos',
    title: 'Musica del dashboard',
    description: 'Reproduce o pausa la musica. Desde este control tambien puedes cambiar de cancion.',
    placement: 'right',
  },
  {
    key: 'points',
    phase: 'controls',
    eyebrow: 'Controles rapidos',
    title: 'Sistema de puntos',
    description: 'Abre la guia completa para consultar cuanto vale cada acierto del Mundialito.',
    placement: 'left',
  },
  {
    key: 'logout',
    phase: 'controls',
    eyebrow: 'Controles rapidos',
    title: 'Cerrar sesion',
    description: 'Usa este boton para salir de tu cuenta de forma segura.',
    placement: 'left',
  },
]

const WORKFLOW_TOUR_STEPS = [
  {
    key: 'groups',
    route: '/groups',
    phase: 'workflow',
    stepNumber: 1,
    title: 'Ordena los grupos',
    description: 'Empieza aqui: coloca cada equipo del puesto 1 al 4 en los 12 grupos.',
  },
  {
    key: 'best-thirds',
    route: '/best-thirds',
    phase: 'workflow',
    stepNumber: 2,
    title: 'Elige los mejores terceros',
    description: 'Despues selecciona los 8 terceros lugares que crees que avanzaran.',
  },
  {
    key: 'knockout',
    route: '/knockout',
    phase: 'workflow',
    stepNumber: 3,
    title: 'Completa las eliminatorias',
    description: 'Escoge los ganadores de cada llave hasta definir al campeon.',
  },
  {
    key: 'results',
    route: '/results',
    phase: 'workflow',
    stepNumber: 4,
    title: 'Predice resultados',
    description: 'Consulta los partidos y guarda marcadores exactos antes de que comiencen.',
  },
  {
    key: 'scoreboard',
    route: '/scoreboard',
    phase: 'workflow',
    stepNumber: 5,
    title: 'Revisa el scoreboard',
    description: 'Mira tus puntos, tu posicion, los premios y el avance de los demas jugadores.',
  },
  {
    key: 'my-prediction',
    route: '/my-prediction',
    phase: 'workflow',
    stepNumber: 6,
    title: 'Confirma tu quiniela',
    description: 'Al final revisa y comparte el resumen completo de todas tus elecciones.',
  },
]

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function getVisibleTourTarget(key) {
  return [...document.querySelectorAll(`[data-dashboard-tour="${key}"]`)].find((element) => {
    const rect = element.getBoundingClientRect()
    const styles = window.getComputedStyle(element)
    return rect.width > 0 && rect.height > 0 && styles.display !== 'none' && styles.visibility !== 'hidden'
  })
}

function getTourTooltipPosition(rect, preferredPlacement) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const width = Math.min(360, viewportWidth - 24)
  const estimatedHeight = 240
  const gap = 18
  let placement = preferredPlacement
  let left = rect.left + rect.width / 2 - width / 2
  let top = rect.bottom + gap

  if (preferredPlacement === 'right') {
    left = rect.right + gap
    top = rect.top + rect.height / 2 - estimatedHeight / 2
    if (left + width > viewportWidth - 12) {
      placement = 'left'
      left = rect.left - width - gap
    }
  } else if (preferredPlacement === 'left') {
    left = rect.left - width - gap
    top = rect.top + rect.height / 2 - estimatedHeight / 2
    if (left < 12) {
      placement = 'right'
      left = rect.right + gap
    }
  } else if (top + estimatedHeight > viewportHeight - 12) {
    placement = 'top'
    top = rect.top - estimatedHeight - gap
  }

  return {
    left: clamp(left, 12, viewportWidth - width - 12),
    top: clamp(top, 12, viewportHeight - estimatedHeight - 12),
    width,
    placement,
  }
}

function DashboardTour({ activeIndex, onClose, onNext, steps }) {
  const step = steps[activeIndex]
  const [targetRect, setTargetRect] = useState(null)

  useEffect(() => {
    if (!step) return undefined

    let retryTimer = 0
    setTargetRect(null)

    function updateTarget() {
      const target = getVisibleTourTarget(step.key)

      if (!target) {
        retryTimer = window.setTimeout(updateTarget, 120)
        return
      }

      const rect = target.getBoundingClientRect()
      setTargetRect({
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }

    updateTarget()
    window.addEventListener('resize', updateTarget)
    window.addEventListener('scroll', updateTarget, true)

    return () => {
      window.clearTimeout(retryTimer)
      window.removeEventListener('resize', updateTarget)
      window.removeEventListener('scroll', updateTarget, true)
    }
  }, [step])

  if (!step || !targetRect || typeof document === 'undefined') return null

  const phaseSteps = steps.filter((item) => item.phase === step.phase)
  const phaseIndex = phaseSteps.findIndex((item) => item.key === step.key)
  const isLastStep = activeIndex === steps.length - 1
  const tooltip = getTourTooltipPosition(targetRect, step.placement ?? 'bottom')
  const padding = 7

  return createPortal(
    <div className="dashboard-tour-root">
      <div className="dashboard-tour-click-blocker" />
      <div
        className="dashboard-tour-spotlight"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
        }}
      />

      <article
        className={`dashboard-tour-tooltip is-${tooltip.placement}`}
        style={{ top: tooltip.top, left: tooltip.left, width: tooltip.width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-tour-title"
      >
        <button type="button" className="dashboard-tour-close" onClick={onClose} aria-label="Cerrar recorrido">
          <X className="h-4 w-4" />
        </button>

        <p className="dashboard-tour-eyebrow">
          {step.phase === 'workflow' ? `Paso ${step.stepNumber} de ${phaseSteps.length}` : step.eyebrow}
        </p>
        <h3 id="dashboard-tour-title">{step.title}</h3>
        <p className="dashboard-tour-description">{step.description}</p>

        <div className="dashboard-tour-footer">
          <span className="dashboard-tour-progress">{`${phaseIndex + 1}/${phaseSteps.length}`}</span>
          <button type="button" className="dashboard-tour-next" onClick={onNext}>
            {isLastStep ? 'Finalizar' : step.phase === 'controls' && phaseIndex === phaseSteps.length - 1 ? 'Ver pasos' : 'Siguiente'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </article>
    </div>,
    document.body,
  )
}

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

function DashboardPrizeStat({ config }) {
  const prizes = getPrizeCards(config)
  const [activeIndex, setActiveIndex] = useState(0)
  const activePrize = prizes[activeIndex] ?? prizes[0]
  const Icon = PRIZE_ICONS[activePrize?.icon] ?? Trophy

  useEffect(() => {
    if (prizes.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % prizes.length)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [prizes.length])

  if (!activePrize) return null

  return (
    <article className={`cinematic-hero-stat-card cinematic-hero-prize-card ${activePrize.tone}`}>
      <div key={activePrize.key} className="cinematic-hero-prize-content">
        <div className="cinematic-hero-prize-head">
          <span>Premios</span>
          <div className="cinematic-hero-prize-icon" aria-hidden="true">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <strong>{formatPrizeAmount(activePrize.amount)}</strong>
        <small>{activePrize.label}</small>
      </div>
    </article>
  )
}

export default function CinematicDashboard({
  deadline,
  loadErrors,
  name,
  score = 0,
  leaderboardSpotlight = { mode: 'empty', rank: null, entry: null },
  leaderboardLoading = false,
  sections,
  userId,
  prizesConfig,
}) {
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
  const [tourStepIndex, setTourStepIndex] = useState(null)
  const scoreNumber = Number(score ?? 0)
  const scoreLabel = Number.isFinite(scoreNumber) ? scoreNumber.toLocaleString('es-CR') : '0'
  const spotlightRank = leaderboardSpotlight?.rank ?? null
  const rankLabel = leaderboardLoading ? '...' : spotlightRank ? `#${spotlightRank}` : '--'
  const rankSmallLabel =
    leaderboardSpotlight?.mode === 'current' ? 'Tu posicion' : leaderboardSpotlight?.mode === 'leader' ? 'Lider actual' : 'Tabla general'
  const sectionByRoute = new Map(sections.map((section) => [section.to, section]))
  const leftSections = ['/groups', '/best-thirds', '/knockout'].map((route) => sectionByRoute.get(route)).filter(Boolean)
  const rightSections = ['/results', '/my-prediction'].map((route) => sectionByRoute.get(route)).filter(Boolean)
  const centerSection = sectionByRoute.get('/scoreboard')
  const adminSection = sections.find((section) => section.to.startsWith('/admin'))
  const tourSteps = useMemo(() => {
    const availableRoutes = new Set(sections.map((section) => section.to))

    return [
      ...CONTROL_TOUR_STEPS,
      ...WORKFLOW_TOUR_STEPS.filter((step) => availableRoutes.has(step.route)).map((step) => ({
        ...step,
        placement: 'bottom',
      })),
    ]
  }, [sections])
  const tourStorageKey = userId ? `${DASHBOARD_TOUR_SESSION_PREFIX}-${userId}` : null

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

  useEffect(() => {
    if (!tourStorageKey || typeof window === 'undefined') return undefined

    setTourStepIndex(null)
    if (window.sessionStorage.getItem(tourStorageKey) === '1') return undefined

    const timerId = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      setPointsGuideOpen(false)
      setTourStepIndex(0)
    }, 1100)

    return () => window.clearTimeout(timerId)
  }, [tourStorageKey])

  function completeTour() {
    if (tourStorageKey) {
      window.sessionStorage.setItem(tourStorageKey, '1')
    }
    setTourStepIndex(null)
  }

  function advanceTour() {
    setTourStepIndex((current) => {
      if (current == null || current >= tourSteps.length - 1) {
        if (tourStorageKey) {
          window.sessionStorage.setItem(tourStorageKey, '1')
        }
        return null
      }

      return current + 1
    })
  }

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
          data-dashboard-tour="neon"
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
              data-dashboard-tour="music"
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
          data-dashboard-tour="points"
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
            <Link key={section.to} to={section.to} data-dashboard-tour={TOUR_KEY_BY_ROUTE[section.to]}>
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
                data-dashboard-tour={TOUR_KEY_BY_ROUTE[section.to]}
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
              data-dashboard-tour={TOUR_KEY_BY_ROUTE[centerSection.to]}
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
                data-dashboard-tour={TOUR_KEY_BY_ROUTE[section.to]}
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

        <div className="cinematic-mobile-hero-topbar" aria-label="Resumen rapido del dashboard">
          <article className="cinematic-mobile-hero-card is-player">
            <span>Jugador</span>
            <strong>{name}</strong>
          </article>

          <article className="cinematic-mobile-hero-card is-score">
            <span>Puntuacion</span>
            <strong>{scoreLabel} pts</strong>
          </article>
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

        <div className={`cinematic-mobile-hero-rank${hasStartedScroll ? ' is-hidden' : ''}`} aria-live="polite">
          <span>Puesto general</span>
          <strong>{rankLabel}</strong>
          <small>{rankSmallLabel}</small>
        </div>

        <img
          src={dashboardCompactLogo}
          alt="El Mundialito"
          className={`cinematic-hero-logo-compact${showSimplifiedLogo ? ' is-visible' : ''}${hasStartedScroll ? ' is-scroll-faded' : ''}`}
        />

        <div className="cinematic-hero-stats">
          <article className="cinematic-hero-stat-card is-player">
            <span>Jugador</span>
            <strong>{name}</strong>
          </article>
          <article className="cinematic-hero-stat-card is-score">
            <span>Puntuacion</span>
            <strong>{scoreLabel} pts</strong>
          </article>
          <DashboardPrizeStat config={prizesConfig} />
          <article className="cinematic-hero-stat-card is-deadline">
            <span>Cierre</span>
            <strong>
              <CountdownTimer deadline={deadline} />
            </strong>
          </article>
        </div>
      </div>

      {loadErrors.length ? (
        <div className="dashboard-alert">
          <p className="dashboard-alert-title">Hay datos que no cargaron bien desde Supabase.</p>
          <p className="dashboard-alert-copy">
            La vista puede usar datos de respaldo mientras revisamos tablas, policies RLS o el perfil del usuario.
          </p>
        </div>
      ) : null}

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

      {tourStepIndex != null ? (
        <DashboardTour
          activeIndex={tourStepIndex}
          onClose={completeTour}
          onNext={advanceTour}
          steps={tourSteps}
        />
      ) : null}
    </section>
  )
}
