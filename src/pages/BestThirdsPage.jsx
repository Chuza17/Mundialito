import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Circle, ShieldAlert, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import CountdownTimer from '../components/common/CountdownTimer'
import SubpageBackRow from '../components/common/SubpageBackRow'
import TeamOrb, { getTeamTokenLabel } from '../components/common/TeamOrb'
import Toast from '../components/common/Toast'
import { useAppConfig } from '../hooks/useAppConfig'
import { useAuth } from '../hooks/useAuth'
import { useBestThirds } from '../hooks/useBestThirds'
import { useGroupPredictions } from '../hooks/useGroupPredictions'
import { useTeams } from '../hooks/useTeams'
import { GROUPS } from '../utils/constants'
import { validateGroupTable } from '../utils/helpers'

function ThirdCandidateCard({ disabled, isSelected, onToggle, row }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`thirds-candidate-card${isSelected ? ' is-selected' : ''}`}
    >
      <div className="thirds-candidate-card-top">
        <div>
          <span className="thirds-candidate-card-kicker">Grupo</span>
          <strong className="thirds-candidate-card-group">{row.group_letter}</strong>
        </div>
        <span className={`thirds-candidate-card-status${isSelected ? ' is-selected' : ''}`}>
          {isSelected ? 'Clasifica' : 'Disponible'}
        </span>
      </div>

      <div className="thirds-candidate-card-body">
        <TeamOrb team={row.team} size="lg" />
        <div className="thirds-candidate-card-copy">
          <strong>{row.team?.name ?? 'Pendiente'}</strong>
          <span>{getTeamTokenLabel(row.team)}</span>
        </div>
      </div>

      <div className="thirds-candidate-card-footer">
        <span>{row.predicted_points} pts</span>
        <span>{isSelected ? 'Toca para quitar' : 'Toca para incluir'}</span>
      </div>
    </button>
  )
}

function MobileThirdCandidateRow({ disabled, isSelected, onToggle, row }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`thirds-mobile-candidate-row${isSelected ? ' is-selected' : ''}`}
    >
      <div className="thirds-mobile-candidate-main">
        <span className="thirds-mobile-candidate-group">Grupo {row.group_letter}</span>
        <div className="thirds-mobile-candidate-team">
          <TeamOrb team={row.team} />
          <div className="thirds-mobile-candidate-copy">
            <strong>{row.team?.name ?? 'Pendiente'}</strong>
            <span>{getTeamTokenLabel(row.team)}</span>
          </div>
        </div>
      </div>

      <div className="thirds-mobile-candidate-side">
        <strong>{row.predicted_points} pts</strong>
        <span>{isSelected ? 'Quitar' : 'Elegir'}</span>
      </div>
    </button>
  )
}

function SelectedThirdSlot({ disabled, index, onRemove, row }) {
  if (!row) {
    return (
      <article className="thirds-slot-card is-empty">
        <div className="thirds-slot-index">Cupo {index + 1}</div>
        <div className="thirds-slot-empty">
          <Circle className="h-5 w-5" />
          <span>Selecciona un tercero</span>
        </div>
      </article>
    )
  }

  return (
    <article className="thirds-slot-card">
      <div className="thirds-slot-head">
        <span className="thirds-slot-index">Cupo {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="thirds-slot-remove"
          aria-label={`Quitar a ${row.team?.name ?? 'equipo'} de la clasificacion`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="thirds-slot-body">
        <TeamOrb team={row.team} size="lg" />
        <div className="thirds-slot-copy">
          <strong>{row.team?.name ?? 'Pendiente'}</strong>
          <span>{getTeamTokenLabel(row.team)}</span>
        </div>
      </div>

      <div className="thirds-slot-footer">
        <span>Grupo {row.group_letter}</span>
        <span>{row.predicted_points} pts</span>
      </div>
    </article>
  )
}

function BestThirdsOverviewCard({ deadline, label, value, timer = false }) {
  return (
    <div className="dashboard-overview-card thirds-overview-card">
      <span className="dashboard-overview-label">{label}</span>
      {timer ? (
        <div className="dashboard-overview-timer">
          <CountdownTimer deadline={deadline} />
        </div>
      ) : (
        <strong className="dashboard-overview-value">{value}</strong>
      )}
    </div>
  )
}

function BestThirdsActionButtons({
  allGroupsComplete,
  clearSelection,
  handleSave,
  locked,
  selectedCount,
  submitting,
  className = '',
}) {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={clearSelection}
        disabled={locked || !selectedCount || submitting}
        className="button-secondary groups-action-button"
      >
        Limpiar seleccion
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={locked || !allGroupsComplete || selectedCount !== 8 || submitting}
        className="button-primary groups-action-button"
      >
        {submitting ? 'Guardando...' : locked ? 'Predicciones cerradas' : 'Guardar seleccion'}
      </button>
    </div>
  )
}

export default function BestThirdsPage() {
  const { user } = useAuth()
  const { teams, error: teamsError } = useTeams()
  const { config, error: configError } = useAppConfig()
  const groups = useGroupPredictions(user?.id)
  const thirds = useBestThirds(user?.id)
  const [toast, setToast] = useState(null)
  const [selected, setSelected] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const locked = config?.predictions_locked || new Date(config?.deadline).getTime() <= Date.now()
  const loadErrors = [teamsError, configError, groups.error, thirds.error].filter(Boolean)

  useEffect(() => {
    setSelected(thirds.bestThirds.filter((item) => item.qualifies).map((item) => item.group_letter))
  }, [thirds.bestThirds])

  const completedGroups = useMemo(
    () => GROUPS.filter((letter) => validateGroupTable(groups.getGroupPredictions(letter)).valid).length,
    [groups]
  )

  const allGroupsComplete = completedGroups === GROUPS.length

  const thirdPlaceRows = useMemo(() => {
    const teamMap = new Map(teams.map((team) => [team.id, team]))

    return groups.predictions
      .filter((row) => row.predicted_position === 3)
      .map((row) => ({
        ...row,
        team: teamMap.get(row.team_id) ?? null,
      }))
      .sort((left, right) => {
        if (right.predicted_points !== left.predicted_points) {
          return right.predicted_points - left.predicted_points
        }

        return left.group_letter.localeCompare(right.group_letter)
      })
  }, [groups.predictions, teams])

  const rowByGroup = useMemo(
    () => new Map(thirdPlaceRows.map((row) => [row.group_letter, row])),
    [thirdPlaceRows]
  )

  const selectedRows = useMemo(
    () => selected.map((groupLetter) => rowByGroup.get(groupLetter)).filter(Boolean),
    [rowByGroup, selected]
  )

  const slots = useMemo(
    () => Array.from({ length: 8 }, (_, index) => selectedRows[index] ?? null),
    [selectedRows]
  )
  const overviewCards = useMemo(
    () => [
      {
        key: 'selected',
        label: 'Seleccionados',
        value: `${selected.length}/8 elegidos`,
      },
      {
        key: 'groups',
        label: 'Grupos listos',
        value: `${completedGroups}/12 completos`,
      },
      {
        key: 'deadline',
        label: 'Cierre',
        timer: true,
      },
    ],
    [completedGroups, selected.length]
  )

  function toggleGroup(groupLetter) {
    setSelected((current) => {
      if (current.includes(groupLetter)) return current.filter((item) => item !== groupLetter)
      if (current.length >= 8) return current
      return [...current, groupLetter]
    })
  }

  function clearSelection() {
    setSelected([])
  }

  async function handleSave() {
    try {
      setSubmitting(true)

      if (!allGroupsComplete) {
        throw new Error('Completa y guarda los 12 grupos antes de escoger mejores terceros.')
      }

      if (selected.length !== 8) {
        throw new Error('Debes seleccionar exactamente 8 mejores terceros.')
      }

      await thirds.saveBestThirds(selected)
      setToast({ type: 'success', message: 'Mejores terceros guardados.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'No fue posible guardar la seleccion.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="dashboard-services-panel groups-page-panel thirds-page-panel">
      <SubpageBackRow />

      {loadErrors.length ? (
        <div className="dashboard-alert">
          <p className="dashboard-alert-title">Hay datos de mejores terceros que no cargaron bien.</p>
          <p className="dashboard-alert-copy">
            La vista puede seguir usando la informacion disponible mientras revisamos Supabase y las selecciones ya guardadas.
          </p>
        </div>
      ) : null}

      <div className="dashboard-services-head groups-page-head">
        <div className="dashboard-services-copy">
          <p className="dashboard-services-kicker">Mejores terceros</p>
          <h1 className="dashboard-services-title">Define los 8 clasificados</h1>
          <p className="dashboard-services-description">
            Esta pantalla toma automaticamente los terceros puestos de tus grupos y te deja marcar los ocho que avanzan
            con la misma estructura limpia de la fase anterior.
          </p>
        </div>

        <div className="groups-head-side">
          <BestThirdsActionButtons
            allGroupsComplete={allGroupsComplete}
            className="groups-head-actions thirds-head-actions"
            clearSelection={clearSelection}
            handleSave={handleSave}
            locked={locked}
            selectedCount={selected.length}
            submitting={submitting}
          />
        </div>
      </div>

      <div className="dashboard-services-overview groups-overview-grid thirds-overview-grid">
        {overviewCards.map((card) => (
          <BestThirdsOverviewCard
            key={card.key}
            deadline={config?.deadline}
            label={card.label}
            timer={card.timer}
            value={card.value}
          />
        ))}
      </div>

      <div className="thirds-mobile-overview-marquee" aria-label="Resumen de mejores terceros">
        <div className="thirds-mobile-overview-track">
          {[0, 1].map((groupIndex) => (
            <div
              key={`overview-group-${groupIndex}`}
              className="thirds-mobile-overview-group"
              aria-hidden={groupIndex === 1 ? 'true' : undefined}
            >
              {overviewCards.map((card) => (
                <BestThirdsOverviewCard
                  key={`${groupIndex}-${card.key}`}
                  deadline={config?.deadline}
                  label={card.label}
                  timer={card.timer}
                  value={card.value}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {!allGroupsComplete ? (
        <div className="groups-stage-panel thirds-warning-panel">
          <div className="groups-stage-head">
            <div className="groups-section-copy">
              <p className="groups-section-kicker">Antes de continuar</p>
              <h2 className="groups-section-title">Primero cierra la fase de grupos</h2>
              <p className="groups-section-description">
                Necesitamos los 12 grupos completos para saber cuales selecciones terminaron terceras y poder habilitar
                esta etapa.
              </p>
            </div>
            <span className="groups-validation-pill">
              <ShieldAlert className="h-4 w-4" />
              <span>Faltan grupos por guardar</span>
            </span>
          </div>

          <p className="groups-stage-feedback">{`Llevas ${completedGroups}/12 grupos completos. Cuando termines la fase anterior, aqui apareceran los terceros disponibles.`}</p>
          <div className="groups-head-nav">
            <Link to="/groups" className="button-secondary groups-back-button">
              <ArrowLeft className="h-4 w-4" />
              <span>Ir a fase de grupos</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="groups-selector-panel">
            <div className="groups-section-copy">
              <p className="groups-section-kicker">Terceros disponibles</p>
              <h2 className="groups-section-title">Selecciona los que avanzan</h2>
              <p className="groups-section-description">
                Cada tarjeta representa el tercero de un grupo. Marca ocho equipos y veras la clasificacion reflejada
                abajo de inmediato.
              </p>
            </div>

            <div className="thirds-mobile-candidate-list">
              {thirdPlaceRows.map((row) => {
                const isSelected = selected.includes(row.group_letter)

                return (
                  <MobileThirdCandidateRow
                    key={`mobile-third-${row.group_letter}`}
                    row={row}
                    isSelected={isSelected}
                    disabled={locked}
                    onToggle={() => toggleGroup(row.group_letter)}
                  />
                )
              })}
            </div>

            <div className="groups-selector-scroller">
              <div className="groups-selector-track thirds-candidate-track">
                {thirdPlaceRows.map((row) => {
                  const isSelected = selected.includes(row.group_letter)

                  return (
                    <ThirdCandidateCard
                      key={row.group_letter}
                      row={row}
                      isSelected={isSelected}
                      disabled={locked}
                      onToggle={() => toggleGroup(row.group_letter)}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <div className="groups-stage-panel thirds-visual-stage-panel">
            <div className="groups-stage-head">
              <div className="groups-section-copy">
                <p className="groups-section-kicker">Clasificados visuales</p>
                <h2 className="groups-section-title">Tus 8 mejores terceros</h2>
                <p className="groups-section-description">
                  Esta zona te muestra en tiempo real cuantos cupos ya llenaste. Puedes quitar un clasificado desde la
                  misma tarjeta si cambias de opinion.
                </p>
              </div>
              <span className={`groups-validation-pill${selected.length === 8 ? ' is-valid' : ''}`}>
                {selected.length === 8 ? 'Seleccion completa' : `${selected.length}/8 elegidos`}
              </span>
            </div>

            <div className="thirds-slots-grid">
              {slots.map((row, index) => (
                <SelectedThirdSlot
                  key={row?.group_letter ?? `empty-${index}`}
                  row={row}
                  index={index}
                  disabled={locked}
                  onRemove={() => row && toggleGroup(row.group_letter)}
                />
              ))}
            </div>

            <p className={`groups-stage-feedback${selected.length === 8 ? ' is-valid' : ''}`}>
              {selected.length === 8
                ? 'Ya tienes ocho terceros elegidos. Si te convence la lista, puedes guardarla.'
                : 'Selecciona exactamente ocho terceros para habilitar el guardado de esta etapa.'}
            </p>
          </div>

          <div className="groups-summary-panel">
            <div className="groups-summary-head">
              <div className="groups-section-copy">
                <p className="groups-section-kicker">Resumen de terceros</p>
                <h2 className="groups-section-title">Grupo, pais y puntos</h2>
                <p className="groups-section-description">
                  Usa esta tabla como verificacion final. Aqui puedes revisar rapidamente grupo, seleccion, puntaje y si
                  ya la dejaste clasificada.
                </p>
              </div>
            </div>

            <div className="thirds-table-wrap">
              <div className="thirds-table-head-row">
                <span>Grupo</span>
                <span>Pais</span>
                <span>Puntos</span>
                <span>Estado</span>
              </div>

              <div className="thirds-table-body">
                {thirdPlaceRows.map((row) => {
                  const isSelected = selected.includes(row.group_letter)

                  return (
                    <div key={`third-${row.group_letter}`} className="thirds-table-row">
                      <div className="thirds-table-group">
                        <span className="thirds-table-group-letter">{row.group_letter}</span>
                        <span className="thirds-table-group-copy">Grupo</span>
                      </div>

                      <div className="groups-table-team">
                        <TeamOrb team={row.team} />
                        <div className="groups-table-team-copy">
                          <strong>{row.team?.name ?? 'Pendiente'}</strong>
                          <span>{getTeamTokenLabel(row.team)}</span>
                        </div>
                      </div>

                      <div className="thirds-table-points">{row.predicted_points} pts</div>

                      <button
                        type="button"
                        onClick={() => toggleGroup(row.group_letter)}
                        disabled={locked}
                        className={`thirds-table-toggle${isSelected ? ' is-selected' : ''}`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Clasifica</span>
                          </>
                        ) : (
                          <>
                            <Circle className="h-4 w-4" />
                            <span>Elegir</span>
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <BestThirdsActionButtons
            allGroupsComplete={allGroupsComplete}
            className="thirds-mobile-actions"
            clearSelection={clearSelection}
            handleSave={handleSave}
            locked={locked}
            selectedCount={selected.length}
            submitting={submitting}
          />
        </>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  )
}
