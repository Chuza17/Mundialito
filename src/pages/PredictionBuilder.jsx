import { useEffect, useMemo, useState } from 'react'
import { fifaGroups2026 } from '../data/fifaGroups2026'
import { loadPredictions, savePredictions } from '../lib/predictionsStorage'

const DEADLINE = new Date('2026-06-11T00:00:00-06:00')

function createInitialState() {
  return fifaGroups2026.reduce((accumulator, group) => {
    accumulator[group.id] = group.teams.map((team, index) => ({
      ...team,
      position: index + 1,
      points: '',
    }))
    return accumulator
  }, {})
}

function normalizeSavedState(savedValue) {
  const fallback = createInitialState()

  if (!savedValue) {
    return fallback
  }

  return fifaGroups2026.reduce((accumulator, group) => {
    const savedGroup = savedValue[group.id]

    if (!Array.isArray(savedGroup) || savedGroup.length !== group.teams.length) {
      accumulator[group.id] = fallback[group.id]
      return accumulator
    }

    const officialIds = new Set(group.teams.map((team) => team.id))
    const sanitizedGroup = savedGroup.filter((team) => officialIds.has(team.id))

    if (sanitizedGroup.length !== group.teams.length) {
      accumulator[group.id] = fallback[group.id]
      return accumulator
    }

    accumulator[group.id] = sanitizedGroup.map((team, index) => ({
      ...team,
      position: index + 1,
      points: team.points ?? '',
    }))

    return accumulator
  }, {})
}

function formatDeadline(date) {
  return new Intl.DateTimeFormat('es-CR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function PredictionBuilder() {
  const [predictions, setPredictions] = useState(() => {
    return normalizeSavedState(loadPredictions())
  })
  const [openGroupId, setOpenGroupId] = useState(fifaGroups2026[0]?.id ?? 'A')
  const [dragging, setDragging] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [currentTime] = useState(() => new Date())
  const isLocked = currentTime >= DEADLINE

  useEffect(() => {
    savePredictions(predictions)
  }, [predictions])

  const completedGroups = useMemo(
    () =>
      fifaGroups2026.filter((group) =>
        predictions[group.id]?.every(
          (team) => team.points !== '' && Number(team.points) >= 0 && Number(team.points) <= 9
        )
      ).length,
    [predictions]
  )

  const handleDragStart = (groupId, teamIndex) => {
    if (isLocked) {
      return
    }

    setDragging({ groupId, teamIndex })
  }

  const handleDrop = (groupId, targetIndex) => {
    if (!dragging || dragging.groupId !== groupId || dragging.teamIndex === targetIndex || isLocked) {
      return
    }

    setPredictions((current) => {
      const updatedGroup = [...current[groupId]]
      const [movedTeam] = updatedGroup.splice(dragging.teamIndex, 1)
      updatedGroup.splice(targetIndex, 0, movedTeam)

      return {
        ...current,
        [groupId]: updatedGroup.map((team, index) => ({
          ...team,
          position: index + 1,
        })),
      }
    })

    setDragging(null)
  }

  const handlePointsChange = (groupId, teamId, value) => {
    if (isLocked) {
      return
    }

    const sanitized = value === '' ? '' : Math.max(0, Math.min(9, Number(value)))

    setPredictions((current) => ({
      ...current,
      [groupId]: current[groupId].map((team) =>
        team.id === teamId ? { ...team, points: sanitized === '' ? '' : String(sanitized) } : team
      ),
    }))
  }

  const handleSave = () => {
    if (isLocked) {
      setSaveMessage('Las predicciones ya quedaron cerradas por fecha limite.')
      return
    }

    savePredictions(predictions)
    setSaveMessage('Predicciones guardadas en este navegador.')
  }

  return (
    <section className="predictions-layout">
      <article className="panel panel-accent">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Predicciones</span>
            <h3>Grupos oficiales FIFA con quiniela editable</h3>
          </div>
        </div>

        <p className="section-copy">
          Revise cada grupo oficial, abra la zona que quiera trabajar, arrastre las
          selecciones para ordenar su tabla y escriba los puntos esperados de cada una.
        </p>

        <div className="legend-row">
          <span className="legend-pill">🇲🇽 🇦🇷 🇫🇷 Grupos oficiales FIFA</span>
          <span className="legend-pill">12 grupos cerrados para pronosticar</span>
          <span className="legend-pill">Cierre: antes del 11 de junio de 2026</span>
        </div>

        <div className="prediction-summary">
          <article className="prediction-summary-card">
            <span>Estado</span>
            <strong>{isLocked ? 'Predicciones cerradas' : 'Predicciones abiertas'}</strong>
            <p>El envio se bloquea al iniciar el 11 de junio de 2026.</p>
          </article>
          <article className="prediction-summary-card">
            <span>Grupos completos</span>
            <strong>
              {completedGroups}/{fifaGroups2026.length}
            </strong>
            <p>Complete puntos del 0 al 9 en todos los equipos para cerrar cada grupo.</p>
          </article>
          <article className="prediction-summary-card">
            <span>Fecha limite</span>
            <strong>{formatDeadline(DEADLINE)}</strong>
            <p>Use el boton de guardar cuantas veces quiera antes del cierre.</p>
          </article>
        </div>
      </article>

      <div className="prediction-actions">
        <button type="button" onClick={handleSave} disabled={isLocked}>
          Guardar mis predicciones
        </button>
        {saveMessage ? <p className="save-message">{saveMessage}</p> : null}
      </div>

      <div className="prediction-group-list">
        {fifaGroups2026.map((group) => {
          const isOpen = group.id === openGroupId

          return (
            <article key={group.id} className={isOpen ? 'group-card expanded' : 'group-card'}>
              <button
                type="button"
                className="group-toggle"
                onClick={() => setOpenGroupId(isOpen ? '' : group.id)}
              >
                <div className="group-card-header">
                  <span className="group-tag">Grupo {group.id}</span>
                  <strong>{group.title}</strong>
                  <p>{group.highlight}</p>
                </div>
                <span className="group-toggle-indicator">{isOpen ? '−' : '+'}</span>
              </button>

              {isOpen ? (
                <div className="group-card-body">
                  <div className="prediction-instructions">
                    <span>Arrastre de arriba hacia abajo para definir posiciones.</span>
                    <span>Asigne puntos esperados entre 0 y 9.</span>
                  </div>

                  <ul className="team-list prediction-team-list">
                    {predictions[group.id].map((team, teamIndex) => (
                      <li
                        key={team.id}
                        className={
                          dragging?.groupId === group.id && dragging?.teamIndex === teamIndex
                            ? 'team-row prediction-row dragging'
                            : 'team-row prediction-row'
                        }
                        draggable={!isLocked}
                        onDragStart={() => handleDragStart(group.id, teamIndex)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDrop(group.id, teamIndex)}
                        onDragEnd={() => setDragging(null)}
                      >
                        <div className="prediction-position">{teamIndex + 1}</div>

                        <div className="team-main">
                          <span className="team-flags">{team.flag}</span>
                          <div>
                            <strong>{team.name}</strong>
                            <span>{team.note}</span>
                          </div>
                        </div>

                        <label className="points-field">
                          <span>Puntos esperados</span>
                          <input
                            type="number"
                            min="0"
                            max="9"
                            inputMode="numeric"
                            value={team.points}
                            disabled={isLocked}
                            onChange={(event) =>
                              handlePointsChange(group.id, team.id, event.target.value)
                            }
                          />
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default PredictionBuilder
