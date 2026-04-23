import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ items }) {
  const location = useLocation()
  return (
    <aside className="glass-panel hidden h-fit p-4 lg:block">
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={
              location.pathname === item.to
                ? 'flex items-center gap-3 rounded-2xl bg-gradient-to-r from-fifa-blue to-fifa-gold px-4 py-3 text-sm font-semibold text-white'
                : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10'
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
