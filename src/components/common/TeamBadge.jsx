import { TEAM_ASSET_MAP } from '../../utils/constants'

export default function TeamBadge({ team, compact = false }) {
  if (!team) return <span className="text-sm text-slate-400">Pendiente</span>
  const asset = TEAM_ASSET_MAP[team.code]
  return (
    <div className="flex items-center gap-3">
      {asset ? (
        <img
          src={asset}
          alt={team.name}
          className={compact ? 'h-6 w-6 rounded-full object-cover' : 'h-9 w-9 rounded-full object-cover'}
        />
      ) : (
        <span className={compact ? 'text-xl' : 'text-3xl'}>{team.flag_emoji}</span>
      )}
      <div>
        <p className="font-medium text-white">{team.name}</p>
        {!compact ? <p className="text-xs text-slate-400">Grupo {team.group_letter}</p> : null}
      </div>
    </div>
  )
}
