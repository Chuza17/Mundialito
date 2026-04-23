import TeamOrb from '../common/TeamOrb'
import { validateGroupTable } from '../../utils/helpers'

function resolveTeamFromRow(teamsByGroup = {}, row) {
  return (teamsByGroup[row.group_letter] ?? []).find((team) => team.id === row.team_id) ?? row
}

export default function AdminBackupSection({
  teamsLoading,
  teamsError,
  teamsByGroup,
  manualDrafts,
  activeGroup,
  onSelectGroup,
  onFieldChange,
  onSaveLocal,
  onCopyJson,
  onResetGroup,
}) {
  const letters = Object.keys(manualDrafts).filter((letter) => (manualDrafts[letter] ?? []).length)
  const rows = [...(manualDrafts[activeGroup] ?? [])].sort((left, right) => left.predicted_position - right.predicted_position)
  const validation = validateGroupTable(rows)
  const readyCount = letters.filter((letter) => validateGroupTable(manualDrafts[letter]).valid).length

  return (
    <div className="admin-hub-grid admin-hub-grid-backup">
      <article className="admin-hub-card">
        <div className="admin-hub-card-head">
          <div>
            <p className="admin-hub-eyebrow">Modo contingencia</p>
            <h3 className="admin-hub-card-title">Respaldo manual por grupos</h3>
          </div>
          <span className="admin-hub-badge">{readyCount}/12 listos</span>
        </div>
        <p className="admin-hub-card-copy">
          Si la API externa falla, aqui puedes dejar armado el estado de cada grupo con posiciones y puntos. Por ahora se
          guarda localmente en este navegador.
        </p>

        {teamsError ? <p className="admin-hub-error mt-5">{teamsError}</p> : null}
        {teamsLoading ? <p className="admin-hub-empty mt-5">Cargando selecciones base para el respaldo...</p> : null}

        {!teamsLoading && letters.length ? (
          <>
            <div className="admin-backup-groups">
              {letters.map((letter) => {
                const groupValidation = validateGroupTable(manualDrafts[letter] ?? [])

                return (
                  <button
                    key={letter}
                    type="button"
                    className={`admin-backup-group-button${activeGroup === letter ? ' is-active' : ''}`}
                    onClick={() => onSelectGroup(letter)}
                  >
                    <span>Grupo {letter}</span>
                    <small>{groupValidation.valid ? 'Listo' : 'Pendiente'}</small>
                  </button>
                )
              })}
            </div>

            <div className="admin-backup-editor">
              <div className="admin-backup-editor-head">
                <div>
                  <p className="admin-hub-eyebrow">Grupo activo</p>
                  <h4 className="admin-hub-subtitle">Grupo {activeGroup}</h4>
                </div>
                <span className={`admin-backup-validation${validation.valid ? ' is-valid' : ''}`}>{validation.message}</span>
              </div>

              <div className="admin-backup-rows">
                {rows.map((row) => {
                  const team = resolveTeamFromRow(teamsByGroup, row)

                  return (
                    <div key={row.team_id} className="admin-backup-team-row">
                      <div className="admin-backup-team-meta">
                        <TeamOrb team={team} />
                        <div>
                          <strong>{team.name}</strong>
                          <span>{team.code}</span>
                        </div>
                      </div>

                      <label className="admin-backup-mini-field">
                        <span>Puesto</span>
                        <select value={row.predicted_position} onChange={(event) => onFieldChange(row.team_id, 'predicted_position', event.target.value)}>
                          {[1, 2, 3, 4].map((position) => (
                            <option key={position} value={position}>
                              {position}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="admin-backup-mini-field">
                        <span>Puntos</span>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          value={row.predicted_points}
                          onChange={(event) => onFieldChange(row.team_id, 'predicted_points', event.target.value)}
                        />
                      </label>
                    </div>
                  )
                })}
              </div>

              <div className="admin-backup-actions">
                <button type="button" className="button-primary" onClick={onSaveLocal}>
                  Guardar respaldo local
                </button>
                <button type="button" className="button-secondary" onClick={onCopyJson}>
                  Copiar JSON
                </button>
                <button type="button" className="admin-backup-reset" onClick={onResetGroup}>
                  Reiniciar grupo
                </button>
              </div>
            </div>
          </>
        ) : null}
      </article>

      <article className="admin-hub-card">
        <div className="admin-hub-card-head">
          <div>
            <p className="admin-hub-eyebrow">Vista previa</p>
            <h3 className="admin-hub-card-title">Como quedaria el grupo</h3>
          </div>
          <span className="admin-hub-badge">Fallback</span>
        </div>

        {rows.length ? (
          <div className="admin-backup-preview-list">
            {rows.map((row) => {
              const team = resolveTeamFromRow(teamsByGroup, row)

              return (
                <div key={`${row.team_id}-preview`} className="admin-backup-preview-row">
                  <div className="admin-backup-preview-rank">{row.predicted_position}</div>
                  <div className="admin-backup-preview-team">
                    <TeamOrb team={team} size="sm" />
                    <div>
                      <strong>{team.name}</strong>
                      <span>{team.code}</span>
                    </div>
                  </div>
                  <strong className="admin-backup-preview-points">{row.predicted_points} pts</strong>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="admin-hub-empty">Selecciona un grupo para preparar el respaldo.</p>
        )}

        <p className="admin-hub-footnote">
          Cuando conectemos esto a Supabase, esta misma estructura nos sirve como editor de contingencia.
        </p>
      </article>
    </div>
  )
}
