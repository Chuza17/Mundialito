export default function LoadingSpinner({ label = 'Cargando...' }) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-fifa-gold" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
