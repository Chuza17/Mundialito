import { Crown, Trophy } from 'lucide-react'
import TeamOrb, { getTeamTokenLabel } from '../common/TeamOrb'
import type { BracketTeam } from './bracketTypes'

const CONFETTI_COLORS = ['#7db4ff', '#5bd18b', '#ffe27a', '#ff8f70', '#b28cff', '#ffffff']

type ChampionCardProps = {
  championTeam?: BracketTeam | null
  celebrate?: boolean
}

export default function ChampionCard({ championTeam, celebrate = false }: ChampionCardProps) {
  const confettiPieces = Array.from({ length: 22 }, (_, index) => ({
    id: `${championTeam?.id ?? 'champion'}-${index}`,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    left: `${(index * 13 + 7) % 100}%`,
    delay: `${(index % 5) * 0.12}s`,
    duration: `${2.7 + (index % 4) * 0.3}s`,
    size: `${8 + (index % 4) * 3}px`,
    rotate: `${(index * 31) % 360}deg`,
  }))

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-amber-200/18 bg-[radial-gradient(circle_at_top,rgba(255,226,122,0.18),transparent_40%),linear-gradient(180deg,rgba(19,31,51,0.96),rgba(11,17,29,0.98))] px-5 py-5 text-center shadow-[0_35px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(93,157,255,0.16),transparent_38%)]" />
      {celebrate && championTeam ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden" aria-hidden="true">
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

      <div className="relative flex justify-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/20 bg-amber-300/10 text-amber-100 shadow-[0_0_35px_rgba(255,226,122,0.15)]">
          <Trophy className="h-5 w-5" />
        </span>
      </div>

      <div className="relative mt-4 space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-100/75">Campeon pronosticado</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Centro de la llave</h3>
        </div>

        {championTeam ? (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/[0.04] p-1.5">
              <TeamOrb team={championTeam} size="lg" />
            </div>
            <div className="space-y-1">
              <strong className="block text-xl text-white">{championTeam.name}</strong>
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
                  {getTeamTokenLabel(championTeam)}
                </span>
                <span className="text-[11px] uppercase tracking-[0.22em] text-amber-100/70">Campeon</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-4">
            <p className="text-sm font-medium text-slate-200">Aun no has elegido el campeon.</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">Selecciona la final para completar el arbol</p>
          </div>
        )}
      </div>

      {championTeam ? <Crown className="absolute right-5 top-5 h-5 w-5 text-amber-200/80" /> : null}
    </div>
  )
}
