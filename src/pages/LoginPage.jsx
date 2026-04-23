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
    copy: 'Una escena del partido que termino dándole a Espana su primer titulo mundial.',
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

const WORLD_CUP_FACTS = [
  {
    value: '5',
    title: 'Brasil tiene mas titulos',
    copy: 'Ninguna seleccion ha ganado mas Mundiales que Brasil.',
  },
  {
    value: '16',
    title: 'Klose es el maximo goleador',
    copy: 'Miroslav Klose anoto 16 goles en Copas del Mundo.',
  },
  {
    value: '48',
    title: 'Mundial 2026',
    copy: 'Sera la primera edicion con 48 selecciones participantes.',
  },
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

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, login, loading } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
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
      setError('Ingresa tu email o usuario y tu contraseña.')
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07140f] px-3 py-6 sm:px-5 lg:px-8">
      <div className="absolute inset-0">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.title}
            className={index === activeSlide ? 'login-hero-slide login-hero-slide-active' : 'login-hero-slide'}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,8,6,0.35)_0%,rgba(4,20,13,0.2)_35%,rgba(7,28,18,0.42)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(46,204,113,0.1),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(212,166,32,0.08),transparent_26%)]" />
        <div className="login-pitch-grid absolute inset-x-0 bottom-0 h-52 opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="login-shell">
          <div className="login-corner-brand">
            <img src={APP_LOGO} alt={APP_NAME} className="login-corner-logo" />
          </div>

          <section className="login-showcase-panel">
            <div className="login-showcase-media">
              <img
                key={HERO_SLIDES[activeSlide].image}
                src={HERO_SLIDES[activeSlide].image}
                alt={HERO_SLIDES[activeSlide].eyebrow}
                className="login-showcase-photo"
              />

              <div className="login-showcase-photo-overlay">
                <span className="login-slide-badge">{HERO_SLIDES[activeSlide].eyebrow}</span>
              </div>
            </div>

            <div className="login-highlight-grid">
              {WORLD_CUP_FACTS.map((fact) => (
                <div key={fact.title} className="login-stat-card">
                  <span className="text-3xl font-black text-emerald-300">{fact.value}</span>
                  <span className="text-sm font-semibold text-white">{fact.title}</span>
                  <span className="text-xs leading-relaxed text-slate-400">{fact.copy}</span>
                </div>
              ))}
            </div>

            <div className="login-mobile-story">
              <p className="text-base font-semibold text-white">{HERO_SLIDES[activeSlide].title}</p>
              <div className="mt-4 flex items-center gap-2">
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">Entre compas</p>
              <h2 className="mt-2 font-display text-3xl font-black text-white sm:text-4xl">Inicia sesión</h2>
              <p className="mt-2 text-sm text-slate-400">
                Guarda tu quiniela y sigue la vacilonera del Mundial con tus amigos.
              </p>
            </div>

            <form className="relative mt-8 space-y-5" onSubmit={handleSubmit}>
              {submitting ? <div className="login-loading-overlay"><SoccerKickLoader /></div> : null}

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-200">Email o usuario</span>
                <div className={getFieldClass(identifierState)}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/12 text-emerald-300">
                    {identifier.includes('@') ? <Mail className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                  </div>
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                    type="text"
                    placeholder="usuario o correo@ejemplo.com"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    disabled={loading || submitting}
                  />
                </div>
                <p className={identifierState === 'invalid' ? 'login-field-copy text-red-200' : 'login-field-copy'}>
                  {identifierState === 'valid'
                    ? 'Identificador listo.'
                    : identifierState === 'invalid'
                      ? 'Usa un email valido o un usuario de al menos 3 caracteres.'
                      : 'Puedes ingresar con email o nombre de usuario.'}
                </p>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-200">Contraseña</span>
                <div className={getFieldClass(passwordState)}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/12 text-emerald-300">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading || submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordState === 'valid' || passwordState === 'invalid' ? (
                  <p className={passwordState === 'invalid' ? 'login-field-copy text-red-200' : 'login-field-copy'}>
                    {passwordState === 'valid' ? 'Contraseña válida.' : 'Debe tener al menos 6 caracteres.'}
                  </p>
                ) : null}
              </label>

              {error ? <p className="rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}

              <button type="submit" className="login-submit-button group" disabled={loading || submitting}>
                <span>Iniciar sesión</span>
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>

              <div className="login-post-actions">
                <button type="button" className="login-text-link">
                  Olvidé mi contraseña
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
