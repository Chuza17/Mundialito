import { useEffect, useMemo, useRef, useState } from 'react'
import BracketColumn from './BracketColumn'
import BracketConnector from './BracketConnector'
import ChampionCard from './ChampionCard'
import MatchCard from './MatchCard.tsx'
import { getMatchesByRound } from '../../utils/bracketLogic'
import { ROUND_NAMES, ROUNDS } from '../../utils/constants'
import type { BracketBoardProps, BracketMatch } from './bracketTypes'

const BOARD_BODY_HEIGHT = 1080
const GRID_TEMPLATE_COLUMNS = '150px 156px 164px 172px 252px 172px 164px 156px 150px'
const BOARD_WIDTH = 1664

const COLUMN_SPECS = {
  round32: { title: '16avos', subtitle: ROUND_NAMES[ROUNDS.ROUND_OF_32], cardHeight: 118 },
  round16: { title: 'Octavos', subtitle: ROUND_NAMES[ROUNDS.ROUND_OF_16], cardHeight: 122 },
  quarter: { title: 'Cuartos', subtitle: ROUND_NAMES[ROUNDS.QUARTER_FINALS], cardHeight: 128 },
  semi: { title: 'Semis', subtitle: ROUND_NAMES[ROUNDS.SEMI_FINALS], cardHeight: 138 },
  final: { title: 'Final', subtitle: ROUND_NAMES[ROUNDS.FINAL], cardHeight: 158 },
}

type ConnectorPath = {
  active: boolean
  d: string
  id: string
  isFinalPath: boolean
}

type MatchCardMap = Record<string, HTMLDivElement | null>

function countResolved(matches: BracketMatch[]) {
  return matches.filter((match) => Boolean(match.winnerTeamId)).length
}

function createBracketPath(startX: number, startY: number, endX: number, endY: number) {
  const distance = Math.abs(endX - startX)
  const radius = Math.min(16, Math.max(8, distance * 0.12))
  const movingRight = endX > startX
  const midX = startX + (endX - startX) * 0.52
  const horizontalInset = movingRight ? radius : -radius
  const verticalInset = endY > startY ? radius : -radius

  return [
    `M ${startX} ${startY}`,
    `L ${midX - horizontalInset} ${startY}`,
    `Q ${midX} ${startY} ${midX} ${startY + verticalInset}`,
    `L ${midX} ${endY - verticalInset}`,
    `Q ${midX} ${endY} ${midX + horizontalInset} ${endY}`,
    `L ${endX} ${endY}`,
  ].join(' ')
}

function getSlotCenterY(card: HTMLDivElement, slot: 'home' | 'away', boardRect: DOMRect) {
  const row = card.querySelector<HTMLElement>(`[data-team-slot="${slot}"]`)
  if (!row) {
    const rect = card.getBoundingClientRect()
    return rect.top - boardRect.top + rect.height / 2
  }

  const rect = row.getBoundingClientRect()
  return rect.top - boardRect.top + rect.height / 2
}

function buildConnectorPaths(matches: BracketMatch[], cardMap: MatchCardMap, boardRect: DOMRect): ConnectorPath[] {
  return matches.flatMap((match) => {
    const targetCard = cardMap[match.match_code]
    if (!targetCard) return []

    const targetRect = targetCard.getBoundingClientRect()

    return (['home', 'away'] as const).flatMap((slot) => {
      const sourceMatchCode = slot === 'home' ? match.home_source_match : match.away_source_match
      if (!sourceMatchCode) return []

      const sourceCard = cardMap[sourceMatchCode]
      if (!sourceCard) return []

      const sourceRect = sourceCard.getBoundingClientRect()
      const targetSlotY = getSlotCenterY(targetCard, slot, boardRect)
      const sourceY = sourceRect.top - boardRect.top + sourceRect.height / 2
      const goRight = sourceRect.left < targetRect.left
      const startX = goRight ? sourceRect.right - boardRect.left : sourceRect.left - boardRect.left
      const endX = goRight ? targetRect.left - boardRect.left : targetRect.right - boardRect.left
      const hasResolvedSource = Boolean(matches.find((item) => item.match_code === sourceMatchCode)?.winnerTeamId)
      const hasVisibleTargetTeam = Boolean(slot === 'home' ? match.homeTeam : match.awayTeam)

      return [
        {
          id: `${sourceMatchCode}-${match.match_code}-${slot}`,
          d: createBracketPath(startX, sourceY, endX, targetSlotY),
          active: hasResolvedSource || hasVisibleTargetTeam,
          isFinalPath: match.round === ROUNDS.FINAL,
        },
      ]
    })
  })
}

export default function BracketBoard({
  matches,
  disabled = false,
  onPick,
  championTeam,
  celebrate = false,
}: BracketBoardProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<MatchCardMap>({})
  const [connectorPaths, setConnectorPaths] = useState<ConnectorPath[]>([])
  const [boardSize, setBoardSize] = useState({ width: BOARD_WIDTH, height: BOARD_BODY_HEIGHT })

  const grouped = useMemo(() => getMatchesByRound(matches), [matches])

  const leftColumns = useMemo(
    () => [
      {
        key: 'round32-left',
        align: 'left' as const,
        matches: grouped[ROUNDS.ROUND_OF_32].slice(0, 8),
        spec: COLUMN_SPECS.round32,
      },
      {
        key: 'round16-left',
        align: 'left' as const,
        matches: grouped[ROUNDS.ROUND_OF_16].slice(0, 4),
        spec: COLUMN_SPECS.round16,
      },
      {
        key: 'quarter-left',
        align: 'left' as const,
        matches: grouped[ROUNDS.QUARTER_FINALS].slice(0, 2),
        spec: COLUMN_SPECS.quarter,
      },
      {
        key: 'semi-left',
        align: 'left' as const,
        matches: grouped[ROUNDS.SEMI_FINALS].slice(0, 1),
        spec: COLUMN_SPECS.semi,
      },
    ],
    [grouped]
  )

  const rightColumns = useMemo(
    () => [
      {
        key: 'semi-right',
        align: 'right' as const,
        matches: grouped[ROUNDS.SEMI_FINALS].slice(1, 2),
        spec: COLUMN_SPECS.semi,
      },
      {
        key: 'quarter-right',
        align: 'right' as const,
        matches: grouped[ROUNDS.QUARTER_FINALS].slice(2, 4),
        spec: COLUMN_SPECS.quarter,
      },
      {
        key: 'round16-right',
        align: 'right' as const,
        matches: grouped[ROUNDS.ROUND_OF_16].slice(4, 8),
        spec: COLUMN_SPECS.round16,
      },
      {
        key: 'round32-right',
        align: 'right' as const,
        matches: grouped[ROUNDS.ROUND_OF_32].slice(8, 16),
        spec: COLUMN_SPECS.round32,
      },
    ],
    [grouped]
  )

  const finalMatch = grouped[ROUNDS.FINAL][0] ?? null

  const headerColumns = useMemo(
    () => [
      ...leftColumns.map((column) => ({
        key: `${column.key}-header`,
        title: column.spec.title,
        subtitle: column.spec.subtitle,
        countLabel: `${countResolved(column.matches)}/${column.matches.length}`,
        align: column.align,
      })),
      {
        key: 'final-header',
        title: COLUMN_SPECS.final.title,
        subtitle: COLUMN_SPECS.final.subtitle,
        countLabel: finalMatch?.winnerTeamId ? 'Campeon listo' : '1 llave',
        align: 'center' as const,
      },
      ...rightColumns.map((column) => ({
        key: `${column.key}-header`,
        title: column.spec.title,
        subtitle: column.spec.subtitle,
        countLabel: `${countResolved(column.matches)}/${column.matches.length}`,
        align: column.align,
      })),
    ],
    [finalMatch?.winnerTeamId, leftColumns, rightColumns]
  )

  const registerCardRef = (matchCode: string) => (node: HTMLDivElement | null) => {
    cardRefs.current[matchCode] = node
  }

  useEffect(() => {
    if (!bodyRef.current) return undefined

    const measure = () => {
      if (!bodyRef.current) return
      const rect = bodyRef.current.getBoundingClientRect()
      setBoardSize({ width: rect.width, height: rect.height })
      const nextPaths = buildConnectorPaths(matches, cardRefs.current, rect)
      setConnectorPaths(nextPaths)
    }

    const frame = window.requestAnimationFrame(measure)
    const observer = new ResizeObserver(() => {
      measure()
    })

    observer.observe(bodyRef.current)
    window.addEventListener('resize', measure)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [matches, championTeam?.id])

  return (
    <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,20,36,0.98),rgba(10,16,28,0.98))] p-6 shadow-[0_36px_90px_rgba(0,0,0,0.34)]">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-[#ffe27a]">Diagrama eliminatorio</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-white">Un bracket mucho mas claro y facil de seguir</h2>
          <p className="mt-3 text-base leading-7 text-slate-300">
            Cada columna representa una ronda. Las conexiones SVG muestran exactamente que partido alimenta al siguiente y el
            bloque central resalta la final junto con tu campeon pronosticado.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Lectura visual</p>
            <strong className="mt-1 block text-lg text-white">Flujo izquierda - centro - derecha</strong>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Interaccion</p>
            <strong className="mt-1 block text-lg text-white">Selecciona el ganador por llave</strong>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:col-span-2 xl:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Centro</p>
            <strong className="mt-1 block text-lg text-white">{championTeam ? championTeam.name : 'Campeon pendiente'}</strong>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 [scrollbar-color:rgba(125,180,255,0.4)_rgba(15,23,42,0.6)] [scrollbar-width:thin]">
        <div className="min-w-max" style={{ width: `${BOARD_WIDTH}px` }}>
          <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
            {headerColumns.map((header) => (
              <div
                key={header.key}
                className={`rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-sm ${
                  header.align === 'right' ? 'text-right' : header.align === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">{header.subtitle}</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{header.title}</h3>
                <span className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {header.countLabel}
                </span>
              </div>
            ))}
          </div>

          <div
            ref={bodyRef}
            className="relative grid gap-3 rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(125,180,255,0.08),transparent_28%),linear-gradient(180deg,rgba(11,18,30,0.82),rgba(9,14,26,0.9))] p-4"
            style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
          >
            <BracketConnector bodyHeight={boardSize.height} paths={connectorPaths} width={boardSize.width} />

            {leftColumns.map((column) => (
              <BracketColumn
                key={column.key}
                align={column.align}
                bodyHeight={BOARD_BODY_HEIGHT}
                cardHeight={column.spec.cardHeight}
                countLabel={`${countResolved(column.matches)}/${column.matches.length}`}
                disabled={disabled}
                matches={column.matches}
                onPick={onPick}
                registerCardRef={registerCardRef}
                subtitle={column.spec.subtitle}
                title={column.spec.title}
              />
            ))}

            <section className="w-full">
              <div className="mb-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/70">{COLUMN_SPECS.final.subtitle}</p>
                <h3 className="mt-1 text-[2rem] font-semibold text-white">{COLUMN_SPECS.final.title}</h3>
                <span className="mt-3 inline-flex rounded-full border border-amber-200/15 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100">
                  {finalMatch?.winnerTeamId ? 'Campeon definido' : 'Ultimo paso'}
                </span>
              </div>

              <div className="relative" style={{ height: `${BOARD_BODY_HEIGHT}px` }}>
                {finalMatch ? (
                  <div
                    className="absolute inset-x-0"
                    style={{
                      top: `${BOARD_BODY_HEIGHT / 2 - COLUMN_SPECS.final.cardHeight / 2 - 124}px`,
                      height: `${COLUMN_SPECS.final.cardHeight}px`,
                    }}
                  >
                    <MatchCard
                      ref={registerCardRef(finalMatch.match_code)}
                      disabled={disabled}
                      match={finalMatch}
                      onPick={onPick}
                      side="center"
                    />
                  </div>
                ) : null}

                <div className="absolute inset-x-0 top-[54%]">
                  <ChampionCard championTeam={championTeam} celebrate={celebrate} />
                </div>
              </div>
            </section>

            {rightColumns.map((column) => (
              <BracketColumn
                key={column.key}
                align={column.align}
                bodyHeight={BOARD_BODY_HEIGHT}
                cardHeight={column.spec.cardHeight}
                countLabel={`${countResolved(column.matches)}/${column.matches.length}`}
                disabled={disabled}
                matches={column.matches}
                onPick={onPick}
                registerCardRef={registerCardRef}
                subtitle={column.spec.subtitle}
                title={column.spec.title}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Flujo claro</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Las lineas se dibujan directamente desde cada cruce hasta su siguiente llave usando SVG, para que el ojo siga el
            camino sin perderse.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Jerarquia</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Las rondas crecen en presencia visual conforme se acercan al centro. La final y el campeon reciben el foco mas
            fuerte del layout.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Responsive</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            En desktop se lee como bracket horizontal premium y en pantallas mas estrechas conserva claridad con scroll limpio,
            sin aplastar las tarjetas.
          </p>
        </div>
      </div>
    </section>
  )
}
