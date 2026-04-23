function formatMoney(amount) {
  return `$${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(Number(amount || 0))}`
}

export default function AdminPrizesSection({ saving, draft, onChange, onSave }) {
  const totalPrize = Number(draft.group_stage_prize || 0) + Number(draft.knockout_prize || 0)

  return (
    <div className="admin-hub-grid admin-hub-grid-prizes">
      <form className="admin-hub-card" onSubmit={onSave}>
        <div className="admin-hub-card-head">
          <div>
            <p className="admin-hub-eyebrow">Premios</p>
            <h3 className="admin-hub-card-title">Montos visibles del torneo</h3>
          </div>
          <span className="admin-hub-badge">Scoreboard</span>
        </div>
        <p className="admin-hub-card-copy">
          Define cuanto se muestra publicamente para la fase de grupos y eliminatorias.
        </p>

        <div className="admin-prize-grid">
          <label className="admin-hub-field">
            <span>Premio fase de grupos</span>
            <input
              className="field-input"
              type="number"
              min="0"
              step="1"
              value={draft.group_stage_prize}
              onChange={(event) => onChange('group_stage_prize', Number(event.target.value || 0))}
            />
          </label>

          <label className="admin-hub-field">
            <span>Premio eliminatorias</span>
            <input
              className="field-input"
              type="number"
              min="0"
              step="1"
              value={draft.knockout_prize}
              onChange={(event) => onChange('knockout_prize', Number(event.target.value || 0))}
            />
          </label>
        </div>

        <button type="submit" disabled={saving} className="button-primary mt-6 w-full">
          {saving ? 'Guardando...' : 'Guardar premios'}
        </button>
      </form>

      <article className="admin-hub-card admin-prize-preview">
        <div className="admin-hub-card-head">
          <div>
            <p className="admin-hub-eyebrow">Resumen</p>
            <h3 className="admin-hub-card-title">Pozo configurado</h3>
          </div>
          <span className="admin-hub-badge">Listo</span>
        </div>

        <div className="admin-prize-preview-grid">
          <div className="admin-prize-preview-card">
            <span>Fase de grupos</span>
            <strong>{formatMoney(draft.group_stage_prize)}</strong>
          </div>
          <div className="admin-prize-preview-card">
            <span>Eliminatorias</span>
            <strong>{formatMoney(draft.knockout_prize)}</strong>
          </div>
          <div className="admin-prize-preview-card is-total">
            <span>Total visible</span>
            <strong>{formatMoney(totalPrize)}</strong>
          </div>
        </div>

        <p className="admin-hub-footnote">
          Estos montos se reflejan en la pantalla publica de Scoreboard una vez guardados.
        </p>
      </article>
    </div>
  )
}
