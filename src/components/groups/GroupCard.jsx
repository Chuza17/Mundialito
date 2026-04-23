import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TeamRow from './TeamRow'

export default function GroupCard({ group, rows, validation, disabled, onSave }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = rows.findIndex((row) => row.team_id === active.id)
    const newIndex = rows.findIndex((row) => row.team_id === over.id)
    onSave(
      arrayMove(rows, oldIndex, newIndex).map((row, index) => ({
        ...row,
        predicted_position: index + 1,
      }))
    )
  }

  return (
    <article className="glass-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Grupo {group}</p>
          <h3 className="font-display text-xl font-bold text-white">Predicción del grupo</h3>
        </div>
        <span className={validation.valid ? 'pill border-success/30 bg-success/10 text-emerald-100' : 'pill'}>
          {validation.valid ? 'Completo' : 'Pendiente'}
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rows.map((row) => row.team_id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {rows.map((row) => (
              <TeamRow
                key={row.team_id}
                row={row}
                disabled={disabled}
                onPointsChange={(value) =>
                  onSave(
                    rows.map((current) =>
                      current.team_id === row.team_id ? { ...current, predicted_points: value } : current
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="mt-4 text-sm text-slate-300">{validation.message}</p>
    </article>
  )
}
