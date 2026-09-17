import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts'
import { useData } from '../../data/DataContext'
import { computeHTFTMatrix, computeLeagueKPIs, pct, avg } from '../../analytics/engine'
import { SectionHeader, Select, Panel, KPI, DataTable, CustomTooltip, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

const ALL = 'All Seasons'

function teamHTFTStats(matches, team) {
  const tm = matches.filter(m => m.homeTeam === team || m.awayTeam === team)
  if (!tm.length) return null
  let leading = 0, leadWin = 0, leadDraw = 0, leadLoss = 0
  let trailing = 0, trailWin = 0, trailDraw = 0, trailLoss = 0
  let level = 0, levelWin = 0, levelDraw = 0, levelLoss = 0

  for (const m of tm) {
    const isHome = m.homeTeam === team
    const htG = isHome ? m.hthg : m.htag
    const htA = isHome ? m.htag : m.hthg
    const ftG = isHome ? m.fthg : m.ftag
    const ftA = isHome ? m.ftag : m.fthg
    const ftRes = ftG > ftA ? 'W' : ftG < ftA ? 'L' : 'D'

    if (htG > htA) {
      leading++
      if (ftRes === 'W') leadWin++ ; else if (ftRes === 'D') leadDraw++ ; else leadLoss++
    } else if (htG < htA) {
      trailing++
      if (ftRes === 'W') trailWin++ ; else if (ftRes === 'D') trailDraw++ ; else trailLoss++
    } else {
      level++
      if (ftRes === 'W') levelWin++ ; else if (ftRes === 'D') levelDraw++ ; else levelLoss++
    }
  }
  return {
    team, total: tm.length,
    leadConvRate:    leading > 0 ? (leadWin / leading) * 100 : 0,
    collapseRate:    leading > 0 ? (leadLoss / leading) * 100 : 0,
    comebackRate:    trailing > 0 ? (trailWin / trailing) * 100 : 0,
    leadingGames: leading, trailingGames: trailing, levelGames: level,
    leadWin, leadDraw, leadLoss,
    trailWin, trailDraw, trailLoss,
    levelWin, levelDraw, levelLoss,
  }
}

export default function HTFTAnalysis() {
  const { matches, allSeasons, allTeams } = useData()
  const [season, setSeason] = useState(ALL)
  const [team, setTeam] = useState(allTeams[0] || '')

  const filtered = useMemo(() =>
    season === ALL ? matches : matches.filter(m => m.season === season),
    [matches, season])

  const matrix = useMemo(() => computeHTFTMatrix(filtered), [filtered])

  const teamStats = useMemo(() => teamHTFTStats(filtered, team), [filtered, team])

  const allTeamStats = useMemo(() =>
    allTeams.map(t => teamHTFTStats(filtered, t)).filter(Boolean),
    [filtered, allTeams])

  // Group matrix into logical categories
  const groups = {
    'Home Lead → Win':   matrix.find(m => m.state === 'Home Conversion'),
    'Home Lead → Draw':  matrix.find(m => m.state === 'Home Partial Collapse'),
    'Home Lead → Loss':  matrix.find(m => m.state === 'Home Collapse'),
    'Away Lead → Win':   matrix.find(m => m.state === 'Away Conversion'),
    'Away Lead → Draw':  matrix.find(m => m.state === 'Away Partial Collapse'),
    'Away Lead → Loss':  matrix.find(m => m.state === 'Away Collapse'),
    'Draw HT → Home Win':matrix.find(m => m.state === 'HT Draw → Home Win'),
    'Draw HT → Draw':    matrix.find(m => m.state === 'HT Draw → Draw'),
    'Draw HT → Away Win':matrix.find(m => m.state === 'HT Draw → Away Win'),
  }

  // Season trends
  const trendData = useMemo(() => allSeasons.map(s => {
    const sm = matches.filter(m => m.season === s)
    const mx = computeHTFTMatrix(sm)
    const get = state => mx.find(m => m.state === state)?.pct || 0
    return {
      season: s,
      conv:   (get('Home Conversion') + get('Away Conversion')) / 2,
      collapse: (get('Home Collapse') + get('Away Collapse')) / 2,
      comeback: (get('Away Collapse') + get('Home Collapse')) / 2,
    }
  }), [matches, allSeasons])

  // Rankings
  const comebackLeaders = [...allTeamStats].sort((a, b) => b.comebackRate - a.comebackRate).slice(0, 10)
  const collapseWorse   = [...allTeamStats].sort((a, b) => b.collapseRate  - a.collapseRate).slice(0, 10)
  const convBest        = [...allTeamStats].sort((a, b) => b.leadConvRate  - a.leadConvRate).slice(0, 10)

  const matrixColumns = [
    { key: 'state', label: 'HT → FT Transition', width: 220 },
    { key: 'count', label: 'Count', width: 80 },
    { key: 'pct',   label: '% of All Matches', width: 130, render: v => `${v.toFixed(1)}%` },
  ]

  const rankColumns = (cols) => [
    { key: 'team', label: 'Team', width: 160 },
    ...cols,
    { key: 'total', label: 'Matches', width: 80 },
  ]

  return (
    <div>
      <SectionHeader
        title="Half-Time → Full-Time"
        subtitle="How often do teams hold leads, stage comebacks, or collapse? League-wide transition matrix and team-level breakdown."
      />

      <div className="flex flex-wrap gap-3 mb-5 p-4 bg-surface-raised border border-surface-border rounded-lg">
        <Select label="Period" value={season} onChange={setSeason}
          options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]} />
        <Select label="Team" value={team} onChange={setTeam}
          options={allTeams.map(t => ({ value: t, label: t }))} />
      </div>

      {/* Visual transition matrix */}
      <Panel title="Transition Matrix" className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-surface-border mb-2">
          {/* Header */}
          <div className="bg-surface-raised p-2 text-xs font-mono text-gray-500 text-center">HT State</div>
          <div className="bg-surface-raised p-2 text-xs font-mono text-center text-gray-400">Full-Time Result</div>
          <div className="bg-surface-raised p-2"></div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {[
            { ht: 'Home Leading', states: ['Home Conversion','Home Partial Collapse','Home Collapse'], labels: ['Home Win','Draw','Away Win'], colors: [COLORS.green, '#6b7280', COLORS.red] },
            { ht: 'Away Leading', states: ['Away Conversion','Away Partial Collapse','Away Collapse'],  labels: ['Away Win','Draw','Home Win'], colors: [COLORS.sky, '#6b7280', COLORS.red] },
            { ht: 'Level (Draw)', states: ['HT Draw → Home Win','HT Draw → Draw','HT Draw → Away Win'], labels: ['Home Win','Draw','Away Win'], colors: [COLORS.green, '#6b7280', COLORS.sky] },
          ].map(row => {
            const total = row.states.reduce((a, s) => a + (matrix.find(m => m.state === s)?.count || 0), 0)
            return (
              <div key={row.ht} className="htft-matrix-row flex items-center gap-3">
                <div className="htft-matrix-label text-xs font-mono text-gray-400 w-28 shrink-0">{row.ht}</div>
                <div className="htft-matrix-bar flex-1 h-8 bg-surface-muted rounded overflow-hidden flex">
                  {row.states.map((s, i) => {
                    const entry = matrix.find(m => m.state === s)
                    const w = total > 0 ? (entry?.count || 0) / total * 100 : 0
                    return (
                      <div key={s} className="h-full flex items-center justify-center text-xs font-mono"
                           style={{ width: `${w}%`, background: row.colors[i] + '55', borderRight: '1px solid #1D0024', minWidth: w > 5 ? 0 : 0 }}
                           title={`${s}: ${(entry?.pct || 0).toFixed(1)}%`}>
                        {w > 8 && <span style={{ color: row.colors[i] }}>{w.toFixed(0)}%</span>}
                      </div>
                    )
                  })}
                </div>
                <div className="htft-matrix-results flex gap-2 text-xs font-mono shrink-0">
                  {row.labels.map((l, i) => {
                    const entry = matrix.find(m => m.state === row.states[i])
                    return (
                      <span key={l} style={{ color: row.colors[i] }}>{l}: {entry?.count || 0}</span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Full matrix table */}
        <Panel title="Full Transition Table">
          <DataTable columns={matrixColumns} data={matrix}/>
        </Panel>

        {/* Team breakdown */}
        <Panel title={`${team} — HT→FT Profile`}>
          {teamStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="panel text-center">
                  <div className="font-display text-2xl font-bold text-pl-green">{teamStats.leadConvRate.toFixed(1)}%</div>
                  <div className="text-xs font-mono text-gray-400">Lead Conversion</div>
                  <div className="text-xs font-mono text-gray-600">{teamStats.leadingGames} games</div>
                </div>
                <div className="panel text-center">
                  <div className="font-display text-2xl font-bold text-red-400">{teamStats.collapseRate.toFixed(1)}%</div>
                  <div className="text-xs font-mono text-gray-400">Collapse Rate</div>
                  <div className="text-xs font-mono text-gray-600">{teamStats.leadingGames} games</div>
                </div>
                <div className="panel text-center">
                  <div className="font-display text-2xl font-bold text-pl-sky">{teamStats.comebackRate.toFixed(1)}%</div>
                  <div className="text-xs font-mono text-gray-400">Comeback Rate</div>
                  <div className="text-xs font-mono text-gray-600">{teamStats.trailingGames} games</div>
                </div>
              </div>
              <div className="text-xs font-mono text-gray-500">
                <p>When leading at HT: {teamStats.leadWin}W / {teamStats.leadDraw}D / {teamStats.leadLoss}L</p>
                <p>When trailing at HT: {teamStats.trailWin}W / {teamStats.trailDraw}D / {teamStats.trailLoss}L</p>
                <p>When level at HT: {teamStats.levelWin}W / {teamStats.levelDraw}D / {teamStats.levelLoss}L</p>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <Panel title="Best Comeback Teams">
          {comebackLeaders.map((t, i) => (
            <div key={t.team} className="flex items-center gap-2 py-1.5 border-b border-surface-border/30 last:border-0">
              <span className="text-xs font-mono text-gray-600 w-4">{i+1}</span>
              <span className="text-xs font-mono flex-1 truncate">{t.team}</span>
              <span className="text-xs font-bold text-pl-sky">{t.comebackRate.toFixed(1)}%</span>
              <span className="text-xs font-mono text-gray-600">({t.trailingGames})</span>
            </div>
          ))}
        </Panel>
        <Panel title="Best Lead Converters">
          {convBest.map((t, i) => (
            <div key={t.team} className="flex items-center gap-2 py-1.5 border-b border-surface-border/30 last:border-0">
              <span className="text-xs font-mono text-gray-600 w-4">{i+1}</span>
              <span className="text-xs font-mono flex-1 truncate">{t.team}</span>
              <span className="text-xs font-bold text-pl-green">{t.leadConvRate.toFixed(1)}%</span>
              <span className="text-xs font-mono text-gray-600">({t.leadingGames})</span>
            </div>
          ))}
        </Panel>
        <Panel title="Most Collapse-Prone">
          {collapseWorse.map((t, i) => (
            <div key={t.team} className="flex items-center gap-2 py-1.5 border-b border-surface-border/30 last:border-0">
              <span className="text-xs font-mono text-gray-600 w-4">{i+1}</span>
              <span className="text-xs font-mono flex-1 truncate">{t.team}</span>
              <span className="text-xs font-bold text-red-400">{t.collapseRate.toFixed(1)}%</span>
              <span className="text-xs font-mono text-gray-600">({t.leadingGames})</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}
