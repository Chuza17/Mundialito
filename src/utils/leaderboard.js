function getProfileLabel(profile = {}) {
  return profile.display_name || profile.username || 'Usuario'
}

export function getLeaderboardLabel(entry) {
  return getProfileLabel(entry?.profiles)
}

function compareLeaderboardEntries(left, right) {
  const leftTotal = Number(left?.total_points ?? 0)
  const rightTotal = Number(right?.total_points ?? 0)
  if (rightTotal !== leftTotal) return rightTotal - leftTotal

  const leftProgress = Number(left?.completion_percentage ?? 0)
  const rightProgress = Number(right?.completion_percentage ?? 0)
  if (rightProgress !== leftProgress) return rightProgress - leftProgress

  const leftCalculatedAt = left?.last_calculated_at ? new Date(left.last_calculated_at).getTime() : 0
  const rightCalculatedAt = right?.last_calculated_at ? new Date(right.last_calculated_at).getTime() : 0
  if (rightCalculatedAt !== leftCalculatedAt) return rightCalculatedAt - leftCalculatedAt

  return getProfileLabel(left?.profiles).localeCompare(getProfileLabel(right?.profiles), 'es', { sensitivity: 'base' })
}

export function buildLeaderboardEntries(profiles = [], scoreRows = []) {
  const scoreByUserId = new Map(
    (scoreRows ?? []).map((row) => [
      row.user_id,
      {
        user_id: row.user_id,
        total_points: Number(row.total_points ?? 0),
        completion_percentage: Number(row.completion_percentage ?? 0),
        last_calculated_at: row.last_calculated_at ?? null,
        match_score_bonus_points: Number(row.match_score_bonus_points ?? 0),
        breakdown: row.breakdown ?? {},
      },
    ])
  )

  return (profiles ?? [])
    .filter((profile) => profile?.role === 'user' && profile?.is_active !== false)
    .map((profile) => {
      const score = scoreByUserId.get(profile.id)

      return {
        user_id: profile.id,
        total_points: Number(score?.total_points ?? 0),
        completion_percentage: Number(score?.completion_percentage ?? 0),
        last_calculated_at: score?.last_calculated_at ?? null,
        match_score_bonus_points: Number(score?.match_score_bonus_points ?? 0),
        breakdown: score?.breakdown ?? {},
        profiles: {
          display_name: profile.display_name ?? null,
          username: profile.username ?? null,
        },
      }
    })
    .sort(compareLeaderboardEntries)
}

export async function fetchLeaderboardEntries(client) {
  const [
    { data: profiles, error: profilesError },
    { data: scoreRows, error: scoresError },
  ] = await Promise.all([
    client.from('profiles').select('id, username, display_name, role, is_active').eq('role', 'user').eq('is_active', true),
    client.from('user_scores').select('user_id, total_points, completion_percentage, last_calculated_at, match_score_bonus_points, breakdown'),
  ])

  if (profilesError) {
    return { data: [], error: profilesError }
  }

  return {
    data: buildLeaderboardEntries(profiles ?? [], scoreRows ?? []),
    error: scoresError ?? null,
  }
}

export function getLeaderboardSpotlight(entries = [], userId) {
  const currentUserIndex = (entries ?? []).findIndex((entry) => entry.user_id === userId)

  if (currentUserIndex >= 0) {
    return {
      mode: 'current',
      rank: currentUserIndex + 1,
      entry: entries[currentUserIndex],
    }
  }

  if (entries?.length) {
    return {
      mode: 'leader',
      rank: 1,
      entry: entries[0],
    }
  }

  return {
    mode: 'empty',
    rank: null,
    entry: null,
  }
}
