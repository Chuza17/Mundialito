import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { APP_LOGO, APP_NAME } from '../utils/constants'
import buffonBackground from '../assets/branding/buffon_background.avif'
import iniestaBackground from '../assets/branding/iniesta_background.jpeg'
import maradonaBackground from '../assets/branding/maradona_background.webp'
import messiBackground from '../assets/branding/messi_background.jpg'
import peleBackground from '../assets/branding/pele_background.jpg'

const HERO_SLIDES = [
  {
    image: messiBackground,
    eyebrow: 'Campeones',
    title: 'Messi levantando la Copa del Mundo',
    copy: 'Argentina celebro en 2022 uno de los cierres mas recordados de la historia.',
    stat: 'Messi levanto la Copa en 2022 con Argentina.',
  },
  {
    image: maradonaBackground,
    eyebrow: 'Historia grande',
    title: 'Maradona en plena accion con Argentina',
    copy: 'Una imagen que recuerda la intensidad y el peso historico del Mundial de 1986.',
    stat: 'Maradona fue campeon del mundo con Argentina en 1986.',
  },
  {
    image: iniestaBackground,
    eyebrow: 'Gol historico',
    title: 'Iniesta contra Paises Bajos en 2010',
    copy: 'Una escena del partido que termino dandole a Espana su primer titulo mundial.',
    stat: 'Iniesta marco el gol del titulo para Espana en 2010.',
  },
  {
    image: buffonBackground,
    eyebrow: 'Muralla',
    title: 'Buffon celebrando el Mundial con Italia',
    copy: 'Italia se consagro en 2006 y Buffon quedo como una de las grandes figuras del torneo.',
    stat: 'Buffon gano el Mundial 2006 con Italia.',
  },
  {
    image: peleBackground,
    eyebrow: 'Rey',
    title: 'Pele con Brasil en una imagen historica',
    copy: 'El Rey sigue siendo una referencia absoluta cuando se habla de Copas del Mundo.',
    stat: 'Pele es el unico jugador con 3 Mundiales ganados.',
  },
]

const LOGIN_NAV_ITEMS = [
  'Dashboard',
  'Grupos',
  'Mejores 3ros',
  'Eliminatorias',
  'Scoreboard',
]

function SoccerKickLoader() {
  return (
    <div className="login-loader-panel">
      <div className="login-loader-stage" aria-hidden="true">
        <div className="login-loader-boot">
          <span className="login-loader-boot-top" />
          <span className="login-loader-boot-sole" />
        </div>
        <div className="login-loader-ball">
          <span className="login-loader-ball-core" />
        </div>
        <div className="login-loader-swoosh" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-200">Cargando acceso</p>
        <p className="text-sm text-slate-300">Preparando tu ingreso a la plataforma.</p>
      </div>
    </div>
  )
}

export default function LoginScenePage() {
  const navigate = useNavigate()
  const { user, login, loading, authError } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  if (user) return <Navigate to="/dashboard" replace />

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length)
    }, 5400)
    return () => window.clearInterval(intervalId)
  }, [])

  const identifierState = useMemo(() => {
    if (!identifier) return 'idle'
    return /\S+@\S+\.\S+/.test(identifier) || identifier.trim().length >= 3 ? 'valid' : 'invalid'
  }, [identifier])

  const passwordState = useMemo(() => {
    if (!password) return 'idle'
    return password.length >= 6 ? 'valid' : 'invalid'
  }, [password])

  function getFieldClass(state) {
    if (state === 'valid') return 'login-field login-field-valid'
    if (state === 'invalid') return 'login-field login-field-invalid'
    return 'login-field'
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!identifier || !password) {
      setError('Ingresa tu email o usuario y tu contrasena.')
      return
    }

    try {
      setSubmitting(true)
      await login(identifier, password)
      navigate('/dashboard', { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'No fue posible iniciar sesion.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page-split" aria-hidden="true" />

      <div className="login-stage">
        <div className="absolute inset-0">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={slide.title}
              className={index === activeSlide ? 'login-hero-slide login-hero-slide-active' : 'login-hero-slide'}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
          <div className="login-stage-fog" />
          <div className="login-stage-glow" />
          <div className="login-pitch-grid absolute inset-x-0 bottom-0 h-56 opacity-20" />
        </div>

        <div className="login-shell login-shell-scenic">
          <header className="login-topbar">
            <div className="login-topbar-brand">
              <div className="login-topbar-logo-wrap">
                <img src={APP_LOGO} alt={APP_NAME} className="login-topbar-logo" />
              </div>
              <span className="login-topbar-brand-name">{APP_NAME}</span>
            </div>

            <nav className="login-topbar-nav" aria-label="Secciones principales">
              {LOGIN_NAV_ITEMS.map((item) => (
                <button key={item} type="button" className="login-topbar-link">
                  {item}
                </button>
              ))}
            </nav>

            <div className="login-topbar-actions">
              <span className="login-topbar-pill">Mi Quiniela</span>
            </div>
          </header>

          <div className="login-shell-body">
            <section className="login-story-panel">
              <div className="login-story-media">
                <img
                  key={HERO_SLIDES[activeSlide].image}
                  src={HERO_SLIDES[activeSlide].image}
                  alt={HERO_SLIDES[activeSlide].title}
                  className="login-story-photo"
                />
              </div>

              <div className="login-story-content">
                <span className="login-slide-badge">{HERO_SLIDES[activeSlide].eyebrow}</span>

                <div className="login-story-copy">
                  <p className="login-story-kicker">Plataforma oficial entre compas</p>
                  <h1 className="login-story-title">{APP_NAME}</h1>
                  <p className="login-story-text">{HERO_SLIDES[activeSlide].title}</p>
                  <p className="login-story-subtext">{HERO_SLIDES[activeSlide].copy}</p>
                </div>
              </div>

              <div className="login-story-footer">
                <div className="login-story-stat">
                  <span className="login-story-stat-label">Momento destacado</span>
                  <p className="login-story-stat-copy">{HERO_SLIDES[activeSlide].stat}</p>
                </div>

                <div className="login-slide-controls">
                  {HERO_SLIDES.map((slide, index) => (
                    <button
                      key={slide.title}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      className={index === activeSlide ? 'login-dot login-dot-active' : 'login-dot'}
                      aria-label={`Ver fondo ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="login-form-panel">
              <div className="login-auth-card">
                <div className="login-auth-head">
                  <h2 className="login-auth-title">Login</h2>
                  <p className="login-auth-copy">
                    Bienvenido de vuelta. Ingresa para entrar a tu cuenta.
                  </p>
                </div>

                <form id="login-panel" className="login-auth-form relative mt-7 space-y-5" onSubmit={handleSubmit}>
                  {submitting ? <div className="login-loading-overlay"><SoccerKickLoader /></div> : null}

                  <label className="block">
                    <div className={`${getFieldClass(identifierState)} login-auth-input`}>
                      <div className="login-field-icon">
                        {identifier.includes('@') ? <Mail className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                      </div>
                      <input
                        aria-label="Email o usuario"
                        className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-300/55"
                        type="text"
                        placeholder="User Name"
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        disabled={loading || submitting}
                      />
                    </div>
                    <p className={identifierState === 'invalid' ? 'login-field-copy login-auth-hint text-rose-200' : 'login-field-copy login-auth-hint'}>
                      {identifierState === 'valid'
                        ? 'Identificador listo.'
                        : identifierState === 'invalid'
                          ? 'Usa un email valido o un usuario de al menos 3 caracteres.'
                          : 'Puedes ingresar con email o nombre de usuario.'}
                    </p>
                  </label>

                  <label className="block">
                    <div className={`${getFieldClass(passwordState)} login-auth-input`}>
                      <div className="login-field-icon">
                        <LockKeyhole className="h-5 w-5" />
                      </div>
                      <input
                        aria-label="Contrasena"
                        className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-300/55"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={loading || submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="login-auth-ghost-button"
                        aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {(passwordState === 'valid' || passwordState === 'invalid') ? (
                      <p className={passwordState === 'invalid' ? 'login-field-copy login-auth-hint text-rose-200' : 'login-field-copy login-auth-hint'}>
                        {passwordState === 'valid' ? 'Contrasena valida.' : 'Debe tener al menos 6 caracteres.'}
                      </p>
                    ) : null}
                  </label>

                  <label className="login-remember-row">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="login-remember-checkbox"
                    />
                    <span>Remember me</span>
                  </label>

                  {error || authError ? (
                    <p className="login-auth-error rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {error || authError}
                    </p>
                  ) : null}

                  <button type="submit" className="login-submit-button login-submit-button-auth group" disabled={loading || submitting}>
                    <span>Login</span>
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </button>

                  <div className="login-auth-footer-card">
                    <p className="login-auth-footer-copy">
                      No tienes una cuenta? <span className="login-auth-footer-strong">Solicita acceso</span>
                    </p>
                    <div className="login-post-actions">
                      <button type="button" className="login-text-link login-auth-forgot-link">
                        Olvide mi contrasena
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
