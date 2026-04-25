import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Crown,
  Shield,
  Trophy,
  Users2,
} from 'lucide-react'
import CinematicDashboard from '../components/dashboard/CinematicDashboard'
import { supabase } from '../config/supabase'
import { useAppConfig } from '../hooks/useAppConfig'
import { useAuth } from '../hooks/useAuth'
import { useBestThirds } from '../hooks/useBestThirds'
import { useGroupPredictions } from '../hooks/useGroupPredictions'
import { useKnockoutMatches } from '../hooks/useKnockoutMatches'
import { useKnockoutPredictions } from '../hooks/useKnockoutPredictions'
import { useTeams } from '../hooks/useTeams'
import { fetchLeaderboardEntries, getLeaderboardSpotlight } from '../utils/leaderboard'
import { getProgressPercentage } from '../utils/helpers'

export default function DashboardServicesPage() {
  const { user, profile, authError, isAdmin } = useAuth()
  const [score, setScore] = useState(0)
  const [scoreError, setScoreError] = useState(null)
  const [leaderboardSpotlight, setLeaderboardSpotlight] = useState({ mode: 'empty', rank: null, entry: null })
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const { teams, error: teamsError } = useTeams()
  const { config, error: configError } = useAppConfig()
  const groups = useGroupPredictions(user?.id)
  const thirds = useBestThirds(user?.id)
  const knockoutMatches = useKnockoutMatches()
  const knockout = useKnockoutPredictions({
    userId: user?.id,
    teams,
    groupPredictions: groups.predictions,
    bestThirds: thirds.bestThirds,
    matches: knockoutMatches.matches,
  })

  const progress = getProgressPercentage(groups.predictions, thirds.bestThirds, knockout.predictions)
  const completedGroups = groups.getCompletedGroupsCount()
  const selectedThirds = thirds.bestThirds.filter((team) => team.qualifies).length
  const knockoutDone = knockout.predictions.length
  const finalPredictionDone = knockout.predictions.some((prediction) => prediction.match_code === 'FIN_01')
  const isLocked = config?.predictions_locked
  const name = profile?.display_name ?? profile?.username ?? 'Jugador'

  useEffect(() => {
    if (!user?.id) {
      setScore(0)
      setScoreError(null)
      return undefined
    }

    let isActive = true

    async function fetchUserScore() {
      const { data, error } = await supabase
        .from('user_scores')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!isActive) return

      if (error) {
        setScore(0)
        setScoreError(error)
        return
      }

      setScore(Number(data?.total_points ?? 0))
      setScoreError(null)
    }

    void fetchUserScore()

    const channel = supabase
      .channel(`dashboard-score-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_scores', filter: `user_id=eq.${user.id}` },
        () => fetchUserScore()
      )
      .subscribe()

    return () => {
      isActive = false
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setLeaderboardSpotlight({ mode: 'empty', rank: null, entry: null })
      setLeaderboardLoading(false)
      return undefined
    }

    let isActive = true

    async function fetchLeaderboardRank() {
      setLeaderboardLoading(true)

      const { data } = await fetchLeaderboardEntries(supabase)

      if (!isActive) return

      setLeaderboardSpotlight(getLeaderboardSpotlight(data ?? [], user.id))
      setLeaderboardLoading(false)
    }

    void fetchLeaderboardRank()

    const channel = supabase
      .channel(`dashboard-rank-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_scores' }, () => fetchLeaderboardRank())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchLeaderboardRank())
      .subscribe()

    return () => {
      isActive = false
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const loadErrors = [
    authError,
    scoreError,
    teamsError,
    configError,
    groups.error,
    thirds.error,
    knockoutMatches.error,
    knockout.error,
  ].filter(Boolean)

  const sections = useMemo(() => {
    const baseSections = [
      {
        to: '/groups',
        number: '01',
        title: 'Grupos',
        subtitle: 'Tabla inicial',
        description: 'Ordena los 12 grupos y define el recorrido base de tu quiniela.',
        summary: `${completedGroups}/12 grupos completos`,
        status: isLocked ? 'Bloqueado' : completedGroups === 12 ? 'Completo' : 'En progreso',
        icon: Trophy,
        video: [
          '/dashboard-videos/grupos.mp4',
          '/dashboard-videos/groups.mp4',
        ],
        accent: '#5f98d6',
      },
      {
        to: '/best-thirds',
        number: '02',
        title: 'Mejores 3ros',
        subtitle: 'Clasificacion extra',
        description: 'Selecciona los terceros que avanzan y destraba los cruces del cuadro.',
        summary: `${selectedThirds}/8 seleccionados`,
        status: isLocked ? 'Bloqueado' : selectedThirds === 8 ? 'Completo' : 'Pendiente',
        icon: Crown,
        video: [
          '/dashboard-videos/mejores-terceros.mp4',
          '/dashboard-videos/Mejores 3eros.mp4',
        ],
        accent: '#d9ab4d',
      },
      {
        to: '/knockout',
        number: '03',
        title: 'Eliminatorias',
        subtitle: 'Camino final',
        description: 'Completa cada llave hasta la final con el mismo ritmo visual del torneo.',
        summary: `${knockoutDone}/31 llaves resueltas`,
        status: isLocked ? 'Bloqueado' : knockoutDone === 31 ? 'Completo' : 'En progreso',
        icon: Shield,
        video: '/dashboard-videos/eliminatorias.mp4',
        accent: '#24aa67',
      },
      {
        to: '/results',
        number: '04',
        title: 'Resultados',
        subtitle: 'Marcadores reales',
        description: 'Consulta partidos del Mundial, guarda tu marcador exacto y compite por puntos extra.',
        summary: '+2 pts por marcador exacto',
        status: 'Predice resultados',
        icon: Activity,
        video: [
          '/dashboard-videos/admin.mp4',
        ],
        accent: '#f08a5d',
      },
      {
        to: '/scoreboard',
        number: '05',
        title: 'Scoreboard',
        subtitle: 'Premios y tabla',
        description: 'Consulta premios activos, la tabla general y compara tu avance con el resto.',
        summary: 'Premios configurables',
        status: 'Ver scoreboard',
        icon: BarChart3,
        video: [
          '/dashboard-videos/scoreboard.mp4',
        ],
        accent: '#81a0ff',
      },
      {
        to: '/my-prediction',
        number: '06',
        title: 'Mi Quiniela',
        subtitle: 'Tu resumen',
        description: 'Revisa tu prediccion completa y valida si ya dejaste lista la final.',
        summary: finalPredictionDone ? 'Final definida' : 'Final pendiente',
        status: `${progress}% completado`,
        icon: Users2,
        video: [
          '/dashboard-videos/mi-quiniela.mp4',
          '/dashboard-videos/mi_quinela.mp4',
        ],
        accent: '#76cda5',
      },
    ]

    if (isAdmin) {
      baseSections.push({
        to: '/admin/users',
        number: '07',
        title: 'Gestion Usuarios',
        subtitle: 'Panel admin',
        description: 'Administra cuentas y controla el acceso sin salir de la misma interfaz.',
        summary: 'Herramientas administrativas',
        status: 'Solo admin',
        icon: Users2,
        video: [
          '/dashboard-videos/admin.mp4',
        ],
        accent: '#b58eff',
      })
    }

    return baseSections
  }, [completedGroups, finalPredictionDone, isAdmin, isLocked, knockoutDone, progress, selectedThirds])

  return (
    <CinematicDashboard
      deadline={config?.deadline}
      loadErrors={loadErrors}
      name={name}
      progress={progress}
      score={score}
      leaderboardSpotlight={leaderboardSpotlight}
      leaderboardLoading={leaderboardLoading}
      sections={sections}
      userId={user?.id}
    />
  )
}
