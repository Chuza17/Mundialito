import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Crown, LockKeyhole, Sparkles, Trophy } from 'lucide-react'
import TeamOrb, { getTeamTokenLabel } from '../common/TeamOrb'
import { getMatchesByRound, isBestThirdSource } from '../../utils/bracketLogic'
import { ROUND_NAMES, ROUNDS } from '../../utils/constants'
import type { BracketBoardProps, BracketMatch, BracketTeam } from './bracketTypes'

const ROUND_ORDER = [
  ROUNDS.ROUND_OF_32,
  ROUNDS.ROUND_OF_16,
  ROUNDS.QUARTER_FINALS,
  ROUNDS.SEMI_FINALS,
  ROUNDS.FINAL,
] as const

const ROUND_LABELS = {
  [ROUNDS.ROUND_OF_32]: '16vos',
  [ROUNDS.ROUND_OF_16]: 'Octavos',
  [ROUNDS.QUARTER_FINALS]: 'Cuartos',
  [ROUNDS.SEMI_FINALS]: 'Semis',
  [ROUNDS.FINAL]: 'Final',
}

const CONFETTI_COLORS = ['#7db4ff', '#5bd18b', '#ffe27a', '#ff8f70', '#b28cff', '#ffffff']

function getDefaultRound(groupedMatches: Record<string, BracketMatch[]>) {
  return (
    ROUND_ORDER.find((round) => groupedMatches[round]?.some((match) => !match.winnerTeamId)) ??
    ROUND_ORDER.find((round) => groupedMatches[round]?.length) ??
    ROUNDS.ROUND_OF_32
  )
}

function getGridClass(totalMatches: number) {
  if (totalMatches <= 1) return 'grid-cols-1'
  if (totalMatches === 2) return 'grid-cols-1 md:grid-cols-2'
  if (totalMatches <= 4) return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
  return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
}

function getSourceHint(match: BracketMatch, side: 'home' | 'away') {
  const sourceType = side === 'home' ? match.home_source_type : match.away_source_type
  const sourceGroup = side === 'home' ? match.home_source_group : match.away_source_group
  const sourcePosition = side === 'home' ? match.home_source_position : match.away_source_position
  const sourceMatch = side === 'home' ? match.home_source_match : match.away_source_match

  if (isBestThirdSource(sourceType, sourceGroup, sourcePosition)) {
    return 'Mejor 3ro'
  }

  if (sourceType === 'group_position') {
    return `Grupo ${sourceGroup} · ${sourcePosition}º`
  }

  if (sourceType === 'match_winner') {
    return `Ganador ${sourceMatch?.replace('_', ' ') ?? ''}`.trim()
  }

  return 'Por definir'
}

function getWinnerId(winner: BracketMatch['winnerTeamId']) {
  if (!winner) return null
  if (typeof winner === 'object' && 'id' in winner && winner.id) return winner.id
  return winner
}

function RoundSelectorCard({
  active,
  resolvedCount,
  round,
  totalCount,
  onSelect,
}: {
  active: boolean
  resolvedCount: number
  round: string
  totalCount: number
  onSelect: () => void
}) {
  const isComplete = totalCount > 0 && resolvedCount === totalCount

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`groups-selector-card${active ? ' is-active' : ''}`}
    >
      <div className="groups-selector-card-head">
        <div>
          <span className="groups-selector-card-kicker">Ronda</span>
          <strong className="groups-selector-card-letter">{ROUND_LABELS[round]}</strong>
        </div>
        <span className={`groups-selector-card-status${isComplete ? ' is-complete' : ''}`}>
          {isComplete ? 'Listo' : `${resolvedCount}/${totalCount}`}
        </span>
      </div>

      <div className="groups-selector-card-codes">
        <span className="groups-selector-card-code">{ROUND_NAMES[round]}</span>
        <span className="groups-selector-card-code">{`${totalCount} llaves`}</span>
      </div>
    </button>
  )
}

function TeamOption({
  disabled = false,
  selected = false,
  team,
  hint,
  onPick,
}: {
  disabled?: boolean
  selected?: boolean
  team?: BracketTeam | null
  hint: string
  onPick: () => void
}) {
  if (!team) {
    return (
      <div className="knockout-round-team-option is-placeholder">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900/70 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          ?
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-200/80">Esperando clasificado</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{hint}</p>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className={`knockout-round-team-option${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
    >
      <TeamOrb team={team} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{team.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            {getTeamTokenLabel(team)}
          </span>
          {team.group_letter ? (
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Grupo {team.group_letter}</span>
          ) : null}
        </div>
      </div>
      {selected ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
      ) : disabled ? (
        <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" />
      ) : (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/20 bg-transparent" />
      )}
    </button>
  )
}

function RoundMatchCard({
  disabled = false,
  match,
  onPick,
}: {
  disabled?: boolean
  match: BracketMatch
  onPick: (matchCode: string, winnerTeamId: string | number) => void
}) {
  const winnerId = getWinnerId(match.winnerTeamId)
  const canSelect = !disabled && Boolean(match.canPredict)

  return (
    <article className={`groups-placement-slot knockout-round-card${winnerId ? ' is-complete' : ''}`}>
      <div className="groups-placement-slot-top">
        <div>
          <span className="groups-placement-slot-kicker">{match.display_name || 'Llave'}</span>
          <strong className="groups-placement-slot-rank knockout-round-card-code">{match.match_code.replace('_', ' ')}</strong>
        </div>
        <span
          className={`groups-validation-pill knockout-round-card-pill${winnerId ? ' is-valid' : ''}${
            winnerId ? '' : match.canPredict ? ' is-pending' : ' is-muted'
          }`}
        >
          {winnerId ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          <span>{winnerId ? 'Resuelto' : match.canPredict ? 'Elegir' : 'Pendiente'}</span>
        </span>
      </div>

      <div className="knockout-round-card-body">
        <TeamOption
          team={match.homeTeam}
          hint={getSourceHint(match, 'home')}
          disabled={!canSelect || !match.homeTeam}
          selected={winnerId === match.homeTeam?.id}
          onPick={() => match.homeTeam && onPick(match.match_code, match.homeTeam.id)}
        />
        <TeamOption
          team={match.awayTeam}
          hint={getSourceHint(match, 'away')}
          disabled={!canSelect || !match.awayTeam}
          selected={winnerId === match.awayTeam?.id}
          onPick={() => match.awayTeam && onPick(match.match_code, match.awayTeam.id)}
        />
      </div>

      <div className="groups-placement-slot-footer">
        <span className="groups-placement-slot-points">{winnerId ? 'Ganador elegido' : 'Llave abierta'}</span>
        <span className="groups-placement-slot-note">
          {match.canPredict ? 'Toca un equipo para avanzar' : 'Esperando clasificados'}
        </span>
      </div>
    </article>
  )
}

function ChampionSpotlight({
  championTeam,
  celebrate = false,
}: {
  championTeam?: BracketTeam | null
  celebrate?: boolean
}) {
  const confettiPieces = Array.from({ length: 18 }, (_, index) => ({
    id: `${championTeam?.id ?? 'champion'}-${index}`,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    left: `${(index * 17 + 9) % 100}%`,
    delay: `${(index % 5) * 0.12}s`,
    duration: `${2.7 + (index % 4) * 0.28}s`,
    size: `${8 + (index % 3) * 3}px`,
    rotate: `${(index * 27) % 360}deg`,
  }))

  return (
    <div className="groups-summary-panel knockout-champion-panel">
      {celebrate && championTeam ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-0 rounded-full opacity-0"
              style={{
                left: piece.left,
                width: piece.size,
                height: `calc(${piece.size} * 0.58)`,
                background: piece.color,
                transform: `rotate(${piece.rotate})`,
                animation: `bracket-confetti-fall ${piece.duration} ease-in forwards`,
                animationDelay: piece.delay,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="groups-stage-head">
        <div className="groups-section-copy">
          <p className="groups-section-kicker">Campeon pronosticado</p>
          <h2 className="groups-section-title knockout-champion-title">{championTeam ? championTeam.name : 'Pendiente'}</h2>
          <p className="groups-section-description">Este bloque sigue el mismo ritmo visual de la fase de grupos.</p>
        </div>
        <span className={`groups-validation-pill${championTeam ? ' is-valid' : ''}`}>
          <Trophy className="h-4 w-4" />
          <span>{championTeam ? 'Campeon listo' : 'Pendiente'}</span>
        </span>
      </div>

      <div className="relative">
        {championTeam ? (
          <div className="knockout-champion-team-card">
            <TeamOrb team={championTeam} size="lg" />
            <div>
              <strong>{championTeam.name}</strong>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {getTeamTokenLabel(championTeam)}
                </span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-amber-100/70">Campeon</span>
              </div>
            </div>
            <Crown className="ml-auto h-5 w-5 text-amber-200/80" />
          </div>
        ) : (
          <div className="groups-stage-feedback">
            <p className="text-sm font-medium text-slate-200">Aun no has elegido al campeon.</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">Cuando completes la final aparecera aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BracketRoundsGroupsView({
  matches,
  disabled = false,
  onPick,
  championTeam,
  celebrate = false,
}: BracketBoardProps) {
  const groupedMatches = useMemo(() => getMatchesByRound(matches), [matches])
  const [activeRound, setActiveRound] = useState(() => getDefaultRound(groupedMatches))

  useEffect(() => {
    if (!groupedMatches[activeRound]?.length) {
      setActiveRound(getDefaultRound(groupedMatches))
    }
  }, [activeRound, groupedMatches])

  const activeRoundIndex = ROUND_ORDER.indexOf(activeRound)
  const activeMatches = groupedMatches[activeRound] ?? []
  const resolvedCount = activeMatches.filter((match) => Boolean(match.winnerTeamId)).length
  const selectableCount = activeMatches.filter((match) => Boolean(match.canPredict)).length
  const completionRatio = activeMatches.length ? Math.round((resolvedCount / activeMatches.length) * 100) : 0
  const isFinalRound = activeRound === ROUNDS.FINAL

  return (
    <div className="knockout-rounds-shell">
      <div className="groups-selector-panel knockout-rounds-panel-shell">
        <div className="groups-section-copy">
          <p className="groups-section-kicker">Eliminatorias por rondas</p>
          <h2 className="groups-section-title">Completa una etapa a la vez</h2>
          <p className="groups-section-description">
            Ahora el flujo de eliminatorias sigue la misma logica visual de grupos: eliges un bloque, lo completas y sigues a
            la siguiente etapa sin saturacion.
          </p>
        </div>

        <div className="dashboard-services-overview groups-overview-grid knockout-rounds-overview-grid">
          <div className="dashboard-overview-card">
            <span className="dashboard-overview-label">Ronda activa</span>
            <strong className="dashboard-overview-value">{ROUND_LABELS[activeRound]}</strong>
          </div>
          <div className="dashboard-overview-card">
            <span className="dashboard-overview-label">Resueltas</span>
            <strong className="dashboard-overview-value">
              {resolvedCount}/{activeMatches.length}
            </strong>
          </div>
          <div className="dashboard-overview-card">
            <span className="dashboard-overview-label">Disponibles</span>
            <strong className="dashboard-overview-value">{selectableCount} llaves</strong>
          </div>
        </div>

        <div className="groups-selector-scroller">
          <div className="groups-selector-track knockout-rounds-track">
            {ROUND_ORDER.map((round) => {
              const roundMatches = groupedMatches[round] ?? []
              const roundResolved = roundMatches.filter((match) => Boolean(match.winnerTeamId)).length

              return (
                <RoundSelectorCard
                  key={round}
                  round={round}
                  active={activeRound === round}
                  resolvedCount={roundResolved}
                  totalCount={roundMatches.length}
                  onSelect={() => setActiveRound(round)}
                />
              )
            })}
          </div>
        </div>
      </div>

      <div className="knockout-rounds-layout">
        <div className="groups-stage-panel">
          <div className="groups-stage-head">
            <div className="groups-section-copy">
              <p className="groups-section-kicker">Pantalla de ronda</p>
              <h2 className="groups-section-title">{ROUND_NAMES[activeRound]}</h2>
              <p className="groups-section-description">
                Aqui solo ves las llaves de esta etapa. Elige el ganador de cada partido y la siguiente ronda se alimenta de
                forma automatica.
              </p>
            </div>

            <span className={`groups-validation-pill${completionRatio === 100 ? ' is-valid' : ''}`}>
              {completionRatio === 100 ? 'Ronda completa' : `${completionRatio}% listo`}
            </span>
          </div>

          <div className={`knockout-round-card-grid ${getGridClass(activeMatches.length)}`}>
            {activeMatches.map((match) => (
              <RoundMatchCard
                key={match.match_code}
                disabled={disabled}
                match={match}
                onPick={onPick}
              />
            ))}
          </div>

          <p className={`groups-stage-feedback${completionRatio === 100 ? ' is-valid' : ''}`}>
            {isFinalRound
              ? 'La final define directamente el campeon.'
              : 'Cuando termines esta ronda, continua con la siguiente etapa para seguir completando el camino.'}
          </p>

          <div className="knockout-round-nav">
            <button
              type="button"
              disabled={activeRoundIndex <= 0}
              onClick={() => setActiveRound(ROUND_ORDER[Math.max(0, activeRoundIndex - 1)])}
              className="button-secondary groups-back-button knockout-round-nav-button"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Ronda anterior</span>
            </button>

            <button
              type="button"
              disabled={activeRoundIndex >= ROUND_ORDER.length - 1}
              onClick={() => setActiveRound(ROUND_ORDER[Math.min(ROUND_ORDER.length - 1, activeRoundIndex + 1)])}
              className="button-secondary groups-back-button knockout-round-nav-button"
            >
              <span>Siguiente ronda</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <aside className="knockout-rounds-side">
          <div className="groups-summary-panel">
            <div className="groups-summary-head">
              <div className="groups-section-copy">
                <p className="groups-section-kicker">Guia visual</p>
                <h2 className="groups-section-title">Como usar esta etapa</h2>
                <p className="groups-section-description">
                  La pantalla copia el mismo orden visual de grupos: seleccion, bloque principal y resumen.
                </p>
              </div>
            </div>

            <div className="groups-table-wrap">
              <div className="groups-table-body">
                <div className="groups-table-row knockout-side-tip-row">
                  <div className="groups-table-position">
                    <span className="groups-table-position-number">1</span>
                    <span className="groups-table-position-copy">Elegir</span>
                  </div>
                  <div className="groups-table-team">
                    <div className="groups-table-team-copy">
                      <strong>Toca el equipo que quieres que avance</strong>
                      <span>El sistema actualiza la siguiente ronda</span>
                    </div>
                  </div>
                  <div className="groups-table-position">
                    <span className="groups-table-position-copy">Paso</span>
                  </div>
                </div>

                <div className="groups-table-row knockout-side-tip-row">
                  <div className="groups-table-position">
                    <span className="groups-table-position-number">2</span>
                    <span className="groups-table-position-copy">Revisar</span>
                  </div>
                  <div className="groups-table-team">
                    <div className="groups-table-team-copy">
                      <strong>Comprueba la ronda siguiente</strong>
                      <span>Si falta un clasificado veras de donde viene el cupo</span>
                    </div>
                  </div>
                  <div className="groups-table-position">
                    <span className="groups-table-position-copy">Flujo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="groups-summary-panel">
            <div className="groups-summary-head">
              <div className="groups-section-copy">
                <p className="groups-section-kicker">Resumen rapido</p>
                <h2 className="groups-section-title">Estado de la ronda</h2>
                <p className="groups-section-description">Mismo tono, mismos bloques y misma lectura que la fase de grupos.</p>
              </div>
            </div>

            <div className="dashboard-services-overview groups-overview-grid knockout-side-overview-grid">
              <div className="dashboard-overview-card">
                <span className="dashboard-overview-label">Etapa actual</span>
                <strong className="dashboard-overview-value">{ROUND_LABELS[activeRound]}</strong>
              </div>
              <div className="dashboard-overview-card">
                <span className="dashboard-overview-label">Llaves listas</span>
                <strong className="dashboard-overview-value">{resolvedCount}</strong>
              </div>
              <div className="dashboard-overview-card">
                <span className="dashboard-overview-label">Sin definir</span>
                <strong className="dashboard-overview-value">{Math.max(activeMatches.length - resolvedCount, 0)}</strong>
              </div>
            </div>
          </div>

          <ChampionSpotlight championTeam={championTeam} celebrate={celebrate && isFinalRound} />
        </aside>
      </div>
    </div>
  )
}
