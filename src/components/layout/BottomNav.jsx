import { Link, useLocation } from 'react-router-dom'

export default function BottomNav({ items }) {
  const location = useLocation()

  if (location.pathname === '/dashboard' || location.pathname.startsWith('/admin')) {
    return null
  }

  const itemByRoute = new Map(items.map((item) => [item.to, item]))
  const leftRoutes = ['/dashboard', '/groups', '/best-thirds']
  const rightRoutes = ['/knockout', '/results', '/my-prediction']
  const centerItem = itemByRoute.get('/scoreboard')
  const adminItem = items.find((item) => item.to.startsWith('/admin'))

  function isActiveRoute(to) {
    return location.pathname === to
  }

  const leftItems = leftRoutes.map((route) => itemByRoute.get(route)).filter(Boolean)
  const rightItems = rightRoutes.map((route) => itemByRoute.get(route)).filter(Boolean)

  return (
    <nav className="mobile-dock-nav app-bottom-nav lg:hidden" aria-label="Menu movil principal">
      {adminItem ? (
        <div className="mobile-dock-admin-row">
          <Link
            to={adminItem.to}
            aria-label={adminItem.label}
            className={`mobile-dock-admin-link${isActiveRoute(adminItem.to) ? ' is-active' : ''}`}
          >
            <adminItem.icon className="h-4 w-4" />
            <span>Admin</span>
          </Link>
        </div>
      ) : null}

      <div className="mobile-dock-shell">
        <div className="mobile-dock-side">
          {leftItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={`mobile-dock-link${isActiveRoute(item.to) ? ' is-active' : ''}`}
            >
              <item.icon className="h-4 w-4" />
              <span className="sr-only">{item.label}</span>
            </Link>
          ))}
        </div>

        {centerItem ? (
          <Link
            to={centerItem.to}
            aria-label={centerItem.label}
            className={`mobile-dock-center${isActiveRoute(centerItem.to) ? ' is-active' : ''}`}
          >
            <centerItem.icon className="h-5 w-5" />
            <span className="sr-only">{centerItem.label}</span>
          </Link>
        ) : null}

        <div className="mobile-dock-side">
          {rightItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={`mobile-dock-link${isActiveRoute(item.to) ? ' is-active' : ''}`}
            >
              <item.icon className="h-4 w-4" />
              <span className="sr-only">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
