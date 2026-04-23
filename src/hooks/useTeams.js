import { useContext } from 'react'
import { PredictionsContext } from '../contexts/PredictionsContext'

export function useTeams() {
  const { teams, loading, error, refreshTeams } = useContext(PredictionsContext)
  return { teams, loading, error, refreshTeams }
}
