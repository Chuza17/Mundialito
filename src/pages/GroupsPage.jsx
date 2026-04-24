import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import CountdownTimer from '../components/common/CountdownTimer'
import SubpageBackRow from '../components/common/SubpageBackRow'
import TeamOrb, { getTeamTokenLabel } from '../components/common/TeamOrb'
import Toast from '../components/common/Toast'
import { useAppConfig } from '../hooks/useAppConfig'
import { useAuth } from '../hooks/useAuth'
import { useGroupPredictions } from '../hooks/useGroupPredictions'
import { useTeams } from '../hooks/useTeams'
import { GROUPS } from '../utils/constants'
import { groupTeamsByLetter, validateGroupTable } from '../utils/helpers'

function getPreviewCodes(rows = []) {
  return rows.slice(0, 4).map((row) => getTeamTokenLabel(row.team))
}

function clampPoints(value) {
  return Math.max(0, Math.min(9, value))
}

const MOBILE_GROUPS_MEDIA_QUERY = '(max-width: 768px)'

function buildRows(teamsByGroup, predictionsByGroup) {
  return GROUPS.reduce((accumulator, group) => {
    const baseTeams = teamsByGroup[group] ?? []
    const baseRows = baseTeams.map((team, index) => ({
      team_id: team.id,
      team,
      group_letter: group,
      predicted_position: index + 1,
      predicted_points: Math.max(0, 3 - index),
    }))

    const savedRows = predictionsByGroup[group] ?? []
    if (!savedRows.length) {
      accumulator[group] = baseRows
      return accumulator
    }

    const teamById = new Map(baseTeams.map((team) => [team.id, team]))
    const enrichedRows = savedRows.map((row, index) => ({
      ...row,
      team_id: row.team_id,
      team: teamById.get(row.team_id) ?? row.team ?? null,
      group_letter: row.group_letter ?? group,
      predicted_position: Number(row.predicted_position ?? index + 1),
      predicted_points: clampPoints(Number(row.predicted_points ?? row.points ?? Math.max(0, 3 - index))),
    }))
    const missingRows = baseRows.filter(
      (baseRow) => !enrichedRows.some((savedRow) => savedRow.team_id === baseRow.team_id)
    )

    accumulator[group] = [...enrichedRows, ...missingRows]
      .sort((left, right) => left.predicted_position - right.predicted_position)
      .slice(0, 4)
      .map((row, index) => ({
        ...row,
        predicted_position: index + 1,
      }))

    return accumulator
  }, {})
}

function GroupSelectorCard({ active, complete, group, onSelect, rows }) {
  const previewCodes = getPreviewCodes(rows)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`groups-selector-card${active ? ' is-active' : ''}`}
    >
      <div className="groups-selector-card-head">
        <div>
          <span className="groups-selector-card-kicker">Grupo</span>
          <strong className="groups-selector-card-letter">{group}</strong>
        </div>
        <span className={`groups-selector-card-status${complete ? ' is-complete' : ''}`}>
          {complete ? 'Listo' : 'Pendiente'}
        </span>
      </div>

      <div className="groups-selector-card-codes">
        {previewCodes.map((code) => (
          <span key={`${group}-${code}`} className="groups-selector-card-code">
            {code}
          </span>
        ))}
      </div>
    </button>
  )
}

function stopDragPropagation(event) {
  event.stopPropagation()
}

function SortablePlacementSlot({ disabled, row, mobileLayout, onPointsChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.team_id,
    disabled,
  })

  const dragBindings = mobileLayout && !disabled ? { ...attributes, ...listeners } : {}

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`groups-placement-slot${isDragging ? ' is-dragging' : ''}${mobileLayout && !disabled ? ' is-mobile-sortable' : ''}`}
      {...dragBindings}
    >
      <div className="groups-placement-slot-top">
        <div>
          <span className="groups-placement-slot-kicker">Puesto</span>
          <strong className="groups-placement-slot-rank">{row.predicted_position}</strong>
        </div>

        <div className="groups-placement-slot-tools">
          {mobileLayout ? (
            <>
              <label
                className="groups-placement-inline-points"
                onPointerDown={stopDragPropagation}
                onMouseDown={stopDragPropagation}
                onTouchStart={stopDragPropagation}
              >
                <span>Pts</span>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={row.predicted_points}
                  disabled={disabled}
                  onChange={(event) => onPointsChange(row.team_id, Number(event.target.value))}
                  className="field-input groups-placement-inline-points-input"
                  onPointerDown={stopDragPropagation}
                  onMouseDown={stopDragPropagation}
                  onTouchStart={stopDragPropagation}
                />
              </label>

              <span className="groups-placement-touch-pill" aria-hidden="true">
                <GripVertical className="h-4 w-4" />
                <span>Mover</span>
              </span>
            </>
          ) : (
            <button
              type="button"
              className="groups-placement-handle"
              disabled={disabled}
              aria-label={`Arrastrar ${row.team?.name ?? 'equipo'} a otra posicion`}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="groups-placement-slot-body">
        <TeamOrb team={row.team} size={mobileLayout ? 'md' : 'lg'} />
        <div className="groups-placement-slot-copy">
          <strong>{row.team?.name ?? 'Pendiente'}</strong>
          <span>{getTeamTokenLabel(row.team)}</span>
        </div>
      </div>

      <div className="groups-placement-slot-footer">
        {mobileLayout ? (
          <span className="groups-placement-slot-note">Arrastra desde cualquier parte de la tarjeta para subir o bajar el equipo.</span>
        ) : (
          <>
            <span className="groups-placement-slot-points">{row.predicted_points} pts</span>
            <span className="groups-placement-slot-note">Arrastra para cambiar el orden</span>
          </>
        )}
      </div>
    </article>
  )
}

function DragTokenPreview({ row }) {
  if (!row?.team) return null

  return (
    <div className="groups-drag-preview">
      <TeamOrb team={row.team} size="lg" />
      <div className="groups-drag-preview-copy">
        <strong>{row.team.name}</strong>
        <span>{getTeamTokenLabel(row.team)}</span>
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_GROUPS_MEDIA_QUERY).matches : false
  )
  const { user } = useAuth()
  const { teams, error: teamsError } = useTeams()
  const { config, error: configError } = useAppConfig()
  const { predictions, loading, saving, error: predictionsError, saveGroupPredictions } = useGroupPredictions(user?.id)

  const [drafts, setDrafts] = useState({})
  const [selectedGroup, setSelectedGroup] = useState('')
  const [activeTeamId, setActiveTeamId] = useState(null)
  const [toast, setToast] = useState(null)
  const [submittingTarget, setSubmittingTarget] = useState('')
  const stagePanelRef = useRef(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: isMobileLayout ? 6 : 8,
      },
    })
  )

  const teamsByGroup = useMemo(() => groupTeamsByLetter(teams), [teams])
  const predictionsByGroup = useMemo(
    () =>
      predictions.reduce((accumulator, row) => {
        accumulator[row.group_letter] = [...(accumulator[row.group_letter] ?? []), row]
        return accumulator
      }, {}),
    [predictions]
  )

  useEffect(() => {
    setDrafts(buildRows(teamsByGroup, predictionsByGroup))
  }, [predictionsByGroup, teamsByGroup])

  const firstPendingGroup = useMemo(
    () => GROUPS.find((group) => !validateGroupTable(drafts[group] ?? []).valid) ?? GROUPS[0],
    [drafts]
  )

  useEffect(() => {
    setSelectedGroup((current) => (current && GROUPS.includes(current) ? current : firstPendingGroup))
  }, [firstPendingGroup])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia(MOBILE_GROUPS_MEDIA_QUERY)
    const syncLayout = () => setIsMobileLayout(mediaQuery.matches)
    syncLayout()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncLayout)
      return () => mediaQuery.removeEventListener('change', syncLayout)
    }

    mediaQuery.addListener(syncLayout)
    return () => mediaQuery.removeListener(syncLayout)
  }, [])

  const locked = config?.predictions_locked || new Date(config?.deadline).getTime() <= Date.now()
  const loadErrors = [teamsError, configError, predictionsError].filter(Boolean)
  const completedGroups = useMemo(
    () => GROUPS.filter((group) => validateGroupTable(drafts[group] ?? []).valid).length,
    [drafts]
  )
  const activeRows = drafts[selectedGroup] ?? []
  const activeValidation = validateGroupTable(activeRows)
  const draggedRow = activeRows.find((row) => row.team_id === activeTeamId)
  const selectedGroupComplete = validateGroupTable(drafts[selectedGroup] ?? []).valid
  const selectedGroupPreviewCodes = getPreviewCodes(activeRows)
  const sortingStrategy = isMobileLayout ? verticalListSortingStrategy : rectSortingStrategy

  function updateGroupRows(group, rows) {
    setDrafts((current) => ({
      ...current,
      [group]: rows.map((row, index) => ({
        ...row,
        predicted_position: index + 1,
      })),
    }))
  }

  function focusStagePanel() {
    if (!isMobileLayout) return

    requestAnimationFrame(() => {
      stagePanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  function handleGroupSelection(group, options = {}) {
    setSelectedGroup(group)

    if (options.scrollToStage) {
      focusStagePanel()
    }
  }

  function handleDragStart(event) {
    setActiveTeamId(event.active.id)
  }

  function handleDragEnd(event) {
    setActiveTeamId(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const rows = drafts[selectedGroup] ?? []
    const oldIndex = rows.findIndex((row) => row.team_id === active.id)
    const newIndex = rows.findIndex((row) => row.team_id === over.id)

    if (oldIndex < 0 || newIndex < 0) return

    updateGroupRows(selectedGroup, arrayMove(rows, oldIndex, newIndex))
  }

  function handleDragCancel() {
    setActiveTeamId(null)
  }

  function handlePointsChange(teamId, value) {
    const safeValue = clampPoints(Number.isNaN(value) ? 0 : value)

    updateGroupRows(
      selectedGroup,
      activeRows.map((row) =>
        row.team_id === teamId
          ? {
              ...row,
              predicted_points: safeValue,
            }
          : row
      )
    )
  }

  async function handleSaveSelectedGroup() {
    if (!selectedGroup) return

    try {
      setSubmittingTarget('group')

      const validation = validateGroupTable(drafts[selectedGroup] ?? [])
      if (!validation.valid) {
        throw new Error(`Grupo ${selectedGroup}: ${validation.message}`)
      }

      await saveGroupPredictions(selectedGroup, drafts[selectedGroup] ?? [])
      setToast({ type: 'success', message: `Grupo ${selectedGroup} guardado en Supabase.` })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'No se pudo guardar el grupo seleccionado.' })
    } finally {
      setSubmittingTarget('')
    }
  }

  async function handleSaveAll() {
    try {
      setSubmittingTarget('all')

      for (const group of GROUPS) {
        const validation = validateGroupTable(drafts[group] ?? [])
        if (!validation.valid) {
          throw new Error(`Grupo ${group}: ${validation.message}`)
        }
      }

      for (const group of GROUPS) {
        await saveGroupPredictions(group, drafts[group] ?? [])
      }

      setToast({ type: 'success', message: 'Predicciones de grupos guardadas en Supabase.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'No se pudo guardar la fase de grupos.' })
    } finally {
      setSubmittingTarget('')
    }
  }

  return (
    <section className="dashboard-services-panel groups-page-panel">
      <SubpageBackRow />

      {loadErrors.length ? (
        <div className="dashboard-alert">
          <p className="dashboard-alert-title">Hay datos de grupos que no cargaron bien.</p>
          <p className="dashboard-alert-copy">
            La interfaz usa respaldo local mientras revisamos Supabase y las predicciones guardadas del usuario.
          </p>
        </div>
      ) : null}

      <div className="dashboard-services-head groups-page-head">
        <div className="dashboard-services-copy">
          <p className="dashboard-services-kicker">Fase de grupos</p>
          <h1 className="dashboard-services-title">Ordena tus grupos</h1>
          <p className="dashboard-services-description">
            Usa el mismo ritmo visual del dashboard para elegir un grupo, mover las selecciones a su puesto final y
            ajustar los puntos con una lectura clara en cada pantalla.
          </p>
        </div>

        <div className="groups-head-side">
          <div className="groups-head-actions">
            <button
              type="button"
              onClick={handleSaveSelectedGroup}
              disabled={locked || loading || saving || submittingTarget === 'all' || !selectedGroup}
              className="button-secondary groups-action-button"
            >
              {submittingTarget === 'group' || saving
                ? 'Guardando grupo...'
                : locked
                  ? 'Edicion bloqueada'
                  : `Guardar grupo ${selectedGroup || ''}`.trim()}
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={locked || loading || saving || Boolean(submittingTarget)}
              className="button-primary groups-action-button"
            >
              {submittingTarget === 'all' || saving ? 'Guardando todos...' : locked ? 'Predicciones cerradas' : 'Guardar todos'}
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-services-overview groups-overview-grid">
        <div className="dashboard-overview-card">
          <span className="dashboard-overview-label">Grupo activo</span>
          <strong className="dashboard-overview-value">{selectedGroup ? `Grupo ${selectedGroup}` : 'Cargando'}</strong>
        </div>
        <div className="dashboard-overview-card">
          <span className="dashboard-overview-label">Completos</span>
          <strong className="dashboard-overview-value">{completedGroups}/12 listos</strong>
        </div>
        <div className="dashboard-overview-card">
          <span className="dashboard-overview-label">Cierre</span>
          <div className="dashboard-overview-timer">
            <CountdownTimer deadline={config?.deadline} />
          </div>
        </div>
      </div>

      <div className="groups-selector-panel">
        <div className="groups-section-copy">
          <p className="groups-section-kicker">Todos los grupos</p>
          <h2 className="groups-section-title">Selecciona el que quieras ordenar</h2>
          <p className="groups-section-description">
            Cada cuadro resume el estado del grupo y te deja saltar al instante al siguiente bloque.
          </p>
        </div>

        <div className="groups-mobile-selector">
          <label className="groups-mobile-select-shell">
            <span className="groups-mobile-select-label">Abrir grupo</span>
            <div className="groups-mobile-select-wrap">
              <select
                value={selectedGroup || firstPendingGroup}
                onChange={(event) => handleGroupSelection(event.target.value, { scrollToStage: true })}
                className="groups-mobile-select"
              >
                {GROUPS.map((group) => {
                  const complete = validateGroupTable(drafts[group] ?? []).valid

                  return (
                    <option key={group} value={group}>
                      {`Grupo ${group} - ${complete ? 'Listo' : 'Pendiente'}`}
                    </option>
                  )
                })}
              </select>
            </div>
          </label>

          <div className="groups-mobile-selector-meta">
            <span className={`groups-selector-card-status${selectedGroupComplete ? ' is-complete' : ''}`}>
              {selectedGroupComplete ? 'Grupo listo' : 'Pendiente'}
            </span>

            <div className="groups-mobile-selector-preview">
              {selectedGroupPreviewCodes.map((code) => (
                <span key={`mobile-${selectedGroup}-${code}`} className="groups-selector-card-code">
                  {code}
                </span>
              ))}
            </div>
          </div>

          <p className="groups-mobile-selector-note">Elige un grupo y te llevamos directo al editor para arrastrar y ajustar puntos.</p>
        </div>

        <div className="groups-selector-scroller">
          <div className="groups-selector-track">
            {GROUPS.map((group) => (
              <GroupSelectorCard
                key={group}
                group={group}
                rows={drafts[group] ?? []}
                active={selectedGroup === group}
                complete={validateGroupTable(drafts[group] ?? []).valid}
                onSelect={() => handleGroupSelection(group)}
              />
            ))}
          </div>
        </div>
      </div>

      <div ref={stagePanelRef} className="groups-stage-panel">
        <div className="groups-stage-head">
          <div className="groups-section-copy">
            <p className="groups-section-kicker">Ranking visual</p>
            <h2 className="groups-section-title">Grupo {selectedGroup || '--'}</h2>
            <p className="groups-section-description">
              {isMobileLayout
                ? 'Arrastra cada tarjeta desde donde te quede mas comodo y ajusta sus puntos ahi mismo.'
                : 'Arrastra cada seleccion al puesto donde crees que terminara. El orden del ranking se refleja abajo en la tabla de puntos.'}
            </p>
          </div>
          <span className={`groups-validation-pill${activeValidation.valid ? ' is-valid' : ''}`}>
            {activeValidation.valid ? 'Grupo listo' : 'Ajusta el orden o los puntos'}
          </span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={activeRows.map((row) => row.team_id)} strategy={sortingStrategy}>
            <div className="groups-placement-grid">
              {activeRows.map((row) => (
                <SortablePlacementSlot
                  key={row.team_id}
                  row={row}
                  disabled={locked}
                  mobileLayout={isMobileLayout}
                  onPointsChange={handlePointsChange}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>{draggedRow ? <DragTokenPreview row={draggedRow} /> : null}</DragOverlay>
        </DndContext>

        <p className={`groups-stage-feedback${activeValidation.valid ? ' is-valid' : ''}`}>{activeValidation.message}</p>
      </div>

      <div className="groups-summary-panel">
        <div className="groups-summary-head">
          <div className="groups-section-copy">
            <p className="groups-section-kicker">Tabla del grupo</p>
            <h2 className="groups-section-title">Pais y puntos</h2>
            <p className="groups-section-description">
              Completa los puntos al lado de cada pais. La validacion exige que el 1° no tenga menos puntos que el 2°,
              y asi sucesivamente.
            </p>
          </div>
        </div>

        <div className="groups-table-wrap">
          <div className="groups-table-head-row">
            <span>Posicion</span>
            <span>Pais</span>
            <span>Puntos</span>
          </div>

          <div className="groups-table-body">
            {activeRows.map((row) => (
              <div key={`summary-${row.team_id}`} className="groups-table-row">
                <div className="groups-table-position">
                  <span className="groups-table-position-number">{row.predicted_position}</span>
                  <span className="groups-table-position-copy">Puesto</span>
                </div>

                <div className="groups-table-team">
                  <TeamOrb team={row.team} />
                  <div className="groups-table-team-copy">
                    <strong>{row.team?.name ?? 'Pendiente'}</strong>
                    <span>{getTeamTokenLabel(row.team)}</span>
                  </div>
                </div>

                <label className="groups-points-field">
                  <span className="sr-only">{`Puntos de ${row.team?.name ?? 'equipo'}`}</span>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={row.predicted_points}
                    disabled={locked}
                    onChange={(event) => handlePointsChange(row.team_id, Number(event.target.value))}
                    className="field-input groups-points-input"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  )
}
