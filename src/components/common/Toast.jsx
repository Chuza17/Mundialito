import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  if (!toast) return null

  const isError = toast.type === 'error'
  const Icon = isError ? AlertTriangle : CheckCircle2
  const title = toast.title ?? (isError ? 'Atencion' : 'Listo')

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div
        className={
          isError
            ? 'rounded-3xl border border-amber-300/50 bg-[linear-gradient(180deg,rgba(255,245,157,0.22),rgba(250,204,21,0.14))] px-4 py-4 text-sm text-amber-50 shadow-[0_24px_60px_rgba(120,53,15,0.28)] backdrop-blur'
            : 'rounded-3xl border border-emerald-300/30 bg-[linear-gradient(180deg,rgba(52,211,153,0.2),rgba(16,185,129,0.12))] px-4 py-4 text-sm text-emerald-50 shadow-[0_24px_60px_rgba(6,78,59,0.25)] backdrop-blur'
        }
      >
        <div className="flex items-start gap-3">
          <span className={isError ? 'mt-0.5 text-amber-200' : 'mt-0.5 text-emerald-200'}>
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className={isError ? 'text-sm font-extrabold uppercase tracking-[0.22em] text-amber-100' : 'text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-100'}>
              {title}
            </p>
            <p className={isError ? 'mt-1 text-sm leading-6 text-amber-50/95' : 'mt-1 text-sm leading-6 text-emerald-50/95'}>
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={isError ? 'rounded-full bg-black/10 p-1 text-amber-100/80 transition hover:bg-black/15 hover:text-white' : 'rounded-full bg-black/10 p-1 text-emerald-100/80 transition hover:bg-black/15 hover:text-white'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
