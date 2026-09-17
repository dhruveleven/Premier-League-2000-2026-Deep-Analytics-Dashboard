import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis
} from 'recharts'
import { useData } from '../../data/DataContext'
import { computeTeamStats, teamMatches as getTeamMatches, pct } from '../../analytics/engine'
import { SectionHeader, Select, Panel, KPI, DataTable, CustomTooltip, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

const ALL = 'All Seasons'

const RANK_OPTIONS = [
  { value: 'pts',          label: 'Points'          },
  { value: 'ppg',          label: 'Points per Match' },
  { value: 'winPct',       label: 'Win %'            },
  { value: 'gd',           label: 'Goal Difference'  },
  { value: 'gf',           label: 'Goals Scored'     },
  { value: 'ga',           label: 'Goals Conceded'   },
  { value: 'shotsPerMatch',label: 'Shots/Match'      },
  { value: 'sotPerMatch',  label: 'SOT/Match'        },
  { value: 'shotConv',     label: 'Shot Conversion'  },
  { value: 'sotConv',      label: 'SOT Conversion'   },
  { value: 'cornersPerMatch', label: 'Corners/Match' },
  { value: 'foulsPerMatch',   label: 'Fouls/Match'   },
  { value: 'yellowPerMatch',  label: 'Yellow/Match'  },
  { value: 'cleanSheets',     label: 'Clean Sheets'  },
]

// ── Section 15: Team Rankings ─────────────────────────────────────────────────
export function TeamRankings() {
  const { matches, allSeasons, allTeams } = useData()
  const [season, setSeason] = useState(ALL)
  const [rankBy, setRankBy] = useState('ppg')
  const [ascending, setAscending] = useState(false)

  const filtered = useMemo(() =>
    season === ALL ? matches : matches.filter(m => m.season === season),
    [matches, season])

  const teamData = useMemo(() =>
    allTeams.map(t => {
      const tm = getTeamMatches(filtered, t)
      if (tm.length < 3) return null
      return computeTeamStats(tm, t)
    }).filter(Boolean),
    [filtered, allTeams])

  const sorted = useMemo(() => {
    const desc = ['ga', 'foulsPerMatch', 'yellowPerMatch', 'redPerMatch'].includes(rankBy)
    const dir = (desc ? !ascending : ascending) ? 1 : -1
    return [...teamData].sort((a, b) => ((a[rankBy] || 0) - (b[rankBy] || 0)) * dir)
  }, [teamData, rankBy, ascending])

  const top20 = sorted.slice(0, 20)

  const rankColumns = [
    { key: '_rank',         label: '#',       width: 40,  render: (_, __, idx) => idx + 1 },
    { key: 'team',          label: 'Club',    width: 160 },
    { key: 'matches',       label: 'Matches', width: 70  },
    { key: 'pts',           label: 'Pts',     width: 60,  render: v => <span className="font-bold">{v}</span> },
    { key: 'ppg',           label: 'PPG',     width: 60,  render: v => v.toFixed(2) },
    { key: 'winPct',        label: 'Win %',   width: 70,  render: v => `${v.toFixed(1)}%` },
    { key: 'gf',            label: 'GF',      width: 50 },
    { key: 'ga',            label: 'GA',      width: 50 },
    { key: 'gd',            label: 'GD',      width: 55, render: v => <span className={v >= 0 ? 'text-pl-green' : 'text-red-400'}>{v > 0 ? '+' : ''}{v}</span> },
    { key: 'shotsPerMatch', label: 'Shots/M', width: 80, render: v => v.toFixed(2) },
    { key: 'sotPerMatch',   label: 'SOT/M',   width: 75, render: v => v.toFixed(2) },
    { key: 'shotConv',      label: 'Conv',    width: 65, render: v => `${(v*100).toFixed(1)}%` },
    { key: 'cleanSheets',   label: 'CS',      width: 50 },
  ]

  // Add rank index to data for column rendering
  const rankedData = sorted.map((d, i) => ({ ...d, _rank: i + 1 }))

  return (
    <div>
      <SectionHeader
        title="Team Rankings"
        subtitle="Flexible team ranking across all metrics. Compare teams on performance, attack, defence, and discipline. Normalised per-match metrics allow fair comparison across different match counts."
      />
      <div className="flex flex-wrap gap-3 mb-5 p-4 bg-surface-raised border border-surface-border rounded-lg">
        <Select label="Period" value={season} onChange={setSeason}
          options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]} />
        <Select label="Rank By" value={rankBy} onChange={setRankBy} options={RANK_OPTIONS}/>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Order</span>
          <button onClick={() => setAscending(a => !a)} className="filter-select text-left">
            {ascending ? '▲ Ascending' : '▼ Descending'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Panel title={`Top 20 by ${RANK_OPTIONS.find(o => o.value === rankBy)?.label}`}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top20} layout="vertical" margin={{ left: 5, right: 30 }}>
              <CartesianGrid {...GRID_PROPS} horizontal={false} vertical/>
              <XAxis type="number" {...AXIS_PROPS}/>
              <YAxis dataKey="team" type="category" {...AXIS_PROPS} width={130} tick={{ fontSize: 10, fill: '#9ca3af' }}/>
              <Tooltip content={<CustomTooltip formatter={v => typeof v === 'number' ? v.toFixed(2) : v}/>}/>
              <Bar dataKey={rankBy} fill={COLORS.green} radius={[0,3,3,0]} maxBarSize={16}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Full Rankings Table">
          <DataTable columns={rankColumns} data={rankedData}/>
        </Panel>
      </div>
    </div>
  )
}

// ── Section 16: Performance Matrix ────────────────────────────────────────────
const SCATTER_OPTIONS = [
  { id: 'attack_defence',   label: 'Attack vs Defence',   xKey: 'gf', xLabel: 'Goals Scored', yKey: 'ga', yLabel: 'Goals Conceded', invertY: true },
  { id: 'shots_conversion', label: 'Shots vs Conversion', xKey: 'shotsPerMatch', xLabel: 'Shots/Match', yKey: 'shotConv', yLabel: 'Shot Conversion' },
  { id: 'home_away',        label: 'Home vs Away PPG',    xKey: 'homePPG', xLabel: 'Home PPG', yKey: 'awayPPG', yLabel: 'Away PPG' },
  { id: 'ppg_vs_shots',     label: 'PPG vs Shot Volume',  xKey: 'shotsPerMatch', xLabel: 'Shots/Match', yKey: 'ppg', yLabel: 'PPG' },
]

const MATRIX_COLUMNS = [
  { key: 'team',          label: 'Club',         width: 150 },
  { key: 'ppg',           label: 'PPG',          width: 60,  render: v => v.toFixed(2) },
  { key: 'winPct',        label: 'Win %',        width: 65,  render: v => `${v.toFixed(1)}%` },
  { key: 'gf',            label: 'GF',           width: 50 },
  { key: 'ga',            label: 'GA',           width: 50 },
  { key: 'gd',            label: 'GD',           width: 55,  render: v => <span className={v >= 0 ? 'text-pl-green' : 'text-red-400'}>{v > 0 ? '+' : ''}{v}</span> },
  { key: 'shotsPerMatch', label: 'Shots/M',      width: 80,  render: v => v.toFixed(2) },
  { key: 'sotPerMatch',   label: 'SOT/M',        width: 75,  render: v => v.toFixed(2) },
  { key: 'shotConv',      label: 'Shot Conv.',   width: 85,  render: v => `${(v*100).toFixed(1)}%` },
  { key: 'cornersPerMatch',label: 'CK/M',        width: 65,  render: v => v.toFixed(2) },
  { key: 'foulsPerMatch', label: 'Foul/M',       width: 70,  render: v => v.toFixed(2) },
  { key: 'yellowPerMatch',label: 'Y/M',          width: 60,  render: v => v.toFixed(2) },
  { key: 'homePPG',       label: 'Home PPG',     width: 80,  render: v => v.toFixed(2) },
  { key: 'awayPPG',       label: 'Away PPG',     width: 80,  render: v => v.toFixed(2) },
  { key: 'cleanSheets',   label: 'CS',           width: 50 },
  { key: 'matches',       label: 'Matches',      width: 70 },
]

export function PerformanceMatrix() {
  const { matches, allSeasons, allTeams } = useData()
  const [season, setSeason] = useState(ALL)
  const [scatterMode, setScatterMode] = useState('attack_defence')

  const filtered = useMemo(() =>
    season === ALL ? matches : matches.filter(m => m.season === season),
    [matches, season])

  const teamData = useMemo(() =>
    allTeams.map(t => {
      const tm = getTeamMatches(filtered, t)
      if (tm.length < 5) return null
      return computeTeamStats(tm, t)
    }).filter(Boolean),
    [filtered, allTeams])

  const mode = SCATTER_OPTIONS.find(o => o.id === scatterMode) || SCATTER_OPTIONS[0]

  return (
    <div>
      <SectionHeader
        title="Performance Matrix"
        subtitle="Multi-dimensional team comparison — full stats table plus scatter views to identify outlier teams and unusual performance profiles."
        right={<Select label="Period" value={season} onChange={setSeason} options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]} />}
      />

      {/* Scatter view */}
      <Panel className="mb-5">
        <div className="flex gap-3 mb-4 flex-wrap">
          <span className="text-xs font-mono text-gray-400 self-center">Matrix view:</span>
          {SCATTER_OPTIONS.map(o => (
            <button key={o.id} onClick={() => setScatterMode(o.id)}
              className={`btn text-xs py-1 ${scatterMode === o.id ? 'btn-primary' : 'btn-secondary'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 10 }}>
            <CartesianGrid {...GRID_PROPS}/>
            <XAxis dataKey={mode.xKey} name={mode.xLabel} {...AXIS_PROPS}
              label={{ value: mode.xLabel, position: 'insideBottom', offset: -10, fill: '#6b7280', fontSize: 11 }}/>
            <YAxis dataKey={mode.yKey} name={mode.yLabel} {...AXIS_PROPS} reversed={mode.invertY}
              label={{ value: mode.yLabel, angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}/>
            <ZAxis range={[50, 50]}/>
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="custom-tooltip">
                  <div className="text-pl-green font-semibold text-sm mb-1">{d.team}</div>
                  <div className="text-xs text-gray-300">{mode.xLabel}: {typeof d[mode.xKey] === 'number' ? d[mode.xKey].toFixed(2) : d[mode.xKey]}</div>
                  <div className="text-xs text-gray-300">{mode.yLabel}: {typeof d[mode.yKey] === 'number' ? d[mode.yKey].toFixed(2) : d[mode.yKey]}</div>
                  <div className="text-xs text-gray-500 mt-1">{d.matches} matches · {d.ppg.toFixed(2)} PPG</div>
                </div>
              )
            }}/>
            <Scatter data={teamData} fill={COLORS.green} fillOpacity={0.75}/>
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-xs font-mono text-gray-600 mt-1">
          {mode.id === 'attack_defence' && 'Top-right: high scoring but leaky. Bottom-left: solid defence, limited attack. Bottom-right: best balance (high goals, low conceded). Y-axis inverted — lower is better for GA.'}
          {mode.id === 'shots_conversion' && 'High shots + high conversion = most dangerous. High shots + low conversion = volume shooting without efficiency.'}
          {mode.id === 'home_away' && 'Teams above the diagonal perform better at home than away. Teams below perform better away — unusual and worth investigating.'}
        </p>
      </Panel>

      {/* Full matrix table */}
      <Panel title="Full Performance Matrix">
        <DataTable columns={MATRIX_COLUMNS} data={teamData}/>
      </Panel>
    </div>
  )
}
