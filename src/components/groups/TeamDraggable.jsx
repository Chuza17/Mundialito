import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TeamBadge from '../common/TeamBadge'
import PointsInput from './PointsInput'

export default function TeamDraggable({ row, disabled, onPointsChange }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: row.team_id,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="grid gap-3 rounded-3xl border border-white/10 bg-slate-900/80 p-4 md:grid-cols-[70px,1fr,140px]"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-white"
      >
        {row.predicted_position}°
      </button>
      <TeamBadge team={row.team} />
      <PointsInput value={row.predicted_points} onChange={onPointsChange} disabled={disabled} />
    </div>
  )
}
