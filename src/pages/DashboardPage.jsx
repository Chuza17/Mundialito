import { BarChart3, CheckCircle2, Clock, Shield, Trophy, Users2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import CountdownTimer from '../components/common/CountdownTimer'
import ProgressBar from '../components/common/ProgressBar'
import { useAppConfig } from '../hooks/useAppConfig'
import { useAuth } from '../hooks/useAuth'
import { useBestThirds } from '../hooks/useBestThirds'
import { useGroupPredictions } from '../hooks/useGroupPredictions'
import { useKnockoutMatches } from '../hooks/useKnockoutMatches'
import { useKnockoutPredictions } from '../hooks/useKnockoutPredictions'
import { useTeams } from '../hooks/useTeams'
import { getProgressPercentage } from '../utils/helpers'

function PhaseCard({ icon: Icon, label, done, total, to, locked }) {
  const isComplete = done >= total
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Link
      to={to}
      className="glass-panel group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-slate-300 transition group-hover:bg-white/12">
          <Icon className="h-5 w-5" />
        </div>
        {isComplete && (
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold text-white">
          {done}
          <span className="text-base font-normal text-slate-400">/{total}</span>
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fifa-blue to-fifa-gold transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {locked && (
        <p className="text-xs text-amber-400">Bloqueado por admin</p>
      )}
    </Link>
  )
}

export default function DashboardPage() {
  const { user, profile, authError } = useAuth()
  const { teams, error: teamsError } = useTeams()
  const { config, error: configError } = useAppConfig()
  const groups = useGroupPredictions(user?.id)
  const thirds = useBestThirds(user?.id)
  const knockoutMatches = useKnockoutMatches()
  const knockout = useKnockoutPredictions({
    userId: user?.id,
    teams,
    groupPredictions: groups.predictions,
    bestThirds: thirds.bestThirds,
    matches: knockoutMatches.matches,
  })

  const progress = getProgressPercentage(groups.predictions, thirds.bestThirds, knockout.predictions)
  const completedGroups = groups.getCompletedGroupsCount()
  const selectedThirds = thirds.bestThirds.filter((t) => t.qualifies).length
  const knockoutDone = knockout.predictions.length
  const isLocked = config?.predictions_locked
  const name = profile?.display_name ?? profile?.username ?? 'Jugador'
  const loadErrors = [
    authError,
    teamsError,
    configError,
    groups.error,
    thirds.error,
    knockoutMatches.error,
    knockout.error,
  ].filter(Boolean)

  return (
    <section className="space-y-6">
      {loadErrors.length ? (
        <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-100">
          <p className="font-semibold text-amber-200">Hay datos que no cargaron bien desde Supabase.</p>
          <p className="mt-1 text-amber-50/90">
            La app sigue funcionando con valores de respaldo, pero conviene revisar las tablas,
            policies RLS y la fila del perfil del usuario.
          </p>
        </div>
      ) : null}

      {/* Welcome + progress */}
      <div className="glass-panel p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-fifa-gold">Panel principal</p>
        <h2 className="mt-2 font-display text-3xl font-black text-white sm:text-4xl">
          ¡Bienvenido, {name}!
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Sigue tu avance y completa tu quiniela antes del cierre.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          {/* Progress block */}
          <div className="flex flex-col justify-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-200">Tu progreso general</p>
              <span className="font-display text-2xl font-black text-white">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
            <p className="text-xs text-slate-400">
              {progress === 100
                ? '¡Quiniela completa! Estás listo.'
                : 'Completa las 4 fases para llegar al 100%.'}
            </p>
          </div>

          {/* Countdown block */}
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-fifa-gold/20 bg-gradient-to-br from-fifa-gold/10 to-fifa-blue/10 px-6 py-5 text-center">
            <Clock className="h-6 w-6 text-fifa-gold" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fifa-gold">Tiempo restante</p>
            <CountdownTimer deadline={config?.deadline} />
            {isLocked && (
              <p className="mt-1 text-xs font-semibold text-amber-400">Edición bloqueada</p>
            )}
          </div>
        </div>
      </div>

      {/* Phase cards */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Fases de la quiniela</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PhaseCard
            icon={Trophy}
            label="Grupos"
            done={completedGroups}
            total={12}
            to="/groups"
            locked={isLocked}
          />
          <PhaseCard
            icon={Users2}
            label="Mejores terceros"
            done={selectedThirds}
            total={8}
            to="/best-thirds"
            locked={isLocked}
          />
          <PhaseCard
            icon={Shield}
            label="Bracket"
            done={knockoutDone}
            total={31}
            to="/knockout"
            locked={isLocked}
          />
          <PhaseCard
            icon={BarChart3}
            label="Mi predicción"
            done={knockout.predictions.find((p) => p.match_code === 'FIN_01') ? 1 : 0}
            total={1}
            to="/my-prediction"
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/scoreboard"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
        >
          Ver scoreboard
        </Link>
        <Link
          to="/my-prediction"
          className="rounded-2xl border border-fifa-gold/25 bg-fifa-gold/10 px-4 py-2 text-sm font-semibold text-fifa-gold transition hover:bg-fifa-gold/20"
        >
          Ver mi quiniela completa
        </Link>
      </div>

    </section>
  )
}
