import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CalendarDays,
  Calculator,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  Save,
  Trophy,
} from 'lucide-react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import SubpageBackRow from '../components/common/SubpageBackRow'
import Toast from '../components/common/Toast'
import { supabase } from '../config/supabase'
import { useAppLayoutChromeHidden } from '../hooks/useAppLayoutChrome'
import { useAuth } from '../hooks/useAuth'

const OPEN_MATCH_STATUSES = new Set(['SCHEDULED', 'TIMED'])

function getTodayDateKey() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function getLocalDateKey(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function formatDateTime(value) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatMatchTime(value) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('es-CR', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function getTeamName(match, side, teamById) {
  const teamId = side === 'home' ? match.home_team_id : match.away_team_id
  const savedName = side === 'home' ? match.home_team_name : match.away_team_name
  return savedName || teamById.get(teamId)?.name || 'Por definir'
}

function getOfficialScore(match) {
  if (match.home_score === null || match.home_score === undefined || match.away_score === null || match.away_score === undefined) {
    return 'vs'
  }
  return `${match.home_score} - ${match.away_score}`
}

function isPredictionOpen(match) {
  const closesAt = new Date(match.prediction_closes_at ?? match.utc_date).getTime()
  return !Number.isNaN(closesAt) && Date.now() < closesAt && OPEN_MATCH_STATUSES.has(match.status)
}

async function mapFunctionError(error, fallbackMessage) {
  if (error?.name === 'FunctionsHttpError' && error?.context) {
    try {
      const status = error.context.status
      const payload = await error.context.json()
      if (status === 401 || status === 403) return 'Tu sesion admin expiro o no tiene permisos para ejecutar resultados.'

      const serverMessage = payload?.error || payload?.message || fallbackMessage
      const rawDetails = payload?.details
      const details =
        typeof rawDetails === 'string'
          ? rawDetails
          : rawDetails && typeof rawDetails === 'object' && typeof rawDetails.message === 'string'
            ? rawDetails.message
            : rawDetails
              ? JSON.stringify(rawDetails)
              : ''

      if (!details || details === serverMessage) return serverMessage
      return `${serverMessage} Detalle: ${details}`
    } catch {
      return fallbackMessage
    }
  }

  if (error?.name === 'FunctionsFetchError') return 'No se pudo conectar con la Edge Function de resultados.'
  return error?.message || fallbackMessage
}

function ResultsButton({ busy = false, children, disabled, icon: Icon, onClick, tone = 'primary' }) {
  return (
    <button type="button" className={`results-action-button is-${tone}`} disabled={disabled} onClick={onClick}>
      <Icon className={busy ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
      <span>{children}</span>
    </button>
  )
}

function ResultsOverviewCard({ icon: Icon, label, note, value }) {
  return (
    <article className="results-stat-card">
      <div className="results-stat-icon">
        <Icon className="h-5 w-5" />
      </div>
      <span className="results-stat-label">{label}</span>
      <strong className="results-stat-value">{value}</strong>
      <p className="results-stat-note">{note}</p>
    </article>
  )
}

function MatchDayCard({ match, prediction, teamById }) {
  return (
    <article className="results-match-card">
      <div className="results-match-time">
        <Clock className="h-4 w-4" />
        <span>{formatMatchTime(match.utc_date)}</span>
      </div>
      <div className="results-match-team">
        <span className="results-match-crest-fallback" />
        <strong>{getTeamName(match, 'home', teamById)}</strong>
      </div>
      <div className="results-match-score">
        <strong>{getOfficialScore(match)}</strong>
        <span>{match.status}</span>
      </div>
      <div className="results-match-team is-away">
        <span className="results-match-crest-fallback" />
        <strong>{getTeamName(match, 'away', teamById)}</strong>
      </div>
      {prediction ? (
        <div className="results-match-prediction-pill">
          <Lock className="h-3.5 w-3.5" />
          <span>Tu pick: {prediction.predicted_home_score} - {prediction.predicted_away_score}</span>
        </div>
      ) : null}
    </article>
  )
}

function PredictionCard({ draft, match, onDraftChange, onRequestSave, prediction, teamById }) {
  const open = isPredictionOpen(match)
  const locked = Boolean(prediction)
  const disabled = locked || !open
  const homeValue = locked ? prediction.predicted_home_score : draft?.home ?? ''
  const awayValue = locked ? prediction.predicted_away_score : draft?.away ?? ''

  return (
    <article className={`results-prediction-card${locked ? ' is-locked' : ''}`}>
      <div className="results-prediction-match">
        <span>{formatMatchTime(match.utc_date)}</span>
        <strong>{getTeamName(match, 'home', teamById)} vs {getTeamName(match, 'away', teamById)}</strong>
        <small>Cierra: {formatDateTime(match.prediction_closes_at ?? match.utc_date)}</small>
      </div>
      <div className="results-score-inputs">
        <label>
          <span>{getTeamName(match, 'home', teamById)}</span>
          <input type="number" min="0" max="99" inputMode="numeric" value={homeValue} disabled={disabled} onChange={(event) => onDraftChange(match.id, 'home', event.target.value)} />
        </label>
        <span className="results-score-separator">-</span>
        <label>
          <span>{getTeamName(match, 'away', teamById)}</span>
          <input type="number" min="0" max="99" inputMode="numeric" value={awayValue} disabled={disabled} onChange={(event) => onDraftChange(match.id, 'away', event.target.value)} />
        </label>
      </div>
      <div className="results-prediction-state">
        {locked ? (
          <span className="results-lock-pill"><Lock className="h-4 w-4" />Bloqueado</span>
        ) : open ? (
          <ResultsButton icon={Save} onClick={() => onRequestSave(match)} tone="secondary">Guardar</ResultsButton>
        ) : (
          <span className="results-lock-pill is-closed"><Lock className="h-4 w-4" />Cerrado</span>
        )}
        {locked ? (
          <span className={prediction.points_awarded ? 'results-points-pill is-hit' : 'results-points-pill'}>+{prediction.points_awarded ?? 0} pts</span>
        ) : (
          <span className="results-points-pill">+2 pts exacto</span>
        )}
      </div>
    </article>
  )
}

export default function WorldCupResultsPage() {
  const { isAdmin, user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey())
  const [activeTab, setActiveTab] = useState('matches')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState([])
  const [drafts, setDrafts] = useState({})
  const [pendingPrediction, setPendingPrediction] = useState(null)
  useAppLayoutChromeHidden(loading)

  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams])
  const predictionByMatchId = useMemo(() => new Map(predictions.map((prediction) => [prediction.match_id, prediction])), [predictions])
  const availableDates = useMemo(() => [...new Set(matches.map((match) => getLocalDateKey(match.utc_date)).filter(Boolean))], [matches])
  const dayMatches = useMemo(() => matches.filter((match) => getLocalDateKey(match.utc_date) === selectedDate), [matches, selectedDate])
  const openDayMatches = dayMatches.filter((match) => isPredictionOpen(match))
  const bonusPoints = predictions.reduce((total, prediction) => total + Number(prediction.points_awarded ?? 0), 0)
  const overviewCards = useMemo(
    () => [
      {
        key: 'matches',
        icon: Trophy,
        label: 'Partidos cargados',
        value: matches.length,
        note: 'Calendario y resultados del Mundial desde football-data.org.',
      },
      {
        key: 'predictions',
        icon: CheckCircle2,
        label: 'Tus marcadores',
        value: predictions.length,
        note: 'Cada marcador guardado queda bloqueado permanentemente.',
      },
      {
        key: 'bonus',
        icon: Lock,
        label: 'Puntos extra',
        value: bonusPoints,
        note: '2 puntos por marcador exacto cuando el partido termina.',
      },
    ],
    [bonusPoints, matches.length, predictions.length]
  )

  async function fetchSuite({ silent = false } = {}) {
    if (!silent) setLoading(true)
    setError('')
    try {
      const [
        { data: teamsData, error: teamsError },
        { data: matchesData, error: matchesError },
        { data: predictionsData, error: predictionsError },
      ] = await Promise.all([
        supabase.from('teams').select('id, name, code, group_letter'),
        supabase.from('world_cup_matches').select('*').order('utc_date'),
        user?.id
          ? supabase.from('match_score_predictions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ])
      if (teamsError) throw teamsError
      if (matchesError) throw matchesError
      if (predictionsError) throw predictionsError
      setTeams(teamsData ?? [])
      setMatches(matchesData ?? [])
      setPredictions(predictionsData ?? [])
    } catch (error) {
      console.error('Unable to load World Cup results suite.', error)
      setError(error?.message || 'No se pudieron cargar los resultados del Mundial.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSuite()
  }, [user?.id])

  function handleDraftChange(matchId, field, value) {
    const sanitizedValue = value === '' ? '' : String(Math.max(0, Math.min(99, Number(value))))
    setDrafts((current) => ({
      ...current,
      [matchId]: {
        home: current[matchId]?.home ?? '',
        away: current[matchId]?.away ?? '',
        [field]: sanitizedValue,
      },
    }))
  }

  function requestSavePrediction(match) {
    const draft = drafts[match.id] ?? {}
    const home = Number(draft.home)
    const away = Number(draft.away)
    if (draft.home === '' || draft.away === '' || Number.isNaN(home) || Number.isNaN(away)) {
      setToast({ type: 'error', title: 'Marcador incompleto', message: 'Completa ambos marcadores antes de guardar.' })
      return
    }
    setPendingPrediction({ match, home, away })
  }

  async function confirmSavePrediction() {
    if (!pendingPrediction || !user?.id) return
    setSaving(true)
    setError('')
    try {
      const { match, home, away } = pendingPrediction
      const { error } = await supabase.from('match_score_predictions').insert({
        user_id: user.id,
        match_id: match.id,
        predicted_home_score: home,
        predicted_away_score: away,
      })
      if (error) throw error
      setToast({ type: 'success', title: 'Marcador bloqueado', message: 'Tu prediccion quedo guardada y ya no se puede editar.' })
      setPendingPrediction(null)
      await fetchSuite({ silent: true })
    } catch (error) {
      console.error('Unable to save match score prediction.', error)
      setToast({ type: 'error', title: 'No se pudo guardar', message: error?.message || 'La prediccion no se pudo bloquear.' })
    } finally {
      setSaving(false)
    }
  }

  async function syncFootballResults() {
    setSyncing(true)
    setError('')
    try {
      const { data, error } = await supabase.functions.invoke('sync-results', { body: { source: 'results-page', triggered_at: new Date().toISOString() } })
      if (error) throw new Error(await mapFunctionError(error, 'No se pudo sincronizar football-data.org.'))
      setToast({ type: 'success', title: 'Resultados sincronizados', message: data?.message ?? 'Mundial actualizado.' })
      await fetchSuite({ silent: true })
    } catch (error) {
      const message = error?.message || 'No se pudo sincronizar el Mundial.'
      setError(message)
      setToast({ type: 'error', title: 'Sincronizacion fallida', message })
    } finally {
      setSyncing(false)
    }
  }

  async function calculateScores() {
    setCalculating(true)
    setError('')
    try {
      const { data, error } = await supabase.functions.invoke('calculate-scores', { body: { source: 'results-page', triggered_at: new Date().toISOString() } })
      if (error) throw new Error(await mapFunctionError(error, 'No se pudieron recalcular los puntajes.'))
      setToast({ type: 'success', title: 'Scoreboard actualizado', message: data?.message ?? 'Puntajes recalculados.' })
      await fetchSuite({ silent: true })
    } catch (error) {
      const message = error?.message || 'No se pudo recalcular el scoreboard.'
      setError(message)
      setToast({ type: 'error', title: 'Recalculo fallido', message })
    } finally {
      setCalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="groups-summary-panel">
        <LoadingSpinner label="Cargando resultados..." />
      </div>
    )
  }

  return (
    <section className="dashboard-services-panel groups-page-panel results-page-panel">
      <SubpageBackRow />

      {error ? (
        <div className="dashboard-alert">
          <p className="dashboard-alert-title">No se pudo cargar la suite de resultados.</p>
          <p className="dashboard-alert-copy">{error}</p>
        </div>
      ) : null}
      <article className="results-hero">
        <div className="results-hero-copy">
          <p className="dashboard-services-kicker">Resultados</p>
          <h1 className="dashboard-services-title">Partidos del Mundial</h1>
          <p className="dashboard-services-description">
            Revisa los partidos del dia, bloquea tu marcador exacto antes del inicio y suma 2 puntos extra si lo pegas.
          </p>
        </div>
        <div className="results-actions">
          {isAdmin ? (
            <>
              <ResultsButton busy={syncing} icon={syncing ? RefreshCw : Activity} disabled={syncing || calculating} onClick={syncFootballResults}>
                {syncing ? 'Sincronizando' : 'Sincronizar Mundial'}
              </ResultsButton>
              <ResultsButton busy={calculating} icon={calculating ? RefreshCw : Calculator} disabled={syncing || calculating} onClick={calculateScores} tone="secondary">
                {calculating ? 'Recalculando' : 'Recalcular puntajes'}
              </ResultsButton>
            </>
          ) : null}
        </div>
      </article>
      <div className="results-date-panel">
        <div className="results-date-copy">
          <CalendarDays className="h-5 w-5" />
          <div>
            <span className="results-date-label results-date-label-desktop">Dia de partidos</span>
            <span className="results-date-label results-date-label-mobile">Busca la fecha de los partidos</span>
            <strong>{selectedDate}</strong>
          </div>
        </div>
        <div className="results-date-controls">
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} list="world-cup-match-dates" />
          <datalist id="world-cup-match-dates">
            {availableDates.map((date) => <option key={date} value={date} />)}
          </datalist>
          <span>{dayMatches.length} partidos</span>
        </div>
      </div>
      <div className="results-overview-grid results-overview-grid-desktop">
        {overviewCards.map((card) => (
          <ResultsOverviewCard key={card.key} icon={card.icon} label={card.label} note={card.note} value={card.value} />
        ))}
      </div>
      <div className="results-mobile-overview-marquee" aria-label="Resumen de resultados">
        <div className="results-mobile-overview-track">
          {[0, 1].map((groupIndex) => (
            <div
              key={`results-overview-group-${groupIndex}`}
              className="results-mobile-overview-group"
              aria-hidden={groupIndex === 1 ? 'true' : undefined}
            >
              {overviewCards.map((card) => (
                <ResultsOverviewCard
                  key={`${groupIndex}-${card.key}`}
                  icon={card.icon}
                  label={card.label}
                  note={card.note}
                  value={card.value}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="results-tab-shell" role="tablist" aria-label="Cambiar entre partidos y predicciones">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'matches'}
          className={`results-tab-button${activeTab === 'matches' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <span className="results-tab-label">En vivo / Partidos</span>
          <span className="results-tab-meta">{dayMatches.length} del dia</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'predictions'}
          className={`results-tab-button${activeTab === 'predictions' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('predictions')}
        >
          <span className="results-tab-label">Predecir resultados</span>
          <span className="results-tab-meta">{openDayMatches.length} abiertos</span>
        </button>
      </div>
      {activeTab === 'matches' ? (
        <div className="results-day-panel" role="tabpanel">
          <div className="groups-summary-head">
            <div className="groups-section-copy"><p className="groups-section-kicker">Partidos de hoy</p><h2 className="groups-section-title">Marcadores y calendario</h2><p className="groups-section-description">Estos son los partidos programados para el dia seleccionado y su estado oficial.</p></div>
            <span className="groups-validation-pill is-valid"><Clock className="h-4 w-4" /><span>{openDayMatches.length} abiertos</span></span>
          </div>
          <div className="results-match-list">
            {dayMatches.length ? dayMatches.map((match) => <MatchDayCard key={match.id} match={match} prediction={predictionByMatchId.get(match.id)} teamById={teamById} />) : <div className="groups-stage-feedback">No hay partidos del Mundial para este dia. Prueba otra fecha del calendario.</div>}
          </div>
        </div>
      ) : (
        <div className="results-prediction-panel" role="tabpanel">
          <div className="groups-summary-head">
            <div className="groups-section-copy"><p className="groups-section-kicker">Predice tus resultados</p><h2 className="groups-section-title">Marcador exacto</h2><p className="groups-section-description">Escribe el marcador, confirma y queda bloqueado. Solo puedes guardar antes de que cierre el partido.</p></div>
            <span className="groups-validation-pill"><Save className="h-4 w-4" /><span>+2 pts exacto</span></span>
          </div>
          <div className="results-prediction-list">
            {dayMatches.length ? dayMatches.map((match) => <PredictionCard key={`prediction-${match.id}`} draft={drafts[match.id]} match={match} onDraftChange={handleDraftChange} onRequestSave={requestSavePrediction} prediction={predictionByMatchId.get(match.id)} teamById={teamById} />) : <div className="groups-stage-feedback">No hay partidos disponibles para predecir en esta fecha.</div>}
          </div>
        </div>
      )}
      <Modal open={Boolean(pendingPrediction)} title="Confirmar marcador" onClose={() => (saving ? null : setPendingPrediction(null))}>
        {pendingPrediction ? (
          <div className="results-confirm-modal">
            <p>Estas por guardar <strong>{pendingPrediction.home} - {pendingPrediction.away}</strong> para <strong>{getTeamName(pendingPrediction.match, 'home', teamById)} vs {getTeamName(pendingPrediction.match, 'away', teamById)}</strong>.</p>
            <p>Al confirmar, este marcador queda bloqueado y no se puede cambiar.</p>
            <div className="results-confirm-actions">
              <button type="button" className="button-secondary" disabled={saving} onClick={() => setPendingPrediction(null)}>Cancelar</button>
              <button type="button" className="results-action-button is-primary" disabled={saving} onClick={confirmSavePrediction}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                <span>{saving ? 'Guardando' : 'Confirmar y bloquear'}</span>
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  )
}
