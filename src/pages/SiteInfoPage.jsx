import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { getSiteInfoPage, SITE_INFO_LINKS } from '../content/siteInfoPages'

export default function SiteInfoPage() {
  const navigate = useNavigate()
  const { slug = '' } = useParams()

  const page = useMemo(() => getSiteInfoPage(slug), [slug])

  function handleGoBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/dashboard')
  }

  return (
    <section className="dashboard-services-panel groups-page-panel site-info-page">
      <div className="subpage-back-row">
        <button type="button" className="button-secondary groups-back-button subpage-back-button" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
      </div>

      <article className="site-info-hero">
        <p className="dashboard-services-kicker">{page.kicker}</p>
        <h1 className="dashboard-services-title">{page.title}</h1>
        <p className="dashboard-services-description">{page.description}</p>

        <nav className="site-info-nav" aria-label="Paginas legales">
          {SITE_INFO_LINKS.map((link) => (
            <NavLink
              key={link.to}
              className={({ isActive }) => (isActive ? 'site-info-nav-link is-active' : 'site-info-nav-link')}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </article>

      <div className="site-info-grid">
        {page.sections.map((section) => (
          <article key={section.title} className="site-info-card">
            <h2 className="groups-section-title">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="site-info-copy">
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className="site-info-list">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
