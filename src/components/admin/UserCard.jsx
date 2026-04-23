export default function UserCard({ user, onReset, onDelete }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.32)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{user.display_name}</p>
          <p className="text-sm text-slate-400">@{user.username}</p>
          <p className="mt-1 text-sm text-slate-500">{user.email || 'Email pendiente en perfil'}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] ${
            user.is_active ? 'bg-emerald-500/10 text-emerald-200' : 'bg-white/5 text-slate-400'
          }`}
        >
          {user.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.3em] text-fifa-gold">{user.role}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onReset(user)} className="button-secondary text-sm">
          Resetear pwd
        </button>
        <button type="button" onClick={() => onDelete(user)} className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-red-100">
          Eliminar cuenta
        </button>
      </div>
    </article>
  )
}
