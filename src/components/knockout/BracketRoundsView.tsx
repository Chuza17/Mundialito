import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crown,
  LockKeyhole,
  Sparkles,
  Trophy,
} from 'lucide-react'
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
  if (totalMatches <= 8) return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
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
      <div className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-3">
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
      className={`flex min-h-[64px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition duration-200 ${
        selected
          ? 'border-sky-300/55 bg-[linear-gradient(90deg,rgba(93,157,255,0.24),rgba(38,190,120,0.14))] shadow-[0_14px_34px_rgba(93,157,255,0.16)]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]'
      } ${disabled ? 'cursor-not-allowed opacity-75' : ''}`}
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
    <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,29,47,0.94),rgba(10,16,29,0.96))] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,180,255,0.12),transparent_38%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{match.display_name || 'Llave'}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{match.match_code.replace('_', ' ')}</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
            winnerId
              ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
              : match.canPredict
                ? 'border-sky-400/20 bg-sky-500/10 text-sky-200'
                : 'border-white/10 bg-white/[0.04] text-slate-400'
          }`}
        >
          {winnerId ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {winnerId ? 'Resuelto' : match.canPredict ? 'Elegir' : 'Pendiente'}
        </span>
      </div>

      <div className="relative mt-4 space-y-3">
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
    <div className="relative overflow-hidden rounded-[30px] border border-amber-200/18 bg-[radial-gradient(circle_at_top,rgba(255,226,122,0.18),transparent_42%),linear-gradient(180deg,rgba(21,33,53,0.98),rgba(11,17,29,0.98))] px-5 py-5 shadow-[0_30px_80px_rgba(0,0,0,0.34)]">
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

      <div className="relative flex items-center gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/20 bg-amber-300/10 text-amber-100 shadow-[0_0_35px_rgba(255,226,122,0.15)]">
          <Trophy className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/75">Campeon pronosticado</p>
          <h3 className="mt-1 text-2xl font-semibold text-white">
            {championTeam ? championTeam.name : 'Pendiente'}
          </h3>
        </div>
      </div>

      <div className="relative mt-4">
        {championTeam ? (
          <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
            <TeamOrb team={championTeam} size="lg" />
            <div>
              <strong className="block text-lg text-white">{championTeam.name}</strong>
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
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-4">
            <p className="text-sm font-medium text-slate-200">Aun no has elegido al campeon.</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">Cuando completes la final aparecera aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BracketRoundsView({
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
    <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,20,36,0.98),rgba(10,16,28,0.98))] p-6 shadow-[0_36px_90px_rgba(0,0,0,0.34)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ffe27a]">Eliminatorias por rondas</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-white">Completa una etapa a la vez</h2>
          <p className="mt-3 text-base leading-7 text-slate-300">
            Dejamos atras el arbol gigante. Ahora cada ronda tiene su propia pantalla visual dentro del mismo flujo para que
            puedas concentrarte en elegir ganadores sin ruido.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Ronda activa</p>
            <strong className="mt-1 block text-lg text-white">{ROUND_LABELS[activeRound]}</strong>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Resueltas</p>
            <strong className="mt-1 block text-lg text-white">
              {resolvedCount}/{activeMatches.length}
            </strong>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Disponibles</p>
            <strong className="mt-1 block text-lg text-white">{selectableCount} llaves</strong>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {ROUND_ORDER.map((round, index) => {
              const roundMatches = groupedMatches[round] ?? []
              const roundResolved = roundMatches.filter((match) => Boolean(match.winnerTeamId)).length
              const isActive = activeRound === round

              return (
                <button
                  key={round}
                  type="button"
                  onClick={() => setActiveRound(round)}
                  className={`min-w-[180px] rounded-[22px] border px-4 py-4 text-left transition duration-200 ${
                    isActive
                      ? 'border-sky-300/45 bg-[linear-gradient(135deg,rgba(93,157,255,0.18),rgba(20,30,50,0.85))] shadow-[0_16px_34px_rgba(93,157,255,0.14)]'
                      : 'border-white/10 bg-[linear-gradient(180deg,rgba(15,24,40,0.92),rgba(10,16,28,0.92))] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Etapa {index + 1}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        isActive
                          ? 'border-sky-300/30 bg-sky-400/10 text-sky-100'
                          : 'border-white/10 bg-white/[0.04] text-slate-400'
                      }`}
                    >
                      {roundResolved}/{roundMatches.length}
                    </span>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{ROUND_LABELS[round]}</h3>
                  <p className="mt-1 text-sm text-slate-300">{ROUND_NAMES[round]}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,24,40,0.94),rgba(10,16,28,0.98))] p-5 shadow-[0_26px_68px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ffe27a]">Pantalla de ronda</p>
              <h3 className="mt-2 text-3xl font-semibold text-white">{ROUND_NAMES[activeRound]}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Aqui solo ves las llaves de esta etapa. Elige el ganador de cada partido y el sistema seguira alimentando la
                siguiente ronda automaticamente.
              </p>
            </div>

            <div className="min-w-[220px] rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Progreso</span>
                <span className="text-sm font-semibold text-white">{completionRatio}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-900/80">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#76b2ff,#79d79d,#ffe27a)]"
                  style={{ width: `${completionRatio}%` }}
                />
              </div>
            </div>
          </div>

          <div className={`mt-6 grid gap-4 ${getGridClass(activeMatches.length)}`}>
            {activeMatches.map((match) => (
              <RoundMatchCard
                key={match.match_code}
                disabled={disabled}
                match={match}
                onPick={onPick}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={activeRoundIndex <= 0}
              onClick={() => setActiveRound(ROUND_ORDER[Math.max(0, activeRoundIndex - 1)])}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Ronda anterior</span>
            </button>

            <p className="text-sm text-slate-400">
              {isFinalRound
                ? 'La final define directamente el campeon.'
                : 'Cuando termines esta ronda, continua con la siguiente etapa.'}
            </p>

            <button
              type="button"
              disabled={activeRoundIndex >= ROUND_ORDER.length - 1}
              onClick={() => setActiveRound(ROUND_ORDER[Math.min(ROUND_ORDER.length - 1, activeRoundIndex + 1)])}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Siguiente ronda</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,27,45,0.95),rgba(10,16,28,0.98))] p-5 shadow-[0_22px_56px_rgba(0,0,0,0.28)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">Guia visual</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Como usar esta etapa</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Selecciona un ganador por llave tocando el equipo que quieres que avance.</li>
              <li>Si el partido aun no tiene clasificados, veras la referencia de donde sale ese cupo.</li>
              <li>La siguiente ronda se alimenta automaticamente con tus elecciones guardadas.</li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,27,45,0.95),rgba(10,16,28,0.98))] p-5 shadow-[0_22px_56px_rgba(0,0,0,0.28)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">Resumen rapido</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Etapa actual</span>
                <strong className="mt-1 block text-lg text-white">{ROUND_LABELS[activeRound]}</strong>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Llaves listas</span>
                <strong className="mt-1 block text-lg text-white">{resolvedCount}</strong>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Sin definir</span>
                <strong className="mt-1 block text-lg text-white">{Math.max(activeMatches.length - resolvedCount, 0)}</strong>
              </div>
            </div>
          </div>

          <ChampionSpotlight championTeam={championTeam} celebrate={celebrate && isFinalRound} />
        </aside>
      </div>
    </section>
  )
}
