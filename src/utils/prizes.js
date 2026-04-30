export const PRIZE_PLACE_FIELDS = [
  {
    key: 'first_place_prize',
    rank: '01',
    label: 'Primer lugar',
    title: 'Campeon del Mundialito',
    note: 'Mayor puntaje total del scoreboard.',
    tone: 'is-first',
    icon: 'trophy',
  },
  {
    key: 'second_place_prize',
    rank: '02',
    label: 'Segundo lugar',
    title: 'Subcampeon',
    note: 'Segundo mejor puntaje acumulado.',
    tone: 'is-second',
    icon: 'crown',
  },
  {
    key: 'third_place_prize',
    rank: '03',
    label: 'Tercer lugar',
    title: 'Podio final',
    note: 'Tercer mejor puesto de la tabla.',
    tone: 'is-third',
    icon: 'gift',
  },
]

export function formatPrizeAmount(amount) {
  const numericAmount = Number(amount || 0)

  if (!numericAmount) return 'Por definir'

  return `$${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(numericAmount)}`
}

export function getPrizeCards(config = {}) {
  return PRIZE_PLACE_FIELDS.map((prize) => ({
    ...prize,
    amount: Number(config?.[prize.key] || 0),
  }))
}

export function getPrizePool(config = {}) {
  return PRIZE_PLACE_FIELDS.reduce((total, prize) => total + Number(config?.[prize.key] || 0), 0)
}
