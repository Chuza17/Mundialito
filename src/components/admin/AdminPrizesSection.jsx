import { PRIZE_PLACE_FIELDS, formatPrizeAmount, getPrizePool } from '../../utils/prizes'

export default function AdminPrizesSection({ saving, draft, onChange, onSave }) {
  const totalPrize = getPrizePool(draft)

  return (
    <div className="admin-hub-grid admin-hub-grid-prizes">
      <form className="admin-hub-card" onSubmit={onSave}>
        <div className="admin-hub-card-head">
          <div>
            <p className="admin-hub-eyebrow">Premios</p>
            <h3 className="admin-hub-card-title">Podio de premios</h3>
          </div>
          <span className="admin-hub-badge">Scoreboard</span>
        </div>
        <p className="admin-hub-card-copy">
          Define los montos publicos para primer, segundo y tercer lugar.
        </p>

        <div className="admin-prize-grid">
          {PRIZE_PLACE_FIELDS.map((prize) => (
            <label key={prize.key} className="admin-hub-field">
              <span>{prize.label}</span>
              <input
                className="field-input"
                type="number"
                min="0"
                step="1"
                value={draft[prize.key]}
                onChange={(event) => onChange(prize.key, Number(event.target.value || 0))}
              />
            </label>
          ))}
        </div>

        <button type="submit" disabled={saving} className="button-primary mt-6 w-full">
          {saving ? 'Guardando...' : 'Guardar premios'}
        </button>
      </form>

      <article className="admin-hub-card admin-prize-preview">
        <div className="admin-hub-card-head">
          <div>
            <p className="admin-hub-eyebrow">Resumen</p>
            <h3 className="admin-hub-card-title">Podio configurado</h3>
          </div>
          <span className="admin-hub-badge">Listo</span>
        </div>

        <div className="admin-prize-preview-grid">
          {PRIZE_PLACE_FIELDS.map((prize) => (
            <div key={prize.key} className={`admin-prize-preview-card ${prize.tone}`}>
              <span>{prize.label}</span>
              <strong>{formatPrizeAmount(draft[prize.key])}</strong>
            </div>
          ))}
          <div className="admin-prize-preview-card is-total">
            <span>Total visible</span>
            <strong>{formatPrizeAmount(totalPrize)}</strong>
          </div>
        </div>

        <p className="admin-hub-footnote">
          Estos montos se reflejan en login, dashboard de inicio y scoreboard una vez guardados.
        </p>
      </article>
    </div>
  )
}
