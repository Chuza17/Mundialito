import { getMatchesByRound } from './bracketLogic'
import { APP_LOGO, GROUPS, ROUND_NAMES, TEAM_ASSET_MAP } from './constants'
import { getTeamTokenLabel } from '../components/common/TeamOrb'

const WIDTH = 1600
const PADDING = 72
const CARD_GAP = 28
const imageCache = new Map()

function roundRect(context, x, y, width, height, radius) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function fitText(context, text, maxWidth) {
  if (!text) return ''
  if (context.measureText(text).width <= maxWidth) return text

  let value = text
  while (value.length > 1 && context.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1)
  }

  return `${value}…`
}

async function loadImage(src) {
  if (!src) return null
  if (imageCache.has(src)) return imageCache.get(src)

  const image = await new Promise((resolve) => {
    const nextImage = new Image()
    nextImage.onload = () => resolve(nextImage)
    nextImage.onerror = () => resolve(null)
    nextImage.src = src
  })

  imageCache.set(src, image)
  return image
}

async function drawOrb(context, team, x, y, size) {
  const asset = team?.code ? TEAM_ASSET_MAP[team.code] : null
  const label = getTeamTokenLabel(team)
  const radius = size / 2

  context.save()
  roundRect(context, x, y, size, size, radius)
  context.clip()

  if (asset) {
    const image = await loadImage(asset)
    if (image) {
      context.drawImage(image, x, y, size, size)
      context.restore()
      return
    }
  }

  const gradient = context.createLinearGradient(x, y, x + size, y + size)
  gradient.addColorStop(0, '#274834')
  gradient.addColorStop(1, '#0d1f17')
  context.fillStyle = gradient
  context.fillRect(x, y, size, size)
  context.restore()

  context.fillStyle = '#ffffff'
  context.font = `800 ${Math.max(14, size * 0.34)}px Inter, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, x + radius, y + radius + 1)
}

async function drawHeader(context, height, title, subtitle, displayName) {
  context.fillStyle = '#08130e'
  context.fillRect(0, 0, WIDTH, height)

  const glow = context.createRadialGradient(220, 120, 20, 220, 120, 260)
  glow.addColorStop(0, 'rgba(216,255,132,0.18)')
  glow.addColorStop(1, 'rgba(216,255,132,0)')
  context.fillStyle = glow
  context.fillRect(0, 0, WIDTH, 300)

  const accent = context.createRadialGradient(WIDTH - 180, height - 60, 10, WIDTH - 180, height - 60, 260)
  accent.addColorStop(0, 'rgba(16,185,129,0.18)')
  accent.addColorStop(1, 'rgba(16,185,129,0)')
  context.fillStyle = accent
  context.fillRect(0, 0, WIDTH, height)

  const logo = await loadImage(APP_LOGO)
  if (logo) {
    context.save()
    roundRect(context, PADDING, 44, 72, 72, 36)
    context.clip()
    context.fillStyle = 'rgba(255,255,255,0.08)'
    context.fillRect(PADDING, 44, 72, 72)
    context.drawImage(logo, PADDING + 8, 52, 56, 56)
    context.restore()
  }

  context.fillStyle = '#d8ff84'
  context.font = '800 20px Inter, sans-serif'
  context.letterSpacing = '0'
  context.fillText('EL MUNDIALITO', PADDING + 96, 86)

  context.fillStyle = 'rgba(248,250,252,0.14)'
  context.font = '900 140px Montserrat, sans-serif'
  context.fillText('MI QUINIELA', PADDING, 190)

  context.fillStyle = '#ffffff'
  context.font = '900 62px Montserrat, sans-serif'
  context.fillText(title, PADDING, 242)

  context.fillStyle = 'rgba(226,232,240,0.84)'
  context.font = '500 30px Inter, sans-serif'
  context.fillText(subtitle, PADDING, 292)

  context.fillStyle = 'rgba(226,232,240,0.68)'
  context.font = '600 24px Inter, sans-serif'
  context.fillText(displayName, PADDING, 336)
}

function buildGroupSummaries(groupRows) {
  return GROUPS.map((group) => {
    const rows = groupRows
      .filter((row) => row.group_letter === group)
      .sort((left, right) => left.predicted_position - right.predicted_position)

    return {
      group,
      rows,
      topTeams: rows.slice(0, 3).map((row) => row.team).filter(Boolean),
    }
  }).filter((summary) => summary.rows.length)
}

async function drawGroupCard(context, summary, x, y, width, height) {
  roundRect(context, x, y, width, height, 28)
  context.fillStyle = 'rgba(255,255,255,0.04)'
  context.fill()
  context.strokeStyle = 'rgba(167,243,208,0.14)'
  context.lineWidth = 2
  context.stroke()

  context.fillStyle = '#a3e635'
  context.font = '800 15px Inter, sans-serif'
  context.fillText('GRUPO', x + 24, y + 34)

  context.fillStyle = '#ffffff'
  context.font = '900 56px Montserrat, sans-serif'
  context.fillText(summary.group, x + 24, y + 96)

  let chipX = x + width - 24
  context.font = '800 18px Inter, sans-serif'
  for (let index = summary.topTeams.length - 1; index >= 0; index -= 1) {
    const team = summary.topTeams[index]
    const label = getTeamTokenLabel(team)
    const chipWidth = Math.max(62, context.measureText(label).width + 30)
    chipX -= chipWidth
    roundRect(context, chipX, y + 24, chipWidth, 42, 21)
    context.fillStyle = 'rgba(163,230,53,0.12)'
    context.fill()
    context.fillStyle = '#ffffff'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label, chipX + chipWidth / 2, y + 46)
    chipX -= 12
  }

  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'

  for (let index = 0; index < summary.rows.length; index += 1) {
    const row = summary.rows[index]
    const rowY = y + 122 + index * 62
    roundRect(context, x + 20, rowY, width - 40, 50, 20)
    context.fillStyle = 'rgba(255,255,255,0.04)'
    context.fill()

    context.fillStyle = 'rgba(255,255,255,0.08)'
    context.beginPath()
    context.arc(x + 52, rowY + 25, 18, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#ffffff'
    context.font = '800 18px Inter, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(String(row.predicted_position), x + 52, rowY + 25)

    await drawOrb(context, row.team, x + 78, rowY + 7, 36)

    context.textAlign = 'left'
    context.fillStyle = '#ffffff'
    context.font = '800 18px Inter, sans-serif'
    context.fillText(fitText(context, row.team?.name ?? 'Pendiente', width - 220), x + 126, rowY + 23)

    context.fillStyle = 'rgba(226,232,240,0.68)'
    context.font = '700 15px Inter, sans-serif'
    context.fillText(getTeamTokenLabel(row.team), x + 126, rowY + 42)

    context.textAlign = 'right'
    context.fillStyle = '#d8ff84'
    context.font = '800 18px Inter, sans-serif'
    context.fillText(`${row.predicted_points} pts`, x + width - 28, rowY + 29)
    context.textAlign = 'left'
  }
}

async function drawThirdCard(context, row, x, y, width, height) {
  roundRect(context, x, y, width, height, 28)
  context.fillStyle = 'rgba(255,255,255,0.04)'
  context.fill()
  context.strokeStyle = 'rgba(167,243,208,0.14)'
  context.lineWidth = 2
  context.stroke()

  context.fillStyle = '#a3e635'
  context.font = '800 15px Inter, sans-serif'
  context.fillText(`GRUPO ${row.group_letter}`, x + 24, y + 34)

  await drawOrb(context, row.team, x + 24, y + 54, 58)

  context.fillStyle = '#ffffff'
  context.font = '800 28px Inter, sans-serif'
  context.fillText(fitText(context, row.team?.name ?? 'Pendiente', width - 140), x + 100, y + 88)

  context.fillStyle = 'rgba(226,232,240,0.68)'
  context.font = '700 18px Inter, sans-serif'
  context.fillText(getTeamTokenLabel(row.team), x + 100, y + 118)

  context.fillStyle = '#d8ff84'
  context.font = '800 18px Inter, sans-serif'
  context.fillText(`${row.predicted_points} pts en grupos`, x + 24, y + height - 24)
}

async function drawKnockoutMatchCard(context, match, x, y, width, height) {
  roundRect(context, x, y, width, height, 28)
  context.fillStyle = 'rgba(255,255,255,0.04)'
  context.fill()
  context.strokeStyle = 'rgba(167,243,208,0.14)'
  context.lineWidth = 2
  context.stroke()

  context.fillStyle = 'rgba(226,232,240,0.68)'
  context.font = '800 14px Inter, sans-serif'
  context.fillText(match.match_code.replace('_', ' '), x + 22, y + 30)

  const teams = [match.homeTeam, match.awayTeam]
  for (let index = 0; index < teams.length; index += 1) {
    const team = teams[index]
    const isWinner = team?.id && match.winnerTeamId === team.id
    const teamY = y + 52 + index * 52

    roundRect(context, x + 16, teamY, width - 32, 40, 18)
    context.fillStyle = isWinner ? 'rgba(163,230,53,0.14)' : 'rgba(255,255,255,0.04)'
    context.fill()

    if (team) {
      await drawOrb(context, team, x + 24, teamY + 4, 32)
      context.fillStyle = '#ffffff'
      context.font = '800 16px Inter, sans-serif'
      context.fillText(fitText(context, team.name, width - 130), x + 66, teamY + 24)
      context.fillStyle = 'rgba(226,232,240,0.62)'
      context.font = '700 14px Inter, sans-serif'
      context.fillText(getTeamTokenLabel(team), x + 66, teamY + 38)
    } else {
      context.fillStyle = 'rgba(226,232,240,0.62)'
      context.font = '700 15px Inter, sans-serif'
      context.fillText('Esperando clasificado', x + 24, teamY + 25)
    }
  }
}

export async function buildPredictionShareBlob({
  section,
  round,
  displayName,
  groupRows = [],
  qualifiedThirdRows = [],
  knockoutMatches = [],
}) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No fue posible generar la imagen.')

  let height = 1400
  let title = 'Resumen'
  let subtitle = 'El Mundialito'

  const groupSummaries = buildGroupSummaries(groupRows)
  const groupedKnockout = getMatchesByRound(knockoutMatches)

  if (section === 'groups') {
    title = 'Fase de grupos'
    subtitle = 'Tus doce grupos ordenados'
    height = 430 + Math.ceil(groupSummaries.length / 3) * 320
  }

  if (section === 'thirds') {
    title = 'Mejores terceros'
    subtitle = 'Tus clasificados por via extra'
    height = 430 + Math.max(1, Math.ceil(qualifiedThirdRows.length / 2)) * 210
  }

  if (section === 'knockout') {
    const activeRound = round && groupedKnockout[round]?.length ? round : Object.keys(groupedKnockout).find((key) => groupedKnockout[key]?.length)
    title = ROUND_NAMES[activeRound] ?? 'Eliminatorias'
    subtitle = 'Tus cruces elegidos en esta ronda'
    height = 430 + Math.max(1, Math.ceil((groupedKnockout[activeRound] ?? []).length / 2)) * 180
  }

  canvas.width = WIDTH
  canvas.height = height
  context.fillStyle = '#08130e'
  context.fillRect(0, 0, WIDTH, height)
  await drawHeader(context, height, title, subtitle, displayName)

  if (section === 'groups') {
    const cardWidth = (WIDTH - PADDING * 2 - CARD_GAP * 2) / 3
    const cardHeight = 282

    for (let index = 0; index < groupSummaries.length; index += 1) {
      const summary = groupSummaries[index]
      const column = index % 3
      const row = Math.floor(index / 3)
      const x = PADDING + column * (cardWidth + CARD_GAP)
      const y = 390 + row * (cardHeight + CARD_GAP)
      await drawGroupCard(context, summary, x, y, cardWidth, cardHeight)
    }
  }

  if (section === 'thirds') {
    const cardWidth = (WIDTH - PADDING * 2 - CARD_GAP) / 2
    const cardHeight = 164

    for (let index = 0; index < qualifiedThirdRows.length; index += 1) {
      const row = Math.floor(index / 2)
      const column = index % 2
      const x = PADDING + column * (cardWidth + CARD_GAP)
      const y = 390 + row * (cardHeight + CARD_GAP)
      await drawThirdCard(context, qualifiedThirdRows[index], x, y, cardWidth, cardHeight)
    }
  }

  if (section === 'knockout') {
    const activeRound = round && groupedKnockout[round]?.length ? round : Object.keys(groupedKnockout).find((key) => groupedKnockout[key]?.length)
    const matches = groupedKnockout[activeRound] ?? []
    const cardWidth = (WIDTH - PADDING * 2 - CARD_GAP) / 2
    const cardHeight = 142

    for (let index = 0; index < matches.length; index += 1) {
      const row = Math.floor(index / 2)
      const column = index % 2
      const x = PADDING + column * (cardWidth + CARD_GAP)
      const y = 390 + row * (cardHeight + CARD_GAP)
      await drawKnockoutMatchCard(context, matches[index], x, y, cardWidth, cardHeight)
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No fue posible exportar la imagen.'))
        return
      }

      resolve(blob)
    }, 'image/png')
  })
}
