import Papa from 'papaparse'

export const SEASON_FILES = [
  { file: 'season-0001.csv', label: '2000/01' },
  { file: 'season-0102.csv', label: '2001/02' },
  { file: 'season-0203.csv', label: '2002/03' },
  { file: 'season-0304.csv', label: '2003/04' },
  { file: 'season-0405.csv', label: '2004/05' },
  { file: 'season-0506.csv', label: '2005/06' },
  { file: 'season-0607.csv', label: '2006/07' },
  { file: 'season-0708.csv', label: '2007/08' },
  { file: 'season-0809.csv', label: '2008/09' },
  { file: 'season-0910.csv', label: '2009/10' },
  { file: 'season-1011.csv', label: '2010/11' },
  { file: 'season-1112.csv', label: '2011/12' },
  { file: 'season-1213.csv', label: '2012/13' },
  { file: 'season-1314.csv', label: '2013/14' },
  { file: 'season-1415.csv', label: '2014/15' },
  { file: 'season-1516.csv', label: '2015/16' },
  { file: 'season-1617.csv', label: '2016/17' },
  { file: 'season-1718.csv', label: '2017/18' },
  { file: 'season-1819.csv', label: '2018/19' },
  { file: 'season-1920.csv', label: '2019/20' },
  { file: 'season-2021.csv', label: '2020/21' },
  { file: 'season-2122.csv', label: '2021/22' },
  { file: 'season-2223.csv', label: '2022/23' },
  { file: 'season-2324.csv', label: '2023/24' },
  { file: 'season-2425.csv', label: '2024/25' },
  { file: 'season-2526.csv', label: '2025/26' },
]

const TEAM_NAME_MAP = {
  'Man United': 'Manchester Utd',
  'Manchester United': 'Manchester Utd',
  'Man City': 'Manchester City',
  'Spurs': 'Tottenham',
  'Tottenham Hotspur': 'Tottenham',
  'Wolverhampton Wanderers': 'Wolves',
  'Wolverhampton': 'Wolves',
  'West Bromwich Albion': 'West Brom',
  'Sheffield United': 'Sheffield Utd',
  'Queens Park Rangers': 'QPR',
  'Blackburn Rovers': 'Blackburn',
  'Birmingham City': 'Birmingham',
  'Bradford City': 'Bradford',
  'Charlton Athletic': 'Charlton',
  'Wigan Athletic': 'Wigan',
  'Stoke City': 'Stoke',
  'Swansea City': 'Swansea',
  'Cardiff City': 'Cardiff',
  'Hull City': 'Hull',
  'Luton Town': 'Luton',
  'Ipswich Town': 'Ipswich',
  'Nottm Forest': "Nott'm Forest",
  'Nottingham Forest': "Nott'm Forest",
}

function normaliseTeam(name) {
  if (!name) return 'Unknown'
  const t = name.trim()
  return TEAM_NAME_MAP[t] || t
}

function parseDate(str) {
  if (!str) return null
  let m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) {
    let yr = parseInt(m[3], 10)
    if (yr < 100) yr += 2000
    const d = new Date(yr, parseInt(m[2], 10) - 1, parseInt(m[1], 10))
    return isNaN(d.getTime()) ? null : d
  }
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function int(v) {
  if (v === null || v === undefined || v === '') return 0
  const n = parseInt(v, 10)
  return isNaN(n) ? 0 : Math.max(0, n)
}

function deriveHTFTState(htr, ftr) {
  const map = {
    H_H: 'Home Conversion', H_D: 'Home Partial Collapse', H_A: 'Home Collapse',
    A_A: 'Away Conversion', A_D: 'Away Partial Collapse', A_H: 'Away Collapse',
    D_H: 'HT Draw → Home Win', D_D: 'HT Draw → Draw', D_A: 'HT Draw → Away Win',
  }
  return map[`${htr}_${ftr}`] || 'Unknown'
}

function assignMatchdays(matches) {
  const sorted = [...matches].sort((a, b) => a.date - b.date)
  if (!sorted.length) return sorted

  const roundSize = 10
  return sorted.map((match, index) => ({
    ...match,
    matchday: Math.floor(index / roundSize) + 1,
  }))
}

function processSeasonRows(rows, label) {
  const matches = [], errors = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (!r || Object.keys(r).filter(k => r[k]).length < 4) continue
    const home = normaliseTeam(r.HomeTeam || r.Home || r.HT || '')
    const away = normaliseTeam(r.AwayTeam || r.Away || r.AT || '')
    const date = parseDate(r.Date || r.date || '')
    if (!date) { errors.push(`Row ${i}: bad date "${r.Date}"`); continue }
    if (!home || home === 'Unknown') { errors.push(`Row ${i}: missing home`); continue }
    if (!away || away === 'Unknown') { errors.push(`Row ${i}: missing away`); continue }

    const fthg = int(r.FTHG), ftag = int(r.FTAG)
    const hthg = int(r.HTHG), htag = int(r.HTAG)
    const rawFTR = (r.FTR || '').trim().toUpperCase()
    const rawHTR = (r.HTR || '').trim().toUpperCase()
    const computedFTR = fthg > ftag ? 'H' : ftag > fthg ? 'A' : 'D'
    const computedHTR = hthg > htag ? 'H' : htag > hthg ? 'A' : 'D'
    const ftr = ['H','D','A'].includes(rawFTR) ? rawFTR : computedFTR
    const htr = ['H','D','A'].includes(rawHTR) ? rawHTR : computedHTR
    if (rawFTR && rawFTR !== computedFTR) errors.push(`Row ${i}: FTR mismatch (${rawFTR} vs ${computedFTR})`)

    const hs = int(r.HS), as_ = int(r.AS), hst = int(r.HST), ast = int(r.AST)
    const hf = int(r.HF), af = int(r.AF), hc = int(r.HC), ac = int(r.AC)
    const hy = int(r.HY), ay = int(r.AY), hr = int(r.HR), ar = int(r.AR)
    const totalGoals = fthg + ftag
    const firstHalfGoals = hthg + htag

    matches.push({
      season: label, date,
      homeTeam: home, awayTeam: away,
      fthg, ftag, ftr, hthg, htag, htr,
      referee: (r.Referee || r.referee || '').trim(),
      hs, as: as_, hst, ast, hf, af, hc, ac, hy, ay, hr, ar,
      totalGoals, goalDiff: fthg - ftag,
      totalShots: hs + as_, totalSOT: hst + ast,
      totalCorners: hc + ac, totalFouls: hf + af,
      totalYellow: hy + ay, totalRed: hr + ar,
      firstHalfGoals, secondHalfGoals: totalGoals - firstHalfGoals,
      cornerDiff: hc - ac, cardDiff: (hy + hr) - (ay + ar),
      sotPctHome: hs > 0 ? hst / hs : 0,
      sotPctAway: as_ > 0 ? ast / as_ : 0,
      homeConv: hs > 0 ? fthg / hs : 0,
      awayConv: as_ > 0 ? ftag / as_ : 0,
      homeSOTConv: hst > 0 ? fthg / hst : 0,
      awaySOTConv: ast > 0 ? ftag / ast : 0,
      htftState: deriveHTFTState(htr, ftr),
    })
  }
  return { matches, errors }
}

export async function loadAllSeasons(onProgress) {
  const allMatches = [], allErrors = [], seasonsMeta = []
  for (let i = 0; i < SEASON_FILES.length; i++) {
    const { file, label } = SEASON_FILES[i]
    onProgress?.(Math.round((i / SEASON_FILES.length) * 100), label)
    try {
      const res = await fetch(`/data/${file}`)
      if (!res.ok) { allErrors.push(`${label}: file not found`); continue }
      const text = await res.text()
      const { data } = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() })
      const { matches, errors } = processSeasonRows(data, label)
      const withMD = assignMatchdays(matches)
      const maxMatchday = Math.max(...withMD.map(m => m.matchday), 0)
      if (maxMatchday !== 38) {
        allErrors.push(`[${label}] Expected 38 matchdays, got ${maxMatchday}`)
      }
      allErrors.push(...errors.map(e => `[${label}] ${e}`))
      seasonsMeta.push({ label, matchCount: withMD.length, issues: maxMatchday !== 38 ? [`Expected 38 matchdays, got ${maxMatchday}`] : [] })
      allMatches.push(...withMD)
    } catch (err) {
      allErrors.push(`${label}: ${err.message}`)
    }
  }
  onProgress?.(100, 'Done')
  return { matches: allMatches, errors: allErrors, seasonsMeta }
}
