import { formatCountdown, formatDate } from '../../utils/helpers'

export default function AdminSettingsSection({ saving, draft, onChange, onSave }) {
  const deadlineLabel = draft.deadline ? formatDate(draft.deadline) : 'Sin fecha definida'
  const deadlineCountdown = draft.deadline ? formatCountdown(draft.deadline) : 'Configura un cierre'

  return (
    <div className="admin-hub-grid admin-hub-grid-settings">
      <form className="admin-hub-card" onSubmit={onSave}>
        <div className="admin-hub-card-head">
          <div>
            <p className="admin-hub-eyebrow">Operacion</p>
            <h3 className="admin-hub-card-title">Configuracion global</h3>
          </div>
          <span className="admin-hub-badge">{draft.predictions_locked ? 'Bloqueado' : 'Abierto'}</span>
        </div>
        <p className="admin-hub-card-copy">
          Controla el cierre general y el bloqueo de predicciones para toda la web.
        </p>

        <label className="admin-hub-field">
          <span>Fecha y hora de cierre</span>
          <input
            className="field-input"
            type="datetime-local"
            value={draft.deadline ? new Date(draft.deadline).toISOString().slice(0, 16) : ''}
            onChange={(event) => onChange('deadline', event.target.value ? new Date(event.target.value).toISOString() : '')}
          />
        </label>

        <label className="admin-hub-switch">
          <input
            type="checkbox"
            checked={draft.predictions_locked}
            onChange={(event) => onChange('predictions_locked', event.target.checked)}
          />
          <span>
            <strong>Bloquear edicion de predicciones</strong>
            <small>Ideal para congelar cambios cuando ya cerro el torneo o una fase.</small>
          </span>
        </label>

        <button type="submit" disabled={saving} className="button-primary mt-6 w-full">
          {saving ? 'Guardando...' : 'Guardar configuracion'}
        </button>
      </form>

      <article className="admin-hub-card">
        <div className="admin-hub-card-head">
          <div>
            <p className="admin-hub-eyebrow">Estado</p>
            <h3 className="admin-hub-card-title">Lectura rapida</h3>
          </div>
          <span className="admin-hub-badge">Global</span>
        </div>

        <div className="admin-settings-grid">
          <div className="admin-settings-card">
            <span>Cierre</span>
            <strong>{deadlineCountdown}</strong>
            <small>{deadlineLabel}</small>
          </div>
          <div className="admin-settings-card">
            <span>Predicciones</span>
            <strong>{draft.predictions_locked ? 'Bloqueadas' : 'Abiertas'}</strong>
            <small>{draft.predictions_locked ? 'No se pueden editar.' : 'Los usuarios todavia pueden ajustar.'}</small>
          </div>
        </div>

        <p className="admin-hub-footnote">
          Este bloque te ayuda a validar rapido que la web y el panel publico esten leyendo el mismo estado.
        </p>
      </article>
    </div>
  )
}
