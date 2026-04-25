import { ArrowLeft, CalendarClock, Trophy, Users2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CountdownTimer from '../components/common/CountdownTimer'
import { useAppConfig } from '../hooks/useAppConfig'
import { useAppLayoutChromeHidden } from '../hooks/useAppLayoutChrome'
import { useAuth } from '../hooks/useAuth'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { getLeaderboardLabel, getLeaderboardSpotlight } from '../utils/leaderboard'
import messiBackground from '../assets/branding/messi_background.jpg'

function getBreakdownValue(entry, key) {
  return Number(entry?.breakdown?.[key] ?? entry?.[key] ?? 0)
}

function getGroupStagePoints(entry) {
  return (
    getBreakdownValue(entry, 'group_exact_points') +
    getBreakdownValue(entry, 'group_qualified_points') +
    getBreakdownValue(entry, 'best_third_points')
  )
}

function getKnockoutPoints(entry) {
  return (
    getBreakdownValue(entry, 'round_of_32_points') +
    getBreakdownValue(entry, 'round_of_16_points') +
    getBreakdownValue(entry, 'quarter_finals_points') +
    getBreakdownValue(entry, 'semi_finals_points') +
    getBreakdownValue(entry, 'final_points')
  )
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const { config } = useAppConfig()
  const { leaderboard, loading, error } = useLeaderboard()
  useAppLayoutChromeHidden(loading)

  const spotlight = getLeaderboardSpotlight(leaderboard, user?.id)
  const spotlightEntry = spotlight.entry
  const spotlightRankLabel = spotlight.rank ? `#${spotlight.rank}` : '--'
  const spotlightCopy =
    spotlight.mode === 'current'
      ? `${spotlightEntry?.total_points ?? 0} pts acumulados`
      : spotlight.mode === 'leader'
        ? `${getLeaderboardLabel(spotlightEntry)} lidera con ${spotlightEntry?.total_points ?? 0} pts`
        : 'La posicion aparecera cuando exista al menos un jugador visible en la tabla general.'

  if (loading) {
    return (
      <div className="groups-summary-panel">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <section className="dashboard-services-panel groups-page-panel scoreboard-page-panel">
      {error ? (
        <div className="dashboard-alert">
          <p className="dashboard-alert-title">No se pudo cargar el scoreboard en tiempo real.</p>
          <p className="dashboard-alert-copy">
            La vista sigue disponible, pero conviene revisar la tabla `user_scores` y la Edge Function que recalcula los puntajes.
          </p>
        </div>
      ) : null}

      <div className="scoreboard-back-row">
        <Link to="/dashboard" className="button-secondary groups-back-button scoreboard-back-button">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al menu</span>
        </Link>
      </div>

      <article
        className="scoreboard-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(5, 11, 23, 0.9) 0%, rgba(5, 11, 23, 0.68) 42%, rgba(5, 11, 23, 0.5) 100%), url(${messiBackground})`,
        }}
      >
        <div className="scoreboard-hero-overlay" />

        <div className="scoreboard-hero-copy">
          <p className="scoreboard-hero-kicker">Tabla general</p>
          <h1 className="scoreboard-hero-title">Scoreboard del torneo</h1>
          <p className="scoreboard-hero-description">
            Sigue la competencia del Mundialito con una vista clara de posiciones, avance y puntos oficiales del torneo.
          </p>

          <div className="scoreboard-hero-actions">
            <span className="scoreboard-hero-chip">
              <Trophy className="h-4 w-4" />
              <span>{leaderboard.length} jugadores en competencia</span>
            </span>
            <span className="scoreboard-hero-chip">
              <span>Solo cuentan resultados oficiales del Mundial</span>
            </span>
          </div>
        </div>

        <div className="scoreboard-hero-side">
          <div className="scoreboard-hero-stat">
            <span className="scoreboard-hero-stat-label">{spotlight.mode === 'current' ? 'Tu puesto' : 'Lider actual'}</span>
            <strong className="scoreboard-hero-stat-value">{spotlightRankLabel}</strong>
            <p className="scoreboard-hero-stat-copy">{spotlightCopy}</p>
          </div>

          <div className="scoreboard-hero-stat">
            <span className="scoreboard-hero-stat-label">Cierre de picks</span>
            <div className="scoreboard-hero-countdown">
              <CalendarClock className="h-4 w-4" />
              <CountdownTimer deadline={config?.deadline} />
            </div>
            <p className="scoreboard-hero-stat-copy">El admin controla el cierre global desde su panel.</p>
          </div>
        </div>
      </article>

      <div className="groups-summary-panel scoreboard-table-panel">
        <div className="groups-summary-head">
          <div className="groups-section-copy">
            <p className="groups-section-kicker">Tabla general</p>
            <h2 className="groups-section-title">Scoreboard del torneo</h2>
            <p className="groups-section-description">
              Cada fila te deja entrar a la quiniela del jugador. La tabla separa lo ganado en fase de grupos, eliminatorias y bonus.
            </p>
          </div>

          <span className="groups-validation-pill is-valid">
            <Users2 className="h-4 w-4" />
            <span>{leaderboard.length} participantes</span>
          </span>
        </div>

        <div className="scoreboard-table-wrap">
          <div className="scoreboard-table-head-row">
            <span>Pos</span>
            <span>Jugador</span>
            <span>Grupos</span>
            <span>Eliminatorias</span>
            <span>Bonus</span>
            <span>Total</span>
            <span>Avance</span>
          </div>

          <div className="scoreboard-table-body">
            {leaderboard.length ? (
              leaderboard.map((entry, index) => {
                const isCurrent = entry.user_id === user?.id
                const groupPoints = getGroupStagePoints(entry)
                const knockoutPoints = getKnockoutPoints(entry)
                const bonusPoints =
                  getBreakdownValue(entry, 'champion_bonus_points') +
                  getBreakdownValue(entry, 'match_score_bonus_points')
                const progress = Number(entry.completion_percentage ?? 0)

                return (
                  <Link
                    key={`${entry.user_id}-${index}`}
                    to={`/predictions/${entry.user_id}`}
                    className={`scoreboard-table-row${isCurrent ? ' is-current' : ''}`}
                  >
                    <div className="scoreboard-table-position">
                      <span className="scoreboard-table-position-number">#{index + 1}</span>
                      <span className="scoreboard-table-position-copy">Lugar</span>
                    </div>

                    <div className="scoreboard-table-player">
                      <div className="scoreboard-table-player-copy">
                        <strong>{entry.profiles?.display_name ?? entry.profiles?.username ?? 'Usuario'}</strong>
                        <span>@{entry.profiles?.username ?? 'sin-username'}</span>
                      </div>
                    </div>

                    <div className="scoreboard-table-stat">
                      <strong>{groupPoints}</strong>
                      <span>pts</span>
                    </div>

                    <div className="scoreboard-table-stat">
                      <strong>{knockoutPoints}</strong>
                      <span>pts</span>
                    </div>

                    <div className="scoreboard-table-stat">
                      <strong>{bonusPoints}</strong>
                      <span>bonus</span>
                    </div>

                    <div className="scoreboard-table-total">
                      <strong>{entry.total_points ?? 0}</strong>
                      <span>pts</span>
                    </div>

                    <div className="scoreboard-table-progress">
                      <div className="scoreboard-table-progress-bar">
                        <div className="scoreboard-table-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span>{progress}%</span>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="groups-stage-feedback">
                Todavia no hay jugadores activos visibles en el scoreboard. Apenas exista un usuario activo, aqui aparecera la tabla.
              </div>
            )}
          </div>
        </div>

        <div className="scoreboard-mobile-list">
          {leaderboard.length ? (
            leaderboard.map((entry, index) => {
              const isCurrent = entry.user_id === user?.id
              const groupPoints = getGroupStagePoints(entry)
              const knockoutPoints = getKnockoutPoints(entry)
              const bonusPoints =
                getBreakdownValue(entry, 'champion_bonus_points') +
                getBreakdownValue(entry, 'match_score_bonus_points')
              const progress = Number(entry.completion_percentage ?? 0)

              return (
                <Link
                  key={`mobile-${entry.user_id}-${index}`}
                  to={`/predictions/${entry.user_id}`}
                  className={`scoreboard-mobile-card${isCurrent ? ' is-current' : ''}`}
                >
                  <div className="scoreboard-mobile-card-top">
                    <div className="scoreboard-mobile-card-rank">
                      <span>Pos</span>
                      <strong>#{index + 1}</strong>
                    </div>

                    <div className="scoreboard-mobile-card-player">
                      <strong>{entry.profiles?.display_name ?? entry.profiles?.username ?? 'Usuario'}</strong>
                      <span>@{entry.profiles?.username ?? 'sin-username'}</span>
                    </div>
                  </div>

                  <div className="scoreboard-mobile-card-grid">
                    <div className="scoreboard-mobile-card-stat">
                      <span>Grupos</span>
                      <strong>{groupPoints} pts</strong>
                    </div>
                    <div className="scoreboard-mobile-card-stat">
                      <span>Eliminatorias</span>
                      <strong>{knockoutPoints} pts</strong>
                    </div>
                    <div className="scoreboard-mobile-card-stat">
                      <span>Bonus</span>
                      <strong>{bonusPoints}</strong>
                    </div>
                    <div className="scoreboard-mobile-card-stat is-total">
                      <span>Total</span>
                      <strong>{entry.total_points ?? 0} pts</strong>
                    </div>
                  </div>

                  <div className="scoreboard-mobile-card-progress">
                    <div className="scoreboard-mobile-card-progress-row">
                      <span>Avance</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="scoreboard-table-progress-bar">
                      <div className="scoreboard-table-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="groups-stage-feedback">
              Todavia no hay jugadores activos visibles en el scoreboard. Apenas exista un usuario activo, aqui aparecera la tabla.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
