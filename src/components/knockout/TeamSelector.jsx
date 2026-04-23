import TeamBadge from '../common/TeamBadge'

export default function TeamSelector({ team, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled || !team}
      onClick={onClick}
      className={
        selected
          ? 'rounded-3xl border border-success/30 bg-success/10 px-4 py-4 text-left'
          : 'rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-left disabled:opacity-40'
      }
    >
      <TeamBadge team={team} />
    </button>
  )
}
