import { TEAM_ASSET_MAP } from '../../utils/constants'

export function getTeamTokenLabel(team) {
  if (!team) return '---'
  if (team.code) return team.code.slice(0, 3).toUpperCase()

  return (
    team.name
      ?.split(/\s+/)
      .map((chunk) => chunk[0])
      .join('')
      .slice(0, 3)
      .toUpperCase() ?? '---'
  )
}

export default function TeamOrb({ team, size = 'md', className = '' }) {
  const code = team?.code ? String(team.code).trim().toUpperCase() : ''
  const asset = code ? TEAM_ASSET_MAP[code] : null
  const label = getTeamTokenLabel(team)

  return (
    <span className={`groups-team-orb groups-team-orb-${size}${asset ? ' has-image' : ''}${className ? ` ${className}` : ''}`}>
      {asset ? <img src={asset} alt={team?.name ?? label} draggable="false" /> : <span>{label}</span>}
    </span>
  )
}
