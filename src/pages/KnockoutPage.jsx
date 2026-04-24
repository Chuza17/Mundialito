import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Sparkles, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import CountdownTimer from '../components/common/CountdownTimer'
import SubpageBackRow from '../components/common/SubpageBackRow'
import TeamOrb from '../components/common/TeamOrb'
import Toast from '../components/common/Toast'
import BracketView from '../components/knockout/BracketView'
import { useAppConfig } from '../hooks/useAppConfig'
import { useAuth } from '../hooks/useAuth'
import { useBestThirds } from '../hooks/useBestThirds'
import { useGroupPredictions } from '../hooks/useGroupPredictions'
import { useKnockoutMatches } from '../hooks/useKnockoutMatches'
import { useKnockoutPredictions } from '../hooks/useKnockoutPredictions'
import { useTeams } from '../hooks/useTeams'
import { assignBestThirdTeams, isBestThirdSource, resolveBracket } from '../utils/bracketLogic'
import { FALLBACK_TEAMS, GROUPS, ROUNDS } from '../utils/constants'
import { groupTeamsByLetter, validateGroupTable } from '../utils/helpers'

const ROUND_LABELS = {
  [ROUNDS.ROUND_OF_32]: '16avos',
  [ROUNDS.ROUND_OF_16]: 'Octavos',
  [ROUNDS.QUARTER_FINALS]: 'Cuartos',
  [ROUNDS.SEMI_FINALS]: 'Semis',
  [ROUNDS.FINAL]: 'Final',
}

function hasCompleteTeamPool(teams = []) {
  const grouped = groupTeamsByLetter(teams)
  return GROUPS.every((group) => (grouped[group] ?? []).length >= 4)
}

function buildPreviewGroupPredictions(teams = []) {
  const grouped = groupTeamsByLetter(teams)

  return GROUPS.flatMap((group, groupIndex) => {
    const groupTeams = (grouped[group] ?? []).slice(0, 4)
    const thirdPoints = 6 - (groupIndex % 3)
    const secondPoints = Math.min(8, thirdPoints + 2)
    const firstPoints = Math.min(9, secondPoints + 2)
    const fourthPoints = Math.max(0, thirdPoints - 3)
    const pointsMap = [firstPoints, secondPoints, thirdPoints, fourthPoints]

    return groupTeams.map((team, index) => ({
      team_id: team.id,
      group_letter: group,
      predicted_position: index + 1,
      predicted_points: pointsMap[index] ?? 0,
    }))
  })
}

function buildPreviewThirdCandidates(groupPredictions = [], teams = []) {
  const teamMap = new Map(teams.map((team) => [team.id, team]))

  return groupPredictions
    .filter((row) => row.predicted_position === 3)
    .map((row) => ({
      ...row,
      team: teamMap.get(row.team_id) ?? null,
    }))
    .sort((left, right) => {
      if (right.predicted_points !== left.predicted_points) {
        return right.predicted_points - left.predicted_points
      }

      return left.group_letter.localeCompare(right.group_letter)
    })
}

function shuffleRows(rows = [], seed = 0) {
  let currentSeed = seed || 1
  const cloned = [...rows]

  function nextRandom() {
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296
    return currentSeed / 4294967296
  }

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1))
    const temp = cloned[index]
    cloned[index] = cloned[swapIndex]
    cloned[swapIndex] = temp
  }

  return cloned
}

function buildPreviewThirdRowsForGroups(groupLetters = [], actualGroupPredictions = [], previewGroupPredictions = [], teams = []) {
  const actualCandidates = buildPreviewThirdCandidates(actualGroupPredictions, teams)
  const previewCandidates = buildPreviewThirdCandidates(previewGroupPredictions, teams)
  const actualByGroup = new Map(actualCandidates.map((row) => [row.group_letter, row]))
  const previewByGroup = new Map(previewCandidates.map((row) => [row.group_letter, row]))

  return groupLetters
    .map((groupLetter) => {
      const actualRow = actualByGroup.get(groupLetter)
      if (actualRow?.team) return actualRow

      return previewByGroup.get(groupLetter) ?? null
    })
    .filter(Boolean)
}

function buildRandomBestThirdAssignment(matchDefinitions = [], selectedRows = [], shuffleSeed = 0) {
  const slots = matchDefinitions.flatMap((match) => {
    const items = []

    if (isBestThirdSource(match.home_source_type, match.home_source_group, match.home_source_position)) {
      items.push(`${match.match_code}:home`)
    }

    if (isBestThirdSource(match.away_source_type, match.away_source_group, match.away_source_position)) {
      items.push(`${match.match_code}:away`)
    }

    return items
  })

  const shuffledRows = shuffleRows(selectedRows, shuffleSeed)

  return slots.reduce((accumulator, slotKey, index) => {
    const row = shuffledRows[index]
    if (row?.team) {
      accumulator[slotKey] = row.team
    }
    return accumulator
  }, {})
}

function buildPreviewBestThirds(matchDefinitions = [], groupPredictions = [], teams = []) {
  const candidates = buildPreviewThirdCandidates(groupPredictions, teams)
  let selectedGroups = null

  function search(start, chosen) {
    if (selectedGroups) return

    if (chosen.length === 8) {
      const assignment = assignBestThirdTeams(matchDefinitions, chosen)
      if (Object.keys(assignment).length === 8) {
        selectedGroups = chosen.map((row) => row.group_letter)
      }
      return
    }

    const remainingNeeded = 8 - chosen.length
    for (let index = start; index <= candidates.length - remainingNeeded; index += 1) {
      chosen.push(candidates[index])
      search(index + 1, chosen)
      chosen.pop()

      if (selectedGroups) return
    }
  }

  search(0, [])

  return (selectedGroups ?? candidates.slice(0, 8).map((row) => row.group_letter)).map((groupLetter) => ({
    group_letter: groupLetter,
    qualifies: true,
  }))
}

function KnockoutOverviewCard({ championTeam, deadline, label, type = 'value', value }) {
  return (
    <div className="dashboard-overview-card knockout-overview-card">
      <span className="dashboard-overview-label">{label}</span>
      {type === 'timer' ? (
        <div className="dashboard-overview-timer">
          <CountdownTimer deadline={deadline} />
        </div>
      ) : type === 'champion' ? (
        <div className="knockout-overview-champion">
          {championTeam ? (
            <>
              <TeamOrb team={championTeam} />
              <strong>{championTeam.name}</strong>
            </>
          ) : (
            <strong>Pendiente</strong>
          )}
        </div>
      ) : (
        <strong className="dashboard-overview-value">{value}</strong>
      )}
    </div>
  )
}

function KnockoutRoundProgressCard({ kicker, total, value }) {
  return (
    <div className="knockout-round-progress-card">
      <span className="knockout-round-progress-kicker">{kicker}</span>
      <strong className="knockout-round-progress-value">
        {value}/{total}
      </strong>
      <span className="knockout-round-progress-copy">Llaves con ganador</span>
    </div>
  )
}

export default function KnockoutPage() {
  const { user } = useAuth()
  const { teams, error: teamsError } = useTeams()
  const { config, error: configError } = useAppConfig()
  const groups = useGroupPredictions(user?.id)
  const thirds = useBestThirds(user?.id)
  const matches = useKnockoutMatches()
  const knockout = useKnockoutPredictions({
    userId: user?.id,
    teams,
    groupPredictions: groups.predictions,
    bestThirds: thirds.bestThirds,
    matches: matches.matches,
  })
  const [toast, setToast] = useState(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [previewMode, setPreviewMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('mundialito_knockout_preview') === '1'
  })
  const [previewPredictions, setPreviewPredictions] = useState([])
  const [previewShuffleSeed, setPreviewShuffleSeed] = useState(() => Date.now())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('mundialito_knockout_preview', previewMode ? '1' : '0')
  }, [previewMode])

  const locked = config?.predictions_locked || new Date(config?.deadline).getTime() <= Date.now()
  const loadErrors = [teamsError, configError, groups.error, thirds.error, matches.error, knockout.error].filter(Boolean)
  const completedGroups = useMemo(
    () => GROUPS.filter((group) => validateGroupTable(groups.getGroupPredictions(group)).valid).length,
    [groups]
  )
  const selectedThirdsCount = useMemo(
    () => thirds.bestThirds.filter((item) => item.qualifies).length,
    [thirds.bestThirds]
  )
  const readyForBracket = completedGroups === 12 && selectedThirdsCount === 8
  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams])
  const previewTeams = useMemo(
    () => (hasCompleteTeamPool(teams) ? teams : FALLBACK_TEAMS),
    [teams]
  )
  const previewResolvedTeams = useMemo(() => {
    const teamsById = new Map()

    ;[...previewTeams, ...teams].forEach((team) => {
      if (team?.id && !teamsById.has(team.id)) {
        teamsById.set(team.id, team)
      }
    })

    return [...teamsById.values()]
  }, [previewTeams, teams])
  const previewGroupPredictions = useMemo(
    () => buildPreviewGroupPredictions(previewTeams),
    [previewTeams]
  )
  const selectedThirdGroups = useMemo(
    () => thirds.bestThirds.filter((item) => item.qualifies).map((item) => item.group_letter),
    [thirds.bestThirds]
  )
  const previewSelectedGroups = useMemo(() => {
    if (selectedThirdGroups.length === 8) {
      return selectedThirdGroups
    }

    return buildPreviewBestThirds(matches.matches, previewGroupPredictions, previewTeams).map((row) => row.group_letter)
  }, [matches.matches, previewGroupPredictions, previewTeams, selectedThirdGroups])
  const previewSelectedThirdRows = useMemo(
    () =>
      buildPreviewThirdRowsForGroups(
        previewSelectedGroups,
        groups.predictions,
        previewGroupPredictions,
        previewResolvedTeams
      ),
    [groups.predictions, previewGroupPredictions, previewResolvedTeams, previewSelectedGroups]
  )
  const previewBestThirdAssignment = useMemo(
    () => buildRandomBestThirdAssignment(matches.matches, previewSelectedThirdRows, previewShuffleSeed),
    [matches.matches, previewSelectedThirdRows, previewShuffleSeed]
  )
  const previewBestThirds = useMemo(
    () =>
      previewSelectedGroups.map((groupLetter) => ({
        group_letter: groupLetter,
        qualifies: true,
      })),
    [previewSelectedGroups]
  )
  const previewMatches = useMemo(
    () =>
      resolveBracket({
        matches: matches.matches,
        teams: previewResolvedTeams,
        groupPredictions: previewGroupPredictions,
        bestThirds: previewBestThirds,
        knockoutPredictions: previewPredictions,
        bestThirdAssignmentOverride: previewBestThirdAssignment,
      }),
    [
      matches.matches,
      previewBestThirdAssignment,
      previewBestThirds,
      previewGroupPredictions,
      previewPredictions,
      previewResolvedTeams,
    ]
  )
  const activeMatches = previewMode ? previewMatches : knockout.matches
  const activeDisabled = previewMode ? false : locked
  const activeThirdsCount = previewMode ? previewBestThirds.length : selectedThirdsCount
  const canRenderBracket = previewMode || readyForBracket
  const summary = useMemo(
    () =>
      Object.values(ROUNDS).map((round) => ({
        round,
        count: activeMatches.filter((match) => match.round === round && match.winnerTeamId).length,
      })),
    [activeMatches]
  )
  const resolvedCount = useMemo(
    () => activeMatches.filter((match) => match.winnerTeamId).length,
    [activeMatches]
  )
  const championTeam = useMemo(() => {
    const finalMatch = activeMatches.find((match) => match.match_code === 'FIN_01')
    if (!finalMatch?.winnerTeamId) return null

    if (finalMatch.homeTeam?.id === finalMatch.winnerTeamId) return finalMatch.homeTeam
    if (finalMatch.awayTeam?.id === finalMatch.winnerTeamId) return finalMatch.awayTeam

    return teamMap.get(finalMatch.winnerTeamId) ?? null
  }, [activeMatches, teamMap])

  useEffect(() => {
    if (!championTeam) {
      setShowCelebration(false)
      return
    }

    setShowCelebration(true)
    const timeoutId = window.setTimeout(() => {
      setShowCelebration(false)
    }, 7000)

    return () => window.clearTimeout(timeoutId)
  }, [championTeam?.id])

  const overviewCards = useMemo(
    () => [
      {
        key: 'resolved',
        label: 'Llaves resueltas',
        value: `${resolvedCount}/31 completas`,
      },
      {
        key: 'thirds',
        label: 'Terceros listos',
        value: `${activeThirdsCount}/8 elegidos`,
      },
      {
        key: 'champion',
        label: 'Campeon',
        type: 'champion',
      },
      {
        key: 'deadline',
        label: 'Cierre',
        type: 'timer',
      },
    ],
    [activeThirdsCount, resolvedCount]
  )

  function handlePreviewPick(matchCode, winnerTeamId) {
    setPreviewPredictions((current) => {
      const existing = current.find((item) => item.match_code === matchCode)
      if (existing?.winner_team_id === winnerTeamId) return current

      const basePredictions = current.filter((item) => item.match_code !== matchCode)

      return [
        ...basePredictions,
        {
          match_code: matchCode,
          winner_team_id: winnerTeamId,
        },
      ]
    })
  }

  function togglePreviewMode() {
    setPreviewMode((current) => {
      const nextValue = !current

      if (nextValue) {
        setPreviewPredictions([])
        setPreviewShuffleSeed(Date.now())
      }

      return nextValue
    })
  }

  function resetPreviewEnvironment() {
    setPreviewPredictions([])
    setPreviewShuffleSeed(Date.now())
    setToast({ type: 'success', message: 'Entorno de prueba reiniciado.' })
  }

  async function handlePick(matchCode, winnerTeamId) {
    try {
      const existing = knockout.predictions.find((item) => item.match_code === matchCode)
      if (existing?.winner_team_id === winnerTeamId) return
      await knockout.saveWinner(matchCode, winnerTeamId)
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'No fue posible guardar el ganador.' })
    }
  }

  return (
    <section className="dashboard-services-panel groups-page-panel knockout-page-panel">
      <SubpageBackRow />

      {previewMode ? (
        <div className="dashboard-alert knockout-preview-alert">
          <p className="dashboard-alert-title">Modo prueba activado.</p>
          <p className="dashboard-alert-copy">
            Esta vista usa datos locales completos para abrir todas las llaves y no guarda cambios en Supabase.
          </p>
        </div>
      ) : null}

      {loadErrors.length ? (
        <div className="dashboard-alert">
          <p className="dashboard-alert-title">Hay datos de eliminatorias que no cargaron bien.</p>
          <p className="dashboard-alert-copy">
            La vista intenta seguir disponible mientras revisamos Supabase, los mejores terceros y las predicciones ya guardadas.
          </p>
        </div>
      ) : null}

      <div className="dashboard-services-head groups-page-head">
        <div className="dashboard-services-copy">
          <p className="dashboard-services-kicker">Eliminatorias</p>
          <h1 className="dashboard-services-title">Traza el camino al campeon</h1>
          <p className="dashboard-services-description">
            Selecciona el equipo que avanza en cada llave y veras como se propaga automaticamente hacia la siguiente ronda
            hasta llegar a la final.
          </p>
        </div>

        <div className="groups-head-side">
          <div className="knockout-head-controls">
            <button
              type="button"
              onClick={togglePreviewMode}
              className={`button-secondary knockout-preview-toggle${previewMode ? ' is-active' : ''}`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{previewMode ? 'Salir de modo prueba' : 'Activar modo prueba'}</span>
            </button>

            {previewMode ? (
              <button
                type="button"
                onClick={resetPreviewEnvironment}
                className="button-secondary knockout-preview-reset"
              >
                Reiniciar prueba
              </button>
            ) : null}

            <div className="knockout-head-chip">
              <Sparkles className="h-4 w-4" />
              <span>{previewMode ? 'Modo local sin guardar cambios' : 'Guardado automatico al elegir un ganador'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-services-overview knockout-overview-grid knockout-overview-grid-desktop">
        {overviewCards.map((card) => (
          <KnockoutOverviewCard
            key={card.key}
            championTeam={championTeam}
            deadline={config?.deadline}
            label={card.label}
            type={card.type}
            value={card.value}
          />
        ))}
      </div>

      <div className="knockout-mobile-overview-marquee" aria-label="Resumen de eliminatorias">
        <div className="knockout-mobile-overview-track">
          {[0, 1].map((groupIndex) => (
            <div
              key={`knockout-overview-group-${groupIndex}`}
              className="knockout-mobile-overview-group"
              aria-hidden={groupIndex === 1 ? 'true' : undefined}
            >
              {overviewCards.map((card) => (
                <KnockoutOverviewCard
                  key={`${groupIndex}-${card.key}`}
                  championTeam={championTeam}
                  deadline={config?.deadline}
                  label={card.label}
                  type={card.type}
                  value={card.value}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {!canRenderBracket ? (
        <div className="groups-stage-panel knockout-warning-panel">
          <div className="groups-stage-head">
            <div className="groups-section-copy">
              <p className="groups-section-kicker">Antes de abrir el bracket</p>
              <h2 className="groups-section-title">Completa las etapas previas</h2>
              <p className="groups-section-description">
                Las eliminatorias se arman con tus posiciones finales de grupos y con los ocho mejores terceros ya definidos.
              </p>
            </div>
            <span className="groups-validation-pill">
              <Trophy className="h-4 w-4" />
              <span>Faltan datos para armar las llaves</span>
            </span>
          </div>

          <p className="groups-stage-feedback">{`Llevas ${completedGroups}/12 grupos completos y ${selectedThirdsCount}/8 mejores terceros elegidos.`}</p>

          <div className="knockout-warning-actions">
            <Link to="/groups" className="button-secondary groups-back-button">
              <ArrowLeft className="h-4 w-4" />
              <span>Ir a grupos</span>
            </Link>
            <Link to="/best-thirds" className="button-secondary groups-back-button">
              <ArrowLeft className="h-4 w-4" />
              <span>Ir a mejores 3ros</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="groups-selector-panel knockout-rounds-panel">
            <div className="groups-section-copy">
              <p className="groups-section-kicker">Avance por ronda</p>
              <h2 className="groups-section-title">Tu progreso en eliminatorias</h2>
              <p className="groups-section-description">
                Cada etapa muestra cuantas llaves ya tienen ganador. Al tocar un equipo, el siguiente cruce se actualiza en
                la misma rama del diagrama.
              </p>
            </div>

            <div className="knockout-round-progress-grid knockout-round-progress-grid-desktop">
              {summary.map((item) => (
                <KnockoutRoundProgressCard
                  key={item.round}
                  kicker={ROUND_LABELS[item.round]}
                  total={activeMatches.filter((match) => match.round === item.round).length}
                  value={item.count}
                />
              ))}
            </div>

            <div className="knockout-mobile-progress-marquee" aria-label="Progreso por ronda">
              <div className="knockout-mobile-progress-track">
                {[0, 1].map((groupIndex) => (
                  <div
                    key={`knockout-progress-group-${groupIndex}`}
                    className="knockout-mobile-progress-group"
                    aria-hidden={groupIndex === 1 ? 'true' : undefined}
                  >
                    {summary.map((item) => (
                      <KnockoutRoundProgressCard
                        key={`${groupIndex}-${item.round}`}
                        kicker={ROUND_LABELS[item.round]}
                        total={activeMatches.filter((match) => match.round === item.round).length}
                        value={item.count}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <BracketView
            matches={activeMatches}
            disabled={activeDisabled}
            onPick={previewMode ? handlePreviewPick : handlePick}
            championTeam={championTeam}
            celebrate={showCelebration}
            isSimulationMode={previewMode}
          />
        </>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  )
}
