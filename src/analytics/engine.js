// Central analytics engine — all metrics computed here, consumed by sections

export function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }
export function sum(arr) { return arr.reduce((a, b) => a + b, 0) }
export function pct(n, d) { return d > 0 ? (n / d) * 100 : 0 }

// ── League-level KPIs ────────────────────────────────────────────────────────

export function computeLeagueKPIs(matches) {
  if (!matches.length) return {}
  const n = matches.length
  const hWins = matches.filter(m => m.ftr === 'H').length
  const draws = matches.filter(m => m.ftr === 'D').length
  const aWins = matches.filter(m => m.ftr === 'A').length
  return {
    matches: n,
    totalGoals:    sum(matches.map(m => m.totalGoals)),
    goalsPerMatch: avg(matches.map(m => m.totalGoals)),
    homeGoalsPerMatch: avg(matches.map(m => m.fthg)),
    awayGoalsPerMatch: avg(matches.map(m => m.ftag)),
    homeWinPct:  pct(hWins, n),
    drawPct:     pct(draws, n),
    awayWinPct:  pct(aWins, n),
    shotsPerMatch:    avg(matches.map(m => m.totalShots)),
    sotPerMatch:      avg(matches.map(m => m.totalSOT)),
    cornersPerMatch:  avg(matches.map(m => m.totalCorners)),
    foulsPerMatch:    avg(matches.map(m => m.totalFouls)),
    yellowPerMatch:   avg(matches.map(m => m.totalYellow)),
    redPerMatch:      avg(matches.map(m => m.totalRed)),
    firstHalfGoalsPerMatch:  avg(matches.map(m => m.firstHalfGoals)),
    secondHalfGoalsPerMatch: avg(matches.map(m => m.secondHalfGoals)),
    shotConversion: sum(matches.map(m => m.fthg + m.ftag)) / (sum(matches.map(m => m.totalShots)) || 1),
    sotConversion:  sum(matches.map(m => m.fthg + m.ftag)) / (sum(matches.map(m => m.totalSOT)) || 1),
    hWins, draws, aWins,
  }
}

// ── Season table ─────────────────────────────────────────────────────────────

export function buildLeagueTable(matches) {
  const teams = {}
  const ensure = t => {
    if (!teams[t]) teams[t] = { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
  }
  for (const m of matches) {
    ensure(m.homeTeam); ensure(m.awayTeam)
    const h = teams[m.homeTeam], a = teams[m.awayTeam]
    h.p++; a.p++
    h.gf += m.fthg; h.ga += m.ftag
    a.gf += m.ftag; a.ga += m.fthg
    if (m.ftr === 'H') { h.w++; h.pts += 3; a.l++ }
    else if (m.ftr === 'A') { a.w++; a.pts += 3; h.l++ }
    else { h.d++; a.d++; h.pts++; a.pts++ }
  }
  return Object.values(teams)
    .map(t => ({ ...t, gd: t.gf - t.ga, winPct: pct(t.w, t.p), ppg: t.p > 0 ? t.pts / t.p : 0 }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .map((t, i) => ({ ...t, pos: i + 1 }))
}

// ── Title race / season progression ──────────────────────────────────────────

export function buildSeasonProgression(matches) {
  // Returns: matchdayData[] where each entry has { matchday, standings: {team: {pts, pos, gd, gf, ga}} }
  const sorted = [...matches].sort((a, b) => a.matchday - b.matchday || a.date - b.date)
  const maxMD = Math.max(...sorted.map(m => m.matchday), 0)
  const teams = {}
  const ensure = t => { if (!teams[t]) teams[t] = { pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, p: 0 } }

  const timeline = []
  let mdPointer = 0

  for (let md = 1; md <= maxMD; md++) {
    const mdMatches = sorted.filter(m => m.matchday === md)
    for (const m of mdMatches) {
      ensure(m.homeTeam); ensure(m.awayTeam)
      const h = teams[m.homeTeam], a = teams[m.awayTeam]
      h.p++; a.p++
      h.gf += m.fthg; h.ga += m.ftag
      a.gf += m.ftag; a.ga += m.fthg
      if (m.ftr === 'H') { h.w++; h.pts += 3; a.l++ }
      else if (m.ftr === 'A') { a.w++; a.pts += 3; h.l++ }
      else { h.d++; a.d++; h.pts++; a.pts++ }
    }
    const snapshot = Object.entries(teams)
      .map(([team, s]) => ({ team, ...s, gd: s.gf - s.ga }))
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .map((t, i) => ({ ...t, pos: i + 1 }))
    timeline.push({ matchday: md, standings: snapshot, matchCount: mdMatches.length })
  }
  return timeline
}

// ── Team analytics ────────────────────────────────────────────────────────────

export function teamMatches(matches, team) {
  return matches.filter(m => m.homeTeam === team || m.awayTeam === team)
}

export function teamResultFor(match, team) {
  const isHome = match.homeTeam === team
  if (match.ftr === 'D') return 'D'
  if ((match.ftr === 'H') === isHome) return 'W'
  return 'L'
}

export function computeTeamStats(matches, team) {
  const tm = teamMatches(matches, team)
  if (!tm.length) return null
  let w = 0, d = 0, l = 0, gf = 0, ga = 0, pts = 0
  let homeW = 0, homeD = 0, homeL = 0, homeGF = 0, homeGA = 0
  let awayW = 0, awayD = 0, awayL = 0, awayGF = 0, awayGA = 0
  let shots = 0, ast = 0, sot = 0, asot = 0, corners = 0, aCorners = 0
  let fouls = 0, aFouls = 0, yellow = 0, red = 0

  for (const m of tm) {
    const isHome = m.homeTeam === team
    const res = teamResultFor(m, team)
    const myGF = isHome ? m.fthg : m.ftag
    const myGA = isHome ? m.ftag : m.fthg
    gf += myGF; ga += myGA
    if (res === 'W') { w++; pts += 3 } else if (res === 'D') { d++; pts++ } else l++
    const myShots = isHome ? m.hs : m.as
    const opShots = isHome ? m.as : m.hs
    const mySOT   = isHome ? m.hst : m.ast
    const opSOT   = isHome ? m.ast : m.hst
    const myCorners = isHome ? m.hc : m.ac
    const opCorners = isHome ? m.ac : m.hc
    const myFouls = isHome ? m.hf : m.af
    const opFouls = isHome ? m.af : m.hf
    const myY = isHome ? m.hy : m.ay
    const myR = isHome ? m.hr : m.ar
    shots += myShots; ast += opShots; sot += mySOT; asot += opSOT
    corners += myCorners; aCorners += opCorners
    fouls += myFouls; aFouls += opFouls
    yellow += myY; red += myR
    if (isHome) {
      const r = res === 'W' ? homeW++ : res === 'D' ? homeD++ : homeL++
      homeGF += myGF; homeGA += myGA
    } else {
      const r = res === 'W' ? awayW++ : res === 'D' ? awayD++ : awayL++
      awayGF += myGF; awayGA += myGA
    }
  }
  const n = tm.length
  const homeMatches = tm.filter(m => m.homeTeam === team).length
  const awayMatches = tm.filter(m => m.awayTeam === team).length
  return {
    team, matches: n, w, d, l, gf, ga, gd: gf - ga, pts,
    winPct: pct(w, n), drawPct: pct(d, n), lossPct: pct(l, n), ppg: n > 0 ? pts / n : 0,
    homeMatches, awayMatches,
    homeW, homeD, homeL, homeGF, homeGA,
    awayW, awayD, awayL, awayGF, awayGA,
    homePPG: homeMatches > 0 ? (homeW * 3 + homeD) / homeMatches : 0,
    awayPPG: awayMatches > 0 ? (awayW * 3 + awayD) / awayMatches : 0,
    homeAdvantage: homeMatches > 0 && awayMatches > 0
      ? ((homeW * 3 + homeD) / homeMatches) - ((awayW * 3 + awayD) / awayMatches) : 0,
    shotsPerMatch:   shots / n, sotPerMatch: sot / n,
    shotConv: shots > 0 ? gf / shots : 0,
    sotConv:  sot > 0  ? gf / sot  : 0,
    cornersPerMatch: corners / n, foulsPerMatch: fouls / n,
    yellowPerMatch: yellow / n, redPerMatch: red / n,
    cleanSheets: tm.filter(m => (m.homeTeam === team ? m.ftag : m.fthg) === 0).length,
  }
}

// ── Season-by-season team record ─────────────────────────────────────────────

export function teamSeasonRecords(matches, team, allSeasons) {
  return allSeasons.map(season => {
    const sm = matches.filter(m => m.season === season && (m.homeTeam === team || m.awayTeam === team))
    if (!sm.length) return null
    const table = buildLeagueTable(matches.filter(m => m.season === season))
    const row = table.find(r => r.team === team)
    return { season, ...computeTeamStats(sm, team), pos: row?.pos ?? null }
  }).filter(Boolean)
}

// ── H2H ──────────────────────────────────────────────────────────────────────

export function computeH2H(matches, teamA, teamB) {
  const h2h = matches.filter(m =>
    (m.homeTeam === teamA && m.awayTeam === teamB) ||
    (m.homeTeam === teamB && m.awayTeam === teamA)
  )
  if (!h2h.length) return null
  const aWins = h2h.filter(m => teamResultFor(m, teamA) === 'W').length
  const bWins = h2h.filter(m => teamResultFor(m, teamB) === 'W').length
  const draws = h2h.filter(m => m.ftr === 'D').length
  return {
    total: h2h.length, aWins, bWins, draws,
    aHome: h2h.filter(m => m.homeTeam === teamA),
    bHome: h2h.filter(m => m.homeTeam === teamB),
    matches: h2h.sort((a, b) => a.date - b.date),
    avgGoals: avg(h2h.map(m => m.totalGoals)),
  }
}

// ── Referee analytics ─────────────────────────────────────────────────────────

export function computeRefereeStats(matches) {
  const refs = {}
  for (const m of matches) {
    const r = m.referee || 'Unknown'
    if (!refs[r]) refs[r] = { referee: r, matches: 0, hWins: 0, draws: 0, aWins: 0,
      fouls: 0, yellow: 0, red: 0, homeYellow: 0, awayYellow: 0, homeRed: 0, awayRed: 0,
      homeFouls: 0, awayFouls: 0 }
    const s = refs[r]
    s.matches++
    if (m.ftr === 'H') s.hWins++ ; else if (m.ftr === 'D') s.draws++ ; else s.aWins++
    s.fouls      += m.totalFouls; s.homeFouls += m.hf; s.awayFouls += m.af
    s.yellow     += m.totalYellow; s.homeYellow += m.hy; s.awayYellow += m.ay
    s.red        += m.totalRed;   s.homeRed += m.hr;  s.awayRed  += m.ar
  }
  return Object.values(refs).map(r => ({
    ...r,
    avgFouls:   r.fouls  / r.matches,
    avgYellow:  r.yellow / r.matches,
    avgRed:     r.red    / r.matches,
    homeWinPct: pct(r.hWins, r.matches),
    drawPct:    pct(r.draws, r.matches),
    awayWinPct: pct(r.aWins, r.matches),
    cardBias:   r.matches > 0 ? (r.homeYellow - r.awayYellow) / r.matches : 0,
  })).sort((a, b) => b.matches - a.matches)
}

// ── HT→FT transition matrix ───────────────────────────────────────────────────

export function computeHTFTMatrix(matches) {
  const states = [
    'Home Conversion','Home Partial Collapse','Home Collapse',
    'Away Conversion','Away Partial Collapse','Away Collapse',
    'HT Draw → Home Win','HT Draw → Draw','HT Draw → Away Win',
  ]
  const counts = {}
  states.forEach(s => { counts[s] = 0 })
  for (const m of matches) { if (counts[m.htftState] !== undefined) counts[m.htftState]++ }
  const n = matches.length
  return states.map(s => ({ state: s, count: counts[s], pct: pct(counts[s], n) }))
}

// ── Era comparison ────────────────────────────────────────────────────────────

export const ERAS = [
  { label: '2000–05', seasons: ['2000/01','2001/02','2002/03','2003/04','2004/05'] },
  { label: '2005–10', seasons: ['2005/06','2006/07','2007/08','2008/09','2009/10'] },
  { label: '2010–15', seasons: ['2010/11','2011/12','2012/13','2013/14','2014/15'] },
  { label: '2015–20', seasons: ['2015/16','2016/17','2017/18','2018/19','2019/20'] },
  { label: '2020–26', seasons: ['2020/21','2021/22','2022/23','2023/24','2024/25','2025/26'] },
]

export function eraStats(matches) {
  return ERAS.map(era => {
    const em = matches.filter(m => era.seasons.includes(m.season))
    return { era: era.label, ...computeLeagueKPIs(em) }
  })
}

// ── Relegation zone helpers ───────────────────────────────────────────────────

export function relegationHistory(matches, allSeasons) {
  return allSeasons.map(season => {
    const sm = matches.filter(m => m.season === season)
    const table = buildLeagueTable(sm)
    const bottom3 = table.slice(-3)
    const pos17 = table[16]
    return { season, bottom3, pos17, table }
  })
}

// ── Scoreline distribution ────────────────────────────────────────────────────

export function scorlineDistribution(matches) {
  const dist = {}
  for (const m of matches) {
    const key = `${m.fthg}-${m.ftag}`
    dist[key] = (dist[key] || 0) + 1
  }
  return Object.entries(dist)
    .map(([score, count]) => {
      const [h, a] = score.split('-').map(Number)
      return { score, h, a, count, totalGoals: h + a }
    })
    .sort((a, b) => b.count - a.count)
}

// ── Shot-win correlation ──────────────────────────────────────────────────────

export function shotWinCorrelation(matches) {
  return matches.map(m => ({
    homeWonShotBattle: m.hs > m.as,
    homeSOTBattle:     m.hst > m.ast,
    homeWon:           m.ftr === 'H',
    drawn:             m.ftr === 'D',
    awayWon:           m.ftr === 'A',
  }))
}

// ── Team season performance for ranking ───────────────────────────────────────

export function allTeamSeasonStats(matches, allSeasons, allTeams) {
  const result = []
  for (const team of allTeams) {
    for (const season of allSeasons) {
      const sm = matches.filter(m => m.season === season && (m.homeTeam === team || m.awayTeam === team))
      if (!sm.length) continue
      const table = buildLeagueTable(matches.filter(m => m.season === season))
      const row = table.find(r => r.team === team)
      const stats = computeTeamStats(sm, team)
      result.push({ ...stats, season, pos: row?.pos ?? null })
    }
  }
  return result
}
