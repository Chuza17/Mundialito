import { Link, useLocation } from 'react-router-dom'

export default function BottomNav({ items }) {
  const location = useLocation()

  if (location.pathname === '/dashboard' || location.pathname.startsWith('/admin')) {
    return null
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-3 py-2 backdrop-blur lg:hidden">
      <div className="flex gap-2 overflow-x-auto">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={
              location.pathname === item.to
                ? 'rounded-2xl bg-gradient-to-r from-fifa-blue to-fifa-gold px-3 py-2 text-xs font-semibold text-white'
                : 'rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200'
            }
          >
            {item.short ?? item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
