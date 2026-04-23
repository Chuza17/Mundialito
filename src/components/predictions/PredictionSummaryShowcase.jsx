import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Gift, Share2, Shield, Trophy, Users2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import SubpageBackRow from '../common/SubpageBackRow'
import TeamOrb, { getTeamTokenLabel } from '../common/TeamOrb'
import { GROUPS, ROUND_NAMES, ROUNDS } from '../../utils/constants'
import { getMatchesByRound } from '../../utils/bracketLogic'

const ROUND_ORDER = [
  ROUNDS.ROUND_OF_32,
  ROUNDS.ROUND_OF_16,
  ROUNDS.QUARTER_FINALS,
  ROUNDS.SEMI_FINALS,
  ROUNDS.FINAL,
]

const ROUND_TAB_LABELS = {
  [ROUNDS.ROUND_OF_32]: '16avos',
  [ROUNDS.ROUND_OF_16]: 'Octavos',
  [ROUNDS.QUARTER_FINALS]: 'Cuartos',
  [ROUNDS.SEMI_FINALS]: 'Semis',
  [ROUNDS.FINAL]: 'Final',
}

const SECTION_OPTIONS = [
  { id: 'groups', label: 'Fase de grupos' },
  { id: 'thirds', label: 'Mejores terceros' },
  { id: 'knockout', label: 'Eliminatorias' },
]

function SummaryMetric({ icon: Icon, label, value, note }) {
  return (
    <article className="prediction-summary-metric">
      <div className="prediction-summary-metric-icon">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <span className="prediction-summary-metric-label">{label}</span>
        <strong className="prediction-summary-metric-value">{value}</strong>
        <p className="prediction-summary-metric-note">{note}</p>
      </div>
    </article>
  )
}

function FloatingGroupCard({ summary, state }) {
  return (
    <article className={`prediction-floating-card${state ? ` is-${state}` : ''}`}>
      <div className="prediction-floating-card-head">
        <div>
          <span className="prediction-floating-card-kicker">Grupo</span>
          <strong className="prediction-floating-card-title">{summary.group}</strong>
        </div>
        <span className="prediction-floating-card-pill">{summary.rows.length}/4</span>
      </div>

      <div className="prediction-floating-card-teams">
        {summary.topTeams.map((team) => (
          <div key={`${summary.group}-${team.id}`} className="prediction-floating-card-team">
            <TeamOrb team={team} size="sm" />
            <span>{getTeamTokenLabel(team)}</span>
          </div>
        ))}
      </div>

      <p className="prediction-floating-card-copy">{summary.headline}</p>
    </article>
  )
}

function GroupSummaryCard({ summary }) {
  return (
    <article className="prediction-group-card">
      <div className="prediction-group-card-head">
        <div>
          <span className="prediction-group-card-kicker">Grupo</span>
          <h3 className="prediction-group-card-title">{summary.group}</h3>
        </div>

        <div className="prediction-group-card-picks">
          {summary.topTeams.map((team) => (
            <span key={`${summary.group}-${team.id}`} className="prediction-group-card-pick">
              {getTeamTokenLabel(team)}
            </span>
          ))}
        </div>
      </div>

      <div className="prediction-group-card-body">
        {summary.rows.map((row) => (
          <div key={`${summary.group}-${row.team_id}`} className="prediction-group-card-row">
            <div className="prediction-group-card-team">
              <span className="prediction-group-card-position">{row.predicted_position}</span>
              <TeamOrb team={row.team} size="sm" />
              <div className="prediction-group-card-team-copy">
                <strong>{row.team?.name ?? 'Pendiente'}</strong>
                <span>{getTeamTokenLabel(row.team)}</span>
              </div>
            </div>
            <span className="prediction-group-card-points">{row.predicted_points} pts</span>
          </div>
        ))}
      </div>
    </article>
  )
}

function KnockoutMatchSummary({ match }) {
  const winnerId = typeof match.winnerTeamId === 'object' ? match.winnerTeamId?.id : match.winnerTeamId

  return (
    <article className="prediction-knockout-match">
      <div className="prediction-knockout-match-head">
        <span className={`prediction-knockout-match-status${winnerId ? ' is-complete' : ''}`}>
          {winnerId ? 'Elegido' : 'Pendiente'}
        </span>
      </div>

      {[match.homeTeam, match.awayTeam].map((team, index) => {
        const isWinner = winnerId && winnerId === team?.id
        return (
          <div
            key={`${match.match_code}-${index}-${team?.id ?? 'pending'}`}
            className={`prediction-knockout-team${isWinner ? ' is-winner' : ''}${!team ? ' is-placeholder' : ''}`}
          >
            {team ? (
              <>
                <TeamOrb team={team} size="sm" />
                <div className="prediction-knockout-team-copy">
                  <strong>{team.name}</strong>
                  <span>{getTeamTokenLabel(team)}</span>
                </div>
                {isWinner ? <span className="prediction-knockout-winner-dot" /> : null}
              </>
            ) : (
              <>
                <span className="prediction-knockout-team-empty">?</span>
                <div className="prediction-knockout-team-copy">
                  <strong>Por definir</strong>
                  <span>Esperando clasificado</span>
                </div>
              </>
            )}
          </div>
        )
      })}
    </article>
  )
}

export default function PredictionSummaryShowcase({
  backLabel = 'Volver al menu',
  backTo = '/dashboard',
  championTeam,
  displayName,
  mode = 'owner',
  onShareSection,
  secondaryLink = null,
  qualifiedThirdRows = [],
  groupRows = [],
  knockoutMatches = [],
  sharePending = false,
  showBackButton = false,
  username,
}) {
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [activeSection, setActiveSection] = useState('groups')
  const [activeKnockoutRound, setActiveKnockoutRound] = useState(ROUNDS.ROUND_OF_32)
  const [activeGroupsPageIndex, setActiveGroupsPageIndex] = useState(0)
  const [activeKnockoutPageIndex, setActiveKnockoutPageIndex] = useState(0)

  const groupSummaries = useMemo(
    () =>
      GROUPS.map((group) => {
        const rows = groupRows
          .filter((row) => row.group_letter === group)
          .sort((left, right) => left.predicted_position - right.predicted_position)
        const topTeams = rows.slice(0, 3).map((row) => row.team).filter(Boolean)

        return {
          group,
          rows,
          topTeams,
          headline:
            topTeams.length >= 2
              ? `${getTeamTokenLabel(topTeams[0])} y ${getTeamTokenLabel(topTeams[1])} lideran esta proyeccion.`
              : 'Aun faltan selecciones para completar el grupo.',
        }
      }).filter((summary) => summary.rows.length),
    [groupRows]
  )

  useEffect(() => {
    if (!groupSummaries.length) return undefined

    const intervalId = window.setInterval(() => {
      setActiveGroupIndex((current) => (current + 1) % groupSummaries.length)
    }, 6200)

    return () => window.clearInterval(intervalId)
  }, [groupSummaries.length])

  useEffect(() => {
    if (activeGroupIndex > groupSummaries.length - 1) {
      setActiveGroupIndex(0)
    }
  }, [activeGroupIndex, groupSummaries.length])

  const groupedKnockout = useMemo(() => getMatchesByRound(knockoutMatches), [knockoutMatches])
  const groupPages = useMemo(() => {
    const pages = []
    for (let index = 0; index < groupSummaries.length; index += 4) {
      pages.push(groupSummaries.slice(index, index + 4))
    }
    return pages
  }, [groupSummaries])
  const availableKnockoutRounds = useMemo(
    () => ROUND_ORDER.filter((round) => (groupedKnockout[round] ?? []).length),
    [groupedKnockout]
  )
  const activeKnockoutMatches = groupedKnockout[activeKnockoutRound] ?? []
  const activeKnockoutPages = useMemo(() => {
    const pages = []
    for (let index = 0; index < activeKnockoutMatches.length; index += 4) {
      pages.push(activeKnockoutMatches.slice(index, index + 4))
    }
    return pages
  }, [activeKnockoutMatches])
  const completedGroups = groupSummaries.filter((summary) => summary.rows.length === 4).length
  const resolvedKnockout = knockoutMatches.filter((match) => Boolean(match.winnerTeamId)).length
  const floatingIndexes = useMemo(() => {
    if (!groupSummaries.length) return []

    const prev = (activeGroupIndex - 1 + groupSummaries.length) % groupSummaries.length
    const next = (activeGroupIndex + 1) % groupSummaries.length

    return [
      { index: prev, state: 'prev' },
      { index: activeGroupIndex, state: 'active' },
      { index: next, state: 'next' },
    ]
  }, [activeGroupIndex, groupSummaries.length])

  useEffect(() => {
    if (!availableKnockoutRounds.length) return

    if (!availableKnockoutRounds.includes(activeKnockoutRound)) {
      setActiveKnockoutRound(availableKnockoutRounds[0])
    }
  }, [activeKnockoutRound, availableKnockoutRounds])

  useEffect(() => {
    if (activeSection !== 'groups' || groupPages.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      setActiveGroupsPageIndex((current) => (current + 1) % groupPages.length)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [activeSection, groupPages.length])

  useEffect(() => {
    if (!groupPages.length) return

    if (activeGroupsPageIndex > groupPages.length - 1) {
      setActiveGroupsPageIndex(0)
    }
  }, [activeGroupsPageIndex, groupPages.length])

  useEffect(() => {
    setActiveKnockoutPageIndex(0)
  }, [activeKnockoutRound])

  useEffect(() => {
    if (activeSection !== 'knockout' || activeKnockoutPages.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      setActiveKnockoutPageIndex((current) => (current + 1) % activeKnockoutPages.length)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [activeKnockoutPages.length, activeSection])

  useEffect(() => {
    if (!activeKnockoutPages.length) return

    if (activeKnockoutPageIndex > activeKnockoutPages.length - 1) {
      setActiveKnockoutPageIndex(0)
    }
  }, [activeKnockoutPageIndex, activeKnockoutPages.length])

  const sectionMeta = {
    groups: {
      kicker: 'Tus grupos',
      title: 'Fase de grupos',
      copy: 'Se muestran cuatro grupos por vista y el bloque cambia automaticamente para que puedas revisar toda la fase sin alargar la pagina.',
      pill: `${groupPages.length} vistas de grupos`,
    },
    thirds: {
      kicker: 'Mejores terceros',
      title: 'Clasificados extra',
      copy: 'Aqui se concentran los terceros que elegiste para seguir vivos en el torneo, con su grupo y su referencia visual.',
      pill: `${qualifiedThirdRows.length}/8 elegidos`,
    },
    knockout: {
      kicker: 'Camino al titulo',
      title: 'Resumen de eliminatorias',
      copy: 'Se muestran cuatro cruces por vista y el bloque avanza automaticamente para que puedas revisar la ronda sin alargar la pagina.',
      pill: `${resolvedKnockout} elecciones hechas`,
    },
  }

  const currentSection = sectionMeta[activeSection]

  return (
    <section className={`prediction-summary-root${mode === 'public' ? ' is-public' : ''}`}>
      {showBackButton ? <SubpageBackRow label={backLabel} to={backTo} /> : null}

      <article className="prediction-summary-hero">
        <div className="prediction-summary-hero-grid">
          <div className="prediction-summary-hero-copy">
            <div className="prediction-summary-hero-brand">
              <span className="prediction-summary-hero-brand-copy">{mode === 'owner' ? 'Mi Quiniela' : 'Quiniela compartida'}</span>
            </div>

            <div className="prediction-summary-wordmark" aria-hidden="true">
              <span>MI</span>
              <span>QUINIELA</span>
            </div>

            <div className="prediction-summary-hero-content">
              <p className="prediction-summary-hero-kicker">{mode === 'owner' ? 'Resumen personal' : 'Resumen publico'}</p>
              <h1 className="prediction-summary-hero-title">{displayName}</h1>
              <p className="prediction-summary-hero-description">
                Un resumen verde, limpio y visual de todo lo que elegiste: fase de grupos, mejores terceros y eliminatorias.
              </p>

              <div className="prediction-summary-hero-actions">
                {mode === 'owner' ? (
                  <button
                    type="button"
                    onClick={() => onShareSection?.(activeSection, activeKnockoutRound)}
                    disabled={sharePending}
                    className="prediction-summary-action-button is-primary"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>{sharePending ? 'Preparando imagen...' : 'Compartir mi quiniela'}</span>
                  </button>
                ) : null}

                {secondaryLink ? (
                  <Link to={secondaryLink.to} className="prediction-summary-action-button">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>{secondaryLink.label}</span>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="prediction-summary-floating-stage">
            <div className="prediction-summary-floating-backdrop" />
            <div className="prediction-summary-floating-deck">
              {floatingIndexes.map(({ index, state }) => {
                const summary = groupSummaries[index]
                if (!summary) return null
                return <FloatingGroupCard key={`${summary.group}-${state}`} summary={summary} state={state} />
              })}
            </div>
          </div>
        </div>

        <div className="prediction-summary-hero-footer">
          <SummaryMetric
            icon={Trophy}
            label="Grupos listos"
            value={`${completedGroups}/12`}
            note="Todos tus grupos ordenados y con puntos."
          />
          <SummaryMetric
            icon={Gift}
            label="Mejores 3ros"
            value={`${qualifiedThirdRows.length}/8`}
            note="Tus grupos clasificados por via extra."
          />
          <SummaryMetric
            icon={Shield}
            label="Llaves elegidas"
            value={`${resolvedKnockout}/31`}
            note="Ritmo completo hacia la final."
          />
          <SummaryMetric
            icon={Users2}
            label="Usuario"
            value={username ? `@${username}` : 'Sin username'}
            note="Tu resumen visual se puede compartir por secciones."
          />
        </div>
      </article>

      <div className="prediction-summary-layout">
        <div className="prediction-summary-main">
          <div className="prediction-summary-panel">
            <div className="prediction-summary-panel-head">
              <div>
                <p className="prediction-summary-panel-kicker">Explora tu quiniela</p>
                <h2 className="prediction-summary-panel-title">Selecciona la fase que quieras revisar</h2>
                <p className="prediction-summary-panel-copy">
                  Cambia entre grupos, mejores terceros y eliminatorias sin tener que recorrer toda la pagina de una sola vez.
                </p>
              </div>
              <div className="prediction-summary-panel-actions">
                <span className="prediction-summary-panel-pill">{SECTION_OPTIONS.length} vistas disponibles</span>
                {mode === 'owner' ? (
                  <button
                    type="button"
                    onClick={() => onShareSection?.(activeSection, activeKnockoutRound)}
                    disabled={sharePending}
                    className="prediction-summary-action-button prediction-summary-inline-share"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>{sharePending ? 'Preparando...' : 'Compartir mi quiniela'}</span>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="prediction-summary-section-nav">
              {SECTION_OPTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`prediction-summary-section-tab${activeSection === section.id ? ' is-active' : ''}`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            <div className="prediction-summary-panel-head">
              <div>
                <p className="prediction-summary-panel-kicker">{currentSection.kicker}</p>
                <h2 className="prediction-summary-panel-title">{currentSection.title}</h2>
                <p className="prediction-summary-panel-copy">{currentSection.copy}</p>
              </div>
              <span className="prediction-summary-panel-pill">{currentSection.pill}</span>
            </div>

            {activeSection === 'groups' ? (
              <div className="prediction-groups-stage">
                <div className="prediction-group-pages-window">
                  <div
                    className="prediction-group-pages-track"
                    style={{ transform: `translateX(-${activeGroupsPageIndex * 100}%)` }}
                  >
                    {groupPages.map((page, pageIndex) => (
                      <div key={`groups-page-${pageIndex}`} className="prediction-group-page">
                        <div className="prediction-group-grid is-paged">
                          {page.map((summary) => (
                            <GroupSummaryCard key={summary.group} summary={summary} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {groupPages.length > 1 ? (
                  <div className="prediction-group-pages-dots">
                    {groupPages.map((_, pageIndex) => (
                      <button
                        key={`groups-dot-${pageIndex}`}
                        type="button"
                        onClick={() => setActiveGroupsPageIndex(pageIndex)}
                        className={`prediction-group-pages-dot${pageIndex === activeGroupsPageIndex ? ' is-active' : ''}`}
                        aria-label={`Ver bloque ${pageIndex + 1} de grupos`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeSection === 'thirds' ? (
              <div className="prediction-thirds-grid">
                {qualifiedThirdRows.length ? (
                  qualifiedThirdRows.map((row) => (
                    <div key={`third-panel-${row.group_letter}-${row.team_id}`} className="prediction-thirds-item">
                      <span className="prediction-thirds-group">Grupo {row.group_letter}</span>
                      <div className="prediction-thirds-team">
                        <TeamOrb team={row.team} size="sm" />
                        <div>
                          <strong>{row.team?.name ?? 'Pendiente'}</strong>
                          <span>{getTeamTokenLabel(row.team)}</span>
                        </div>
                      </div>
                      <span className="prediction-thirds-note">{row.predicted_points} pts en tu fase de grupos</span>
                    </div>
                  ))
                ) : (
                  <p className="prediction-empty-copy">Todavia no hay mejores terceros seleccionados.</p>
                )}
              </div>
            ) : null}

            {activeSection === 'knockout' ? (
              <div className="prediction-knockout-rounds">
                <div className="prediction-summary-section-nav prediction-summary-round-nav">
                  {availableKnockoutRounds.map((round) => {
                    const matches = groupedKnockout[round] ?? []
                    const completedMatches = matches.filter((match) => match.winnerTeamId).length

                    return (
                      <button
                        key={round}
                        type="button"
                        onClick={() => setActiveKnockoutRound(round)}
                        className={`prediction-summary-section-tab${activeKnockoutRound === round ? ' is-active' : ''}`}
                      >
                        <span>{ROUND_TAB_LABELS[round] ?? ROUND_NAMES[round]}</span>
                        <small>{completedMatches}/{matches.length}</small>
                      </button>
                    )
                  })}
                </div>

                {availableKnockoutRounds.map((round) => {
                  if (round !== activeKnockoutRound) return null

                  const matches = groupedKnockout[round] ?? []
                  if (!matches.length) return null

                  return (
                    <section key={round} className="prediction-knockout-round-section">
                      <div className="prediction-knockout-round-head">
                        <h3>{ROUND_NAMES[round]}</h3>
                        <span>{matches.filter((match) => match.winnerTeamId).length}/{matches.length}</span>
                      </div>

                      <div className="prediction-groups-stage">
                        <div className="prediction-group-pages-window">
                          <div
                            className="prediction-group-pages-track"
                            style={{ transform: `translateX(-${activeKnockoutPageIndex * 100}%)` }}
                          >
                            {activeKnockoutPages.map((page, pageIndex) => (
                              <div key={`knockout-page-${pageIndex}`} className="prediction-group-page">
                                <div className="prediction-knockout-round-grid is-paged">
                                  {page.map((match) => (
                                    <KnockoutMatchSummary key={match.match_code} match={match} />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {activeKnockoutPages.length > 1 ? (
                          <div className="prediction-group-pages-dots">
                            {activeKnockoutPages.map((_, pageIndex) => (
                              <button
                                key={`knockout-dot-${pageIndex}`}
                                type="button"
                                onClick={() => setActiveKnockoutPageIndex(pageIndex)}
                                className={`prediction-group-pages-dot${pageIndex === activeKnockoutPageIndex ? ' is-active' : ''}`}
                                aria-label={`Ver bloque ${pageIndex + 1} de cruces`}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </section>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </section>
  )
}
