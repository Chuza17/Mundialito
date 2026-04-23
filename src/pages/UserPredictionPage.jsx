import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'
import PredictionSummaryShowcase from '../components/predictions/PredictionSummaryShowcase'
import { supabase } from '../config/supabase'
import { useAuth } from '../hooks/useAuth'
import { useKnockoutMatches } from '../hooks/useKnockoutMatches'
import { useTeams } from '../hooks/useTeams'
import { resolveBracket } from '../utils/bracketLogic'
import { buildQualifiedThirdRows, buildTeamMap, enrichGroupRows, getWinnerTeamFromMatch } from '../utils/predictionSummary'

export default function UserPredictionPage() {
  const { userId } = useParams()
  const { user } = useAuth()
  const { teams, loading: teamsLoading, error: teamsError } = useTeams()
  const { matches, loading: matchesLoading, error: matchesError } = useKnockoutMatches()
  const [profile, setProfile] = useState(null)
  const [groups, setGroups] = useState([])
  const [thirds, setThirds] = useState([])
  const [knockout, setKnockout] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPrediction() {
      setLoading(true)
      setError('')

      try {
        const [
          { data: profileData, error: profileError },
          { data: groupData, error: groupError },
          { data: thirdsData, error: thirdsError },
          { data: knockoutData, error: knockoutError },
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          supabase.from('group_predictions').select('*').eq('user_id', userId).order('group_letter').order('predicted_position'),
          supabase.from('best_thirds_predictions').select('*').eq('user_id', userId),
          supabase.from('knockout_predictions').select('*').eq('user_id', userId).order('match_code'),
        ])

        if (profileError) throw profileError
        if (groupError) throw groupError
        if (thirdsError) throw thirdsError
        if (knockoutError) throw knockoutError

        setProfile(profileData ?? null)
        setGroups(groupData ?? [])
        setThirds(thirdsData ?? [])
        setKnockout(knockoutData ?? [])
      } catch (fetchError) {
        console.error('Unable to load public prediction summary.', fetchError)
        setError('No se pudo cargar la quiniela compartida.')
      } finally {
        setLoading(false)
      }
    }

    void fetchPrediction()
  }, [userId])

  const teamMap = useMemo(() => buildTeamMap(teams), [teams])
  const groupRows = useMemo(() => enrichGroupRows(groups, teamMap), [groups, teamMap])
  const qualifiedThirdRows = useMemo(() => buildQualifiedThirdRows(thirds, groupRows), [groupRows, thirds])
  const resolvedKnockout = useMemo(
    () =>
      resolveBracket({
        matches,
        teams,
        groupPredictions: groups,
        bestThirds: thirds,
        knockoutPredictions: knockout,
      }),
    [groups, knockout, matches, teams, thirds]
  )
  const championTeam = useMemo(() => {
    const finalMatch = resolvedKnockout.find((match) => match.match_code === 'FIN_01')
    return getWinnerTeamFromMatch(finalMatch, teamMap)
  }, [resolvedKnockout, teamMap])
  const pageLoading = loading || teamsLoading || matchesLoading
  const loadErrors = [error, teamsError, matchesError].filter(Boolean)

  if (pageLoading) {
    return (
      <div className="groups-summary-panel">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <section className="space-y-6">
      {loadErrors.length ? (
        <div className="dashboard-alert">
          <p className="dashboard-alert-title">Esta quiniela compartida no cargo completa.</p>
          <p className="dashboard-alert-copy">
            Algunas fases o datos del usuario no llegaron desde Supabase. La vista sigue intentando mostrar todo lo disponible.
          </p>
        </div>
      ) : null}

      <PredictionSummaryShowcase
        championTeam={championTeam}
        displayName={profile?.display_name ?? profile?.username ?? 'Quiniela compartida'}
        groupRows={groupRows}
        knockoutMatches={resolvedKnockout}
        mode="public"
        qualifiedThirdRows={qualifiedThirdRows}
        secondaryLink={user ? { to: '/dashboard', label: 'Abrir El Mundialito' } : { to: '/login', label: 'Entrar a El Mundialito' }}
        username={profile?.username ?? ''}
      />
    </section>
  )
}
