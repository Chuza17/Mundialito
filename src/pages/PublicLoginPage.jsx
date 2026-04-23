import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { APP_NAME } from '../utils/constants'
import { publicAsset } from '../utils/publicAsset'
import audioPlayImage from '../assets/branding/audio-play.png'
import audioStopImage from '../assets/branding/audio-stop.png'
import dashboardLogo from '../assets/branding/logo_mundialito_gxmz.png'
import loginButtonImage from '../assets/branding/login-button.png'
import pointsHelpButtonImage from '../assets/branding/points-help-button.png'

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

export default function PublicLoginPage() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const identifierInputRef = useRef(null)
  const { user, login, loading, authError } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLogoSpinning, setIsLogoSpinning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const identifierState = useMemo(() => {
    if (!identifier) return 'idle'
    return /\S+@\S+\.\S+/.test(identifier) || identifier.trim().length >= 3 ? 'valid' : 'invalid'
  }, [identifier])

  const passwordState = useMemo(() => {
    if (!password) return 'idle'
    return password.length >= 6 ? 'valid' : 'invalid'
  }, [password])

  useEffect(() => {
    if (!isLoginOpen) return
    const timeoutId = window.setTimeout(() => identifierInputRef.current?.focus(), 180)
    return () => window.clearTimeout(timeoutId)
  }, [isLoginOpen])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = isMuted
    video.volume = 0.9
    void video.play().catch(() => {
      video.muted = true
      setIsMuted(true)
      void video.play().catch(() => {})
    })
  }, [isMuted])

  if (user) return <Navigate to="/dashboard" replace />

  function getFieldClass(state) {
    if (state === 'valid') return 'login-field login-field-valid'
    if (state === 'invalid') return 'login-field login-field-invalid'
    return 'login-field'
  }

  function enableVideoAudio() {
    const video = videoRef.current
    if (!video) return

    video.muted = isMuted
    video.volume = 0.9
    void video.play().catch(() => {
      // Browsers may block autoplay with sound until the first user gesture.
    })
  }

  function toggleVideoSound() {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)

    const video = videoRef.current
    if (!video) return

    video.muted = nextMuted
    video.volume = 0.9
    void video.play().catch(() => {})
  }

  function openLogin() {
    enableVideoAudio()
    setIsLoginOpen(true)
  }

  function spinLogo() {
    setIsLogoSpinning(true)
    window.setTimeout(() => setIsLogoSpinning(false), 1200)
  }

  function closeLogin() {
    if (submitting) return
    setIsLoginOpen(false)
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
    <main className="public-login-page" onPointerDown={enableVideoAudio}>
      <video
        ref={videoRef}
        className="public-login-video"
        autoPlay
        loop
        playsInline
        preload="metadata"
      >
        <source src={publicAsset('/dashboard-videos/grupos.mp4')} type="video/mp4" />
        <source src={publicAsset('/dashboard-videos/groups.mp4')} type="video/mp4" />
      </video>
      <div className="public-login-overlay" />
      <div className="public-login-vignette" />

      <section className="public-login-shell">
        <header className="public-login-topbar">
          <div className="public-login-brand">
            <button
              type="button"
              className={`public-login-logo-button${isLogoSpinning ? ' is-spinning' : ''}`}
              onClick={spinLogo}
              aria-label="Animar logo de El Mundialito"
            >
              <img src={dashboardLogo} alt={APP_NAME} />
            </button>

            <div className="public-login-brand-tools">
              <button
                type="button"
                className={`public-login-sound-button public-login-image-button${isMuted ? ' is-muted' : ''}`}
                onClick={toggleVideoSound}
                aria-label={isMuted ? 'Activar sonido del video' : 'Silenciar video'}
              >
                <img src={isMuted ? audioStopImage : audioPlayImage} alt="" aria-hidden="true" />
                <span className="sr-only">{isMuted ? 'Audio apagado' : 'Audio encendido'}</span>
              </button>

              <button
                type="button"
                className="public-login-help-button public-login-image-button public-login-mobile-only"
                onClick={() => setIsInfoOpen(true)}
                aria-label="Como funciona El Mundialito"
              >
                <img src={pointsHelpButtonImage} alt="" aria-hidden="true" />
                <span className="sr-only">Como se juega</span>
              </button>
            </div>
          </div>

          <div className="public-login-actions">
            <button
              type="button"
              className="public-login-help-button public-login-image-button public-login-desktop-only"
              onClick={() => setIsInfoOpen(true)}
              aria-label="Como funciona El Mundialito"
            >
              <img src={pointsHelpButtonImage} alt="" aria-hidden="true" />
              <span className="sr-only">Como se juega</span>
            </button>

            <button type="button" className="public-login-topbar-button" onClick={openLogin} aria-label="Abrir login">
              <img src={loginButtonImage} alt="" aria-hidden="true" />
              <span className="sr-only">Login</span>
            </button>
          </div>
        </header>

        {isInfoOpen ? (
          <div className="public-login-modal-layer public-login-info-layer" onClick={(event) => event.currentTarget === event.target && setIsInfoOpen(false)}>
            <article className="public-login-info-card" aria-modal="true" role="dialog" aria-labelledby="public-login-info-title">
              <button type="button" className="public-login-close-button" onClick={() => setIsInfoOpen(false)} aria-label="Cerrar informacion">
                <X className="h-5 w-5" />
              </button>

              <p className="public-login-card-kicker">Como se juega</p>
              <h2 id="public-login-info-title">El Mundialito</h2>
              <p>
                Es una quiniela privada entre compas: armas tus grupos, eliges mejores terceros, completas eliminatorias y
                dejas listo tu campeon antes del cierre.
              </p>

              <div className="public-login-info-price">
                <strong>Inscripcion: ₡5.000 colones</strong>
                <span>Este monto ayuda a pagar el servidor y los gastos del dominio.</span>
              </div>

              <div className="public-login-info-steps">
                <span>1. Ordena cada grupo y define puntos.</span>
                <span>2. Elige los mejores terceros que avanzan.</span>
                <span>3. Completa el bracket hasta escoger campeon.</span>
                <span>4. Revisa el scoreboard y comparte tu quiniela.</span>
              </div>
            </article>
          </div>
        ) : null}

        {isLoginOpen ? (
          <div className="public-login-modal-layer" onClick={(event) => event.currentTarget === event.target && closeLogin()}>
            <section className="public-login-form-panel" aria-modal="true" role="dialog" aria-labelledby="public-login-title">
            <div className="login-auth-card public-login-auth-card">
              <button type="button" className="public-login-close-button" onClick={closeLogin} aria-label="Cerrar login">
                <X className="h-5 w-5" />
              </button>

              <div className="login-auth-head">
                <p className="public-login-card-kicker">Acceso oficial</p>
                <h2 id="public-login-title" className="login-auth-title">Login</h2>
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
                      ref={identifierInputRef}
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
        ) : null}
      </section>
    </main>
  )
}
