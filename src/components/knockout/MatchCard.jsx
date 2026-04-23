import TeamSelector from './TeamSelector'

export default function MatchCard({ match, disabled, onPick }) {
  return (
    <article className="glass-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{match.display_name}</p>
          <h3 className="font-display text-lg font-bold text-white">{match.match_code}</h3>
        </div>
        <span className={match.winnerTeamId ? 'pill border-success/30 bg-success/10 text-emerald-100' : 'pill'}>
          {match.winnerTeamId ? 'Predicho' : match.canPredict ? 'Listo' : 'Bloqueado'}
        </span>
      </div>
      <div className="space-y-3">
        <TeamSelector
          team={match.homeTeam}
          selected={match.winnerTeamId === match.homeTeam?.id}
          disabled={disabled || !match.canPredict}
          onClick={() => match.homeTeam && onPick(match.match_code, match.homeTeam.id)}
        />
        <TeamSelector
          team={match.awayTeam}
          selected={match.winnerTeamId === match.awayTeam?.id}
          disabled={disabled || !match.canPredict}
          onClick={() => match.awayTeam && onPick(match.match_code, match.awayTeam.id)}
        />
      </div>
    </article>
  )
}
