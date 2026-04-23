export default function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur">
      <div className="glass-panel w-full max-w-xl p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="font-display text-xl font-bold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="button-secondary px-3 py-2 text-sm">
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
