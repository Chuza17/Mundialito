import { NavLink } from 'react-router-dom'
import { SITE_INFO_LINKS } from '../../content/siteInfoPages'

export default function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer" aria-labelledby="app-footer-title">
      <div className="app-footer-shell">
        <div className="app-footer-signature">
          <span className="app-footer-mark" aria-hidden="true" />
          <div className="app-footer-signature-copy">
            <p id="app-footer-title" className="app-footer-copyright">
              Copyright {year} El Mundialito
            </p>
            <p className="app-footer-creator">Gabriel Campos Mora</p>
          </div>
        </div>

        <nav className="app-footer-nav" aria-label="Navegacion legal del sitio">
          {SITE_INFO_LINKS.map((link) => (
            <NavLink
              key={link.to}
              className={({ isActive }) => (isActive ? 'app-footer-link is-active' : 'app-footer-link')}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </footer>
  )
}
