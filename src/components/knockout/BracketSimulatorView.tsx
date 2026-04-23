import type { CSSProperties } from 'react'
import { CheckCircle2, Crown, LockKeyhole, Trophy } from 'lucide-react'
import TeamOrb, { getTeamTokenLabel } from '../common/TeamOrb'
import { getMatchesByRound, isBestThirdSource } from '../../utils/bracketLogic'
import { ROUND_NAMES, ROUNDS } from '../../utils/constants'
import type { BracketBoardProps, BracketMatch, BracketTeam } from './bracketTypes'

const BOARD = {
  cardWidth: 142,
  columnGap: 28,
  rowHeight: 50,
  rows: 16,
}

const BOARD_WIDTH = BOARD.cardWidth * 9 + BOARD.columnGap * 8
const BOARD_HEIGHT = BOARD.rowHeight * BOARD.rows

const ROUND_LABELS = {
  [ROUNDS.ROUND_OF_32]: '16avos',
  [ROUNDS.ROUND_OF_16]: '8avos',
  [ROUNDS.QUARTER_FINALS]: '4tos',
  [ROUNDS.SEMI_FINALS]: 'Semis',
  [ROUNDS.FINAL]: 'FINAL',
}

const FINAL_LAYOUT = {
  col: 4,
  row: 7,
  span: 3,
}

const CHAMPION_LAYOUT = {
  col: 4,
  row: 11,
  span: 3,
}

const SIDE_LAYOUTS = [
  {
    key: 'left-r32',
    side: 'left',
    round: ROUNDS.ROUND_OF_32,
    col: 0,
    start: 0,
    end: 8,
    rowForIndex: (index: number) => index * 2 + 1,
  },
  {
    key: 'left-r16',
    side: 'left',
    round: ROUNDS.ROUND_OF_16,
    col: 1,
    start: 0,
    end: 4,
    rowForIndex: (index: number) => index * 4 + 2,
  },
  {
    key: 'left-qf',
    side: 'left',
    round: ROUNDS.QUARTER_FINALS,
    col: 2,
    start: 0,
    end: 2,
    rowForIndex: (index: number) => index * 8 + 4,
  },
  {
    key: 'left-sf',
    side: 'left',
    round: ROUNDS.SEMI_FINALS,
    col: 3,
    start: 0,
    end: 1,
    rowForIndex: () => 8,
  },
  {
    key: 'right-sf',
    side: 'right',
    round: ROUNDS.SEMI_FINALS,
    col: 5,
    start: 1,
    end: 2,
    rowForIndex: () => 8,
  },
  {
    key: 'right-qf',
    side: 'right',
    round: ROUNDS.QUARTER_FINALS,
    col: 6,
    start: 2,
    end: 4,
    rowForIndex: (index: number) => index * 8 + 4,
  },
  {
    key: 'right-r16',
    side: 'right',
    round: ROUNDS.ROUND_OF_16,
    col: 7,
    start: 4,
    end: 8,
    rowForIndex: (index: number) => index * 4 + 2,
  },
  {
    key: 'right-r32',
    side: 'right',
    round: ROUNDS.ROUND_OF_32,
    col: 8,
    start: 8,
    end: 16,
    rowForIndex: (index: number) => index * 2 + 1,
  },
] as const

const COLUMN_HEADINGS = [
  { col: 0, label: ROUND_LABELS[ROUNDS.ROUND_OF_32] },
  { col: 1, label: ROUND_LABELS[ROUNDS.ROUND_OF_16] },
  { col: 2, label: ROUND_LABELS[ROUNDS.QUARTER_FINALS] },
  { col: 3, label: ROUND_LABELS[ROUNDS.SEMI_FINALS] },
  { col: 4, label: ROUND_LABELS[ROUNDS.FINAL], featured: true },
  { col: 5, label: ROUND_LABELS[ROUNDS.SEMI_FINALS] },
  { col: 6, label: ROUND_LABELS[ROUNDS.QUARTER_FINALS] },
  { col: 7, label: ROUND_LABELS[ROUNDS.ROUND_OF_16] },
  { col: 8, label: ROUND_LABELS[ROUNDS.ROUND_OF_32] },
]

const CONFETTI_COLORS = ['#7db4ff', '#5bd18b', '#ffe27a', '#ff8f70', '#b28cff', '#ffffff']

type PositionedMatch = {
  key: string
  match: BracketMatch
  col: number
  row: number
  span: number
  side: 'left' | 'right'
}

type Connector = {
  key: string
  active: boolean
  path: string
}

function getWinnerId(winner: BracketMatch['winnerTeamId']) {
  if (!winner) return null
  if (typeof winner === 'object' && 'id' in winner && winner.id) return winner.id
  return winner
}

function getSourceHint(match: BracketMatch, side: 'home' | 'away') {
  const sourceType = side === 'home' ? match.home_source_type : match.away_source_type
  const sourceGroup = side === 'home' ? match.home_source_group : match.away_source_group
  const sourcePosition = side === 'home' ? match.home_source_position : match.away_source_position
  const sourceMatch = side === 'home' ? match.home_source_match : match.away_source_match

  if (isBestThirdSource(sourceType, sourceGroup, sourcePosition)) return 'Mejor 3ro'
  if (sourceType === 'group_position') return `Grupo ${sourceGroup} - ${sourcePosition}o`
  if (sourceType === 'match_winner') return `Ganador ${sourceMatch?.replace('_', ' ') ?? ''}`.trim()

  return 'Por definir'
}

function getColumnX(col: number) {
  return col * (BOARD.cardWidth + BOARD.columnGap)
}

function getRowCenter(row: number, span = 2) {
  return (row - 1 + span / 2) * BOARD.rowHeight
}

function getConnectionPath(source: { col: number; row: number; span: number }, target: { col: number; row: number; span: number }) {
  const movesRight = target.col > source.col
  const sourceX = getColumnX(source.col) + (movesRight ? BOARD.cardWidth : 0)
  const targetX = getColumnX(target.col) + (movesRight ? 0 : BOARD.cardWidth)
  const midX = movesRight ? sourceX + BOARD.columnGap / 2 : sourceX - BOARD.columnGap / 2
  const sourceY = getRowCenter(source.row, source.span)
  const targetY = getRowCenter(target.row, target.span)

  return `M ${sourceX} ${sourceY} H ${midX} V ${targetY} H ${targetX}`
}

function getPositionedMatches(groupedMatches: Record<string, BracketMatch[]>) {
  return SIDE_LAYOUTS.flatMap((layout) => {
    const roundMatches = groupedMatches[layout.round] ?? []

    return roundMatches.slice(layout.start, layout.end).map((match, localIndex) => ({
      key: `${layout.key}-${match.match_code}`,
      match,
      col: layout.col,
      row: layout.rowForIndex(localIndex),
      span: 2,
      side: layout.side,
    })) as PositionedMatch[]
  })
}

function getLayoutMatch(round: string, globalIndex: number, groupedMatches: Record<string, BracketMatch[]>) {
  const layout = SIDE_LAYOUTS.find((item) => item.round === round && globalIndex >= item.start && globalIndex < item.end)
  const match = groupedMatches[round]?.[globalIndex]

  if (!layout || !match) return null

  return {
    match,
    col: layout.col,
    row: layout.rowForIndex(globalIndex - layout.start),
    span: 2,
  }
}

function buildPairConnections(
  groupedMatches: Record<string, BracketMatch[]>,
  sourceRound: string,
  targetRound: string,
  sourceStart: number,
  targetStart: number,
  targetCount: number
) {
  const connections: Connector[] = []

  for (let index = 0; index < targetCount; index += 1) {
    const target = getLayoutMatch(targetRound, targetStart + index, groupedMatches)
    const firstSource = getLayoutMatch(sourceRound, sourceStart + index * 2, groupedMatches)
    const secondSource = getLayoutMatch(sourceRound, sourceStart + index * 2 + 1, groupedMatches)

    ;[firstSource, secondSource].forEach((source, sourceIndex) => {
      if (!source || !target) return

      connections.push({
        key: `${source.match.match_code}-${target.match.match_code}-${sourceIndex}`,
        active: Boolean(getWinnerId(source.match.winnerTeamId)),
        path: getConnectionPath(source, target),
      })
    })
  }

  return connections
}

function getConnectors(groupedMatches: Record<string, BracketMatch[]>) {
  const connections = [
    ...buildPairConnections(groupedMatches, ROUNDS.ROUND_OF_32, ROUNDS.ROUND_OF_16, 0, 0, 4),
    ...buildPairConnections(groupedMatches, ROUNDS.ROUND_OF_16, ROUNDS.QUARTER_FINALS, 0, 0, 2),
    ...buildPairConnections(groupedMatches, ROUNDS.QUARTER_FINALS, ROUNDS.SEMI_FINALS, 0, 0, 1),
    ...buildPairConnections(groupedMatches, ROUNDS.ROUND_OF_32, ROUNDS.ROUND_OF_16, 8, 4, 4),
    ...buildPairConnections(groupedMatches, ROUNDS.ROUND_OF_16, ROUNDS.QUARTER_FINALS, 4, 2, 2),
    ...buildPairConnections(groupedMatches, ROUNDS.QUARTER_FINALS, ROUNDS.SEMI_FINALS, 2, 1, 1),
  ]

  const leftSemi = getLayoutMatch(ROUNDS.SEMI_FINALS, 0, groupedMatches)
  const rightSemi = getLayoutMatch(ROUNDS.SEMI_FINALS, 1, groupedMatches)
  const finalMatch = groupedMatches[ROUNDS.FINAL]?.[0]

  if (finalMatch) {
    ;[leftSemi, rightSemi].forEach((source, index) => {
      if (!source) return

      connections.push({
        key: `${source.match.match_code}-${finalMatch.match_code}-${index}`,
        active: Boolean(getWinnerId(source.match.winnerTeamId)),
        path: getConnectionPath(source, FINAL_LAYOUT),
      })
    })
  }

  return connections
}

function TeamPickButton({
  disabled = false,
  hint,
  onPick,
  selected,
  team,
}: {
  disabled?: boolean
  hint: string
  onPick: () => void
  selected: boolean
  team?: BracketTeam | null
}) {
  if (!team) {
    return (
      <div className="knockout-simulator-team is-placeholder">
        <span className="knockout-simulator-radio" />
        <span className="knockout-simulator-team-code">---</span>
        <span className="knockout-simulator-team-name">{hint}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onPick}
      className={`knockout-simulator-team${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
      title={team.name}
    >
      <span className="knockout-simulator-radio">{selected ? <CheckCircle2 className="h-3 w-3" /> : null}</span>
      <TeamOrb team={team} size="sm" />
      <span className="knockout-simulator-team-copy">
        <strong>{getTeamTokenLabel(team)}</strong>
        <span>{team.name}</span>
      </span>
    </button>
  )
}

function SimulatorMatchCard({
  className = '',
  disabled = false,
  match,
  onPick,
  style,
}: {
  className?: string
  disabled?: boolean
  match: BracketMatch
  onPick: (matchCode: string, winnerTeamId: string | number) => void
  style?: CSSProperties
}) {
  const winnerId = getWinnerId(match.winnerTeamId)
  const canSelect = !disabled && Boolean(match.canPredict)
  const status = winnerId ? 'Listo' : match.canPredict ? 'Elegir' : 'Pendiente'

  return (
    <article
      className={`knockout-simulator-match${winnerId ? ' is-complete' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <div className="knockout-simulator-match-head">
        <span>{match.display_name || ROUND_NAMES[match.round] || 'Llave'}</span>
        <strong className={winnerId ? 'is-complete' : ''}>{status}</strong>
      </div>

      <div className="knockout-simulator-match-options">
        <TeamPickButton
          team={match.homeTeam}
          hint={getSourceHint(match, 'home')}
          disabled={!canSelect || !match.homeTeam}
          selected={winnerId === match.homeTeam?.id}
          onPick={() => match.homeTeam && onPick(match.match_code, match.homeTeam.id)}
        />
        <TeamPickButton
          team={match.awayTeam}
          hint={getSourceHint(match, 'away')}
          disabled={!canSelect || !match.awayTeam}
          selected={winnerId === match.awayTeam?.id}
          onPick={() => match.awayTeam && onPick(match.match_code, match.awayTeam.id)}
        />
      </div>

      {!match.canPredict ? (
        <span className="knockout-simulator-lock">
          <LockKeyhole className="h-3 w-3" />
        </span>
      ) : null}
    </article>
  )
}

function ChampionCard({
  championTeam,
  celebrate = false,
  style,
}: {
  championTeam?: BracketTeam | null
  celebrate?: boolean
  style?: CSSProperties
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
    <div
      className={`knockout-simulator-champion${championTeam ? ' has-champion' : ''}${celebrate ? ' is-celebrating' : ''}`}
      style={style}
    >
      {celebrate && championTeam ? (
        <div className="knockout-confetti-layer" aria-hidden="true">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="knockout-confetti-piece"
              style={{
                left: piece.left,
                width: piece.size,
                height: `calc(${piece.size} * 0.58)`,
                background: piece.color,
                animationDuration: piece.duration,
                animationDelay: piece.delay,
                ['--knockout-rotate' as string]: piece.rotate,
              }}
            />
          ))}
        </div>
      ) : null}

      <span className="knockout-simulator-champion-icon">
        <Crown className="h-4 w-4" />
      </span>
      <div className="knockout-simulator-champion-copy">
        <p>Campeon</p>
        {championTeam ? (
          <div className="knockout-simulator-champion-team">
            <TeamOrb team={championTeam} size="sm" />
            <div>
              <strong>{championTeam.name}</strong>
              <span>{getTeamTokenLabel(championTeam)}</span>
            </div>
          </div>
        ) : (
          <strong>Pendiente</strong>
        )}
      </div>
    </div>
  )
}

function TrophyGifCelebration({
  championTeam,
  show = false,
}: {
  championTeam?: BracketTeam | null
  show?: boolean
}) {
  if (!show || !championTeam) return null

  return (
    <div className="knockout-trophy-gif-overlay" aria-live="polite">
      <div className="knockout-trophy-gif-card">
        <span className="knockout-trophy-gif-kicker">Campeon pronosticado</span>
        <img src="/celebrations/trophy_animation.gif" alt="Celebracion con trofeo" />
        <strong>{championTeam.name}</strong>
        <span>{getTeamTokenLabel(championTeam)}</span>
      </div>
    </div>
  )
}

export default function BracketSimulatorView({
  matches,
  disabled = false,
  onPick,
  championTeam,
  celebrate = false,
}: BracketBoardProps) {
  const groupedMatches = getMatchesByRound(matches)
  const positionedMatches = getPositionedMatches(groupedMatches)
  const connectors = getConnectors(groupedMatches)
  const finalMatch = groupedMatches[ROUNDS.FINAL]?.[0]
  const resolvedCount = matches.filter((match) => Boolean(getWinnerId(match.winnerTeamId))).length

  return (
    <div className="knockout-simulator-shell">
      <TrophyGifCelebration championTeam={championTeam} show={celebrate} />

      <div className="groups-selector-panel knockout-simulator-panel">
        <div className="groups-section-copy">
          <p className="groups-section-kicker">Simulador eliminatorio</p>
          <h2 className="groups-section-title">Elige ganadores en el arbol</h2>
          <p className="groups-section-description">
            La seleccion ahora funciona como un simulador: toca el radio o el equipo ganador y la siguiente llave se alimenta
            de inmediato.
          </p>
        </div>

        <div className="knockout-simulator-summary">
          <span>
            <Trophy className="h-4 w-4" />
            {resolvedCount}/31 llaves
          </span>
          <span>{disabled ? 'Bloqueado' : 'Seleccion activa'}</span>
        </div>
      </div>

      <div className="knockout-simulator-scroll">
        <div className="knockout-simulator-board" style={{ width: BOARD_WIDTH }}>
          <div className="knockout-simulator-headings">
            {COLUMN_HEADINGS.map((heading) => (
              <span
                key={`${heading.col}-${heading.label}`}
                className={heading.featured ? 'is-featured' : ''}
                style={{ gridColumn: `${heading.col + 1}` }}
              >
                {heading.label}
              </span>
            ))}
          </div>

          <div className="knockout-simulator-body" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
            <svg
              className="knockout-simulator-connectors"
              viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {connectors.map((connector) => (
                <path
                  key={connector.key}
                  d={connector.path}
                  className={connector.active ? 'is-active' : ''}
                />
              ))}
            </svg>

            <div className="knockout-simulator-grid">
              {positionedMatches.map((item) => (
                <SimulatorMatchCard
                  key={item.key}
                  disabled={disabled}
                  match={item.match}
                  onPick={onPick}
                  className={item.side === 'right' ? 'is-right-side' : ''}
                  style={{
                    gridColumn: `${item.col + 1}`,
                    gridRow: `${item.row} / span ${item.span}`,
                  }}
                />
              ))}

              {finalMatch ? (
                <SimulatorMatchCard
                  disabled={disabled}
                  match={finalMatch}
                  onPick={onPick}
                  className="is-final"
                  style={{
                    gridColumn: `${FINAL_LAYOUT.col + 1}`,
                    gridRow: `${FINAL_LAYOUT.row} / span ${FINAL_LAYOUT.span}`,
                  }}
                />
              ) : null}

              <ChampionCard
                championTeam={championTeam}
                celebrate={celebrate}
                style={{
                  gridColumn: `${CHAMPION_LAYOUT.col + 1}`,
                  gridRow: `${CHAMPION_LAYOUT.row} / span ${CHAMPION_LAYOUT.span}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
