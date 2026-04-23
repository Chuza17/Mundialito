import { DEFAULT_DEADLINE, GROUPS } from './constants'

export function groupTeamsByLetter(teams = []) {
  return GROUPS.reduce((accumulator, letter) => {
    accumulator[letter] = teams.filter((team) => team.group_letter === letter)
    return accumulator
  }, {})
}

export function formatCountdown(deadline = DEFAULT_DEADLINE) {
  const remaining = new Date(deadline).getTime() - Date.now()
  if (remaining <= 0) return 'Predicciones cerradas'
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((remaining / (1000 * 60)) % 60)
  return `${days}d ${hours}h ${minutes}m`
}

export function formatDate(dateValue) {
  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue))
}

export function getProgressPercentage(groupPredictions = [], bestThirds = [], knockoutPredictions = []) {
  const groupsDone = Math.min(Math.round(groupPredictions.length / 4), 12)
  const thirdsDone = Math.min(bestThirds.length, 8)
  const knockoutsDone = knockoutPredictions.length
  return Math.round(((groupsDone + thirdsDone + knockoutsDone) / (12 + 8 + 31)) * 100)
}

export function validateGroupTable(rows = []) {
  if (rows.length !== 4) return { valid: false, message: 'Faltan equipos en el grupo.' }
  const positions = new Set(rows.map((row) => row.predicted_position))
  if (positions.size !== 4) return { valid: false, message: 'Cada posición debe ser única.' }
  if (rows.some((row) => row.predicted_points < 0 || row.predicted_points > 9)) {
    return { valid: false, message: 'Los puntos deben estar entre 0 y 9.' }
  }
  const sorted = [...rows].sort((left, right) => left.predicted_position - right.predicted_position)
  const coherent =
    sorted[0].predicted_points >= sorted[1].predicted_points &&
    sorted[1].predicted_points >= sorted[2].predicted_points &&
    sorted[2].predicted_points >= sorted[3].predicted_points
  return coherent
    ? { valid: true, message: 'Grupo válido.' }
    : { valid: false, message: 'Debe cumplirse 1° ≥ 2° ≥ 3° ≥ 4°.' }
}
