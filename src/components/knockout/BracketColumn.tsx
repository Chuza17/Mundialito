import type { CSSProperties, RefCallback } from 'react'
import MatchCard from './MatchCard.tsx'
import type { BracketMatch } from './bracketTypes'

type BracketColumnProps = {
  align?: 'left' | 'right'
  bodyHeight: number
  cardHeight: number
  countLabel: string
  matches: BracketMatch[]
  subtitle: string
  title: string
  onPick: (matchCode: string, winnerTeamId: string | number) => void
  disabled?: boolean
  registerCardRef: (matchCode: string) => RefCallback<HTMLDivElement>
}

function getMatchTop(index: number, total: number, bodyHeight: number, cardHeight: number) {
  const center = (bodyHeight / (total * 2)) * (index * 2 + 1)
  return center - cardHeight / 2
}

export default function BracketColumn({
  align = 'left',
  bodyHeight,
  cardHeight,
  countLabel,
  matches,
  subtitle,
  title,
  onPick,
  disabled = false,
  registerCardRef,
}: BracketColumnProps) {
  return (
    <section className="w-full">
      <div className={`mb-4 flex flex-col gap-1 ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">{subtitle}</p>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
          {countLabel}
        </span>
      </div>

      <div className="relative" style={{ height: `${bodyHeight}px` }}>
        {matches.map((match, index) => (
          <div
            key={match.match_code}
            className="absolute inset-x-0"
            style={{ '--match-top': `${getMatchTop(index, matches.length, bodyHeight, cardHeight)}px` } as CSSProperties}
          >
            <div className="absolute inset-x-0 h-full" style={{ top: 'var(--match-top)', height: `${cardHeight}px` }}>
              <MatchCard
                ref={registerCardRef(match.match_code)}
                disabled={disabled}
                match={match}
                onPick={onPick}
                side={align}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
