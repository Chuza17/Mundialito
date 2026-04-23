import { useMemo, useState } from 'react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Toast from '../components/common/Toast'
import PredictionSummaryShowcase from '../components/predictions/PredictionSummaryShowcase'
import { useAuth } from '../hooks/useAuth'
import { useBestThirds } from '../hooks/useBestThirds'
import { useGroupPredictions } from '../hooks/useGroupPredictions'
import { useKnockoutMatches } from '../hooks/useKnockoutMatches'
import { useKnockoutPredictions } from '../hooks/useKnockoutPredictions'
import { useTeams } from '../hooks/useTeams'
import { buildPredictionShareBlob } from '../utils/predictionShareImage'
import { buildQualifiedThirdRows, buildTeamMap, enrichGroupRows, getWinnerTeamFromMatch } from '../utils/predictionSummary'

export default function MyPredictionPage() {
  const { user, profile } = useAuth()
  const { teams, loading: teamsLoading, error: teamsError } = useTeams()
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
  const [sharePending, setSharePending] = useState(false)

  const loading = teamsLoading || groups.loading || thirds.loading || matches.loading || knockout.loading
  const loadErrors = [teamsError, groups.error, thirds.error, matches.error, knockout.error].filter(Boolean)
  const teamMap = useMemo(() => buildTeamMap(teams), [teams])
  const groupRows = useMemo(() => enrichGroupRows(groups.predictions, teamMap), [groups.predictions, teamMap])
  const qualifiedThirdRows = useMemo(
    () => buildQualifiedThirdRows(thirds.bestThirds, groupRows),
    [groupRows, thirds.bestThirds]
  )
  const championTeam = useMemo(() => {
    const finalMatch = knockout.matches.find((match) => match.match_code === 'FIN_01')
    return getWinnerTeamFromMatch(finalMatch, teamMap)
  }, [knockout.matches, teamMap])
  const shareUrl = user?.id ? `${window.location.origin}/predictions/${user.id}` : ''

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  async function handleShareSection(section, round) {
    try {
      setSharePending(true)

      const blob = await buildPredictionShareBlob({
        section,
        round,
        displayName: profile?.display_name ?? profile?.username ?? 'Mi Quiniela',
        groupRows,
        qualifiedThirdRows,
        knockoutMatches: knockout.matches,
      })

      const suffix = section === 'knockout' && round ? round : section
      const fileName = `quiniela-${suffix}-${profile?.username ?? user?.id ?? 'jugador'}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      if (navigator.share) {
        try {
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `La quiniela de ${profile?.display_name ?? profile?.username ?? 'Jugador'}`,
              text: 'Te comparto una imagen de mis predicciones en El Mundialito.',
              files: [file],
            })
            setToast({ type: 'success', message: 'Imagen lista y compartida.' })
            return
          }
        } catch (error) {
          if (error?.name === 'AbortError') return
          throw error
        }
      }

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({
            'image/png': blob,
          }),
        ])
        setToast({ type: 'success', message: 'Imagen copiada al portapapeles.' })
        return
      }

      downloadBlob(blob, fileName)
      setToast({ type: 'success', message: 'Tu navegador descargo la imagen para que la compartas.' })
    } catch (error) {
      if (error?.name === 'AbortError') return

      console.error('Unable to share prediction section image.', error)
      setToast({ type: 'error', message: 'No se pudo generar la imagen de esta seccion.' })
    } finally {
      setSharePending(false)
    }
  }

  if (loading) {
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
          <p className="dashboard-alert-title">No todo el resumen de la quiniela cargo perfecto.</p>
          <p className="dashboard-alert-copy">
            La pagina sigue disponible con la informacion que si logramos resolver, pero conviene revisar Supabase si falta alguna fase.
          </p>
        </div>
      ) : null}

      <PredictionSummaryShowcase
        backTo="/dashboard"
        championTeam={championTeam}
        displayName={profile?.display_name ?? profile?.username ?? 'Mi Quiniela'}
        groupRows={groupRows}
        knockoutMatches={knockout.matches}
        mode="owner"
        onShareSection={handleShareSection}
        qualifiedThirdRows={qualifiedThirdRows}
        sharePending={sharePending}
        secondaryLink={shareUrl ? { to: `/predictions/${user.id}`, label: 'Vista publica' } : null}
        showBackButton
        username={profile?.username ?? ''}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  )
}
