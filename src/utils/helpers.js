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
  const positions = new Set(rows.map((row) => Number(row.predicted_position)))
  const hasEveryPosition = [1, 2, 3, 4].every((position) => positions.has(position))

  return hasEveryPosition
    ? { valid: true, message: 'Orden completo. Ya puedes guardar este grupo.' }
    : { valid: false, message: 'Cada equipo debe ocupar un puesto diferente del 1 al 4.' }
}
