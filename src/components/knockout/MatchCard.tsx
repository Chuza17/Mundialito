import { CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react'
import { forwardRef } from 'react'
import TeamOrb, { getTeamTokenLabel } from '../common/TeamOrb'
import { isBestThirdSource } from '../../utils/bracketLogic'
import { ROUNDS } from '../../utils/constants'
import type { BracketMatch, BracketTeam } from './bracketTypes'

type MatchCardProps = {
  disabled?: boolean
  match: BracketMatch
  side?: 'left' | 'right' | 'center'
  onPick: (matchCode: string, winnerTeamId: string | number) => void
}

function getSourceHint(match: BracketMatch, side: 'home' | 'away') {
  const sourceType = side === 'home' ? match.home_source_type : match.away_source_type
  const sourceGroup = side === 'home' ? match.home_source_group : match.away_source_group
  const sourcePosition = side === 'home' ? match.home_source_position : match.away_source_position
  const sourceMatch = side === 'home' ? match.home_source_match : match.away_source_match

  if (isBestThirdSource(sourceType, sourceGroup, sourcePosition)) {
    return 'M3'
  }

  if (sourceType === 'group_position') {
    return `${sourceGroup}${sourcePosition}`
  }

  if (sourceType === 'match_winner') {
    return sourceMatch?.replace('_', ' ') ?? 'Previo'
  }

  return 'DEF'
}

function getWinnerId(winner: BracketMatch['winnerTeamId']) {
  if (!winner) return null
  if (typeof winner === 'object' && 'id' in winner && winner.id) return winner.id
  return winner
}

function getCardTone(round: string) {
  if (round === ROUNDS.FINAL) {
    return 'border-amber-200/20 bg-[radial-gradient(circle_at_top,rgba(255,226,122,0.18),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(10,15,28,0.96))] shadow-[0_30px_90px_rgba(0,0,0,0.4)]'
  }

  if (round === ROUNDS.SEMI_FINALS) {
    return 'border-sky-200/20 bg-[linear-gradient(180deg,rgba(16,30,53,0.94),rgba(9,15,27,0.94))] shadow-[0_22px_64px_rgba(0,0,0,0.34)]'
  }

  return 'border-white/10 bg-[linear-gradient(180deg,rgba(18,29,46,0.92),rgba(10,16,29,0.92))] shadow-[0_20px_50px_rgba(0,0,0,0.28)]'
}

function getStatusLabel(match: BracketMatch) {
  if (getWinnerId(match.winnerTeamId)) return 'Resuelto'
  if (match.canPredict) return 'Selecciona'
  return 'Pendiente'
}

function TeamRow({
  disabled = false,
  team,
  hint,
  isSelected,
  isLocked,
  onPick,
  slot,
}: {
  disabled?: boolean
  team?: BracketTeam | null
  hint: string
  isSelected: boolean
  isLocked: boolean
  onPick: () => void
  slot: 'home' | 'away'
}) {
  if (!team) {
    return (
      <div
        data-team-slot={slot}
        className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.035] px-3 py-2 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900/70 text-[11px] font-semibold tracking-[0.22em] text-slate-400">
          {hint}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-slate-200/70">Esperando clasificado</p>
          <p className="truncate text-[11px] uppercase tracking-[0.18em] text-slate-500">Se define antes</p>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      data-team-slot={slot}
      disabled={disabled}
      onClick={onPick}
      title={team.name}
      className={`group flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition duration-200 ${
        isSelected
          ? 'border-sky-300/55 bg-[linear-gradient(90deg,rgba(93,157,255,0.22),rgba(30,200,120,0.16))] shadow-[0_14px_30px_rgba(93,157,255,0.18)]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.065]'
      } ${isLocked ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      <TeamOrb team={team} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-white">{team.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            {getTeamTokenLabel(team)}
          </span>
          {team.group_letter ? (
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Grupo {team.group_letter}</span>
          ) : null}
        </div>
      </div>
      {isSelected ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
      ) : isLocked ? (
        <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" />
      ) : (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/20 bg-transparent transition group-hover:border-sky-300/60 group-hover:bg-sky-300/50" />
      )}
    </button>
  )
}

const MatchCard = forwardRef<HTMLDivElement, MatchCardProps>(function MatchCard(
  { disabled = false, match, side = 'left', onPick },
  ref
) {
  const winnerId = getWinnerId(match.winnerTeamId)
  const isLocked = disabled || !match.canPredict
  const alignClass = side === 'right' ? 'items-end text-right' : side === 'center' ? 'items-center text-center' : 'items-start text-left'

  return (
    <article
      ref={ref}
      data-match-code={match.match_code}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] border p-3 backdrop-blur-xl transition duration-300 ${getCardTone(
        match.round
      )} ${match.canPredict ? 'hover:-translate-y-0.5 hover:border-white/16' : ''}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,180,255,0.12),transparent_40%)] opacity-80" />
      <div className={`relative mb-3 flex gap-2 ${side === 'right' ? 'flex-row-reverse' : 'justify-between'} ${alignClass}`}>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            {match.display_name || match.match_code}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold text-white">{match.match_code.replace('_', ' ')}</h3>
        </div>
        <span
          className={`inline-flex h-fit items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${
            winnerId
              ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
              : match.canPredict
                ? 'border-sky-400/20 bg-sky-500/10 text-sky-200'
                : 'border-white/10 bg-white/[0.04] text-slate-400'
          }`}
        >
          {winnerId ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {getStatusLabel(match)}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col gap-2">
        <TeamRow
          slot="home"
          team={match.homeTeam}
          hint={getSourceHint(match, 'home')}
          isSelected={winnerId === match.homeTeam?.id}
          isLocked={isLocked}
          disabled={isLocked || !match.homeTeam}
          onPick={() => match.homeTeam && onPick(match.match_code, match.homeTeam.id)}
        />
        <TeamRow
          slot="away"
          team={match.awayTeam}
          hint={getSourceHint(match, 'away')}
          isSelected={winnerId === match.awayTeam?.id}
          isLocked={isLocked}
          disabled={isLocked || !match.awayTeam}
          onPick={() => match.awayTeam && onPick(match.match_code, match.awayTeam.id)}
        />
      </div>
    </article>
  )
})

export default MatchCard
