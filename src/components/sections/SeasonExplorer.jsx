import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter
} from 'recharts'
import { useData } from '../../data/DataContext'
import { buildLeagueTable, computeLeagueKPIs, computeTeamStats, teamMatches } from '../../analytics/engine'
import { SectionHeader, Select, Panel, KPI, DataTable, CustomTooltip, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

export default function SeasonExplorer() {
  const { matches, allSeasons } = useData()
  const [season, setSeason] = useState(allSeasons[allSeasons.length - 1] || '')
  const [compareMetric, setCompareMetric] = useState('pts')

  const seasonMatches = useMemo(() =>
    matches.filter(m => m.season === season), [matches, season])

  const table = useMemo(() => buildLeagueTable(seasonMatches), [seasonMatches])

  const kpi = useMemo(() => computeLeagueKPIs(seasonMatches), [seasonMatches])

  const teamStatsAll = useMemo(() =>
    table.map(row => {
      const tm = teamMatches(seasonMatches, row.team)
      const s = computeTeamStats(tm, row.team)
      return { ...row, ...s }
    }), [seasonMatches, table])

  const compareOptions = [
    { value: 'pts', label: 'Points' }, { value: 'gf', label: 'Goals For' },
    { value: 'ga', label: 'Goals Against' }, { value: 'gd', label: 'Goal Diff' },
    { value: 'shotsPerMatch', label: 'Shots/Match' }, { value: 'sotPerMatch', label: 'SOT/Match' },
    { value: 'cornersPerMatch', label: 'Corners/Match' }, { value: 'foulsPerMatch', label: 'Fouls/Match' },
    { value: 'yellowPerMatch', label: 'Yellow/Match' }, { value: 'winPct', label: 'Win %' },
  ]

  const tableColumns = [
    { key: 'pos',   label: '#',      width: 40  },
    { key: 'team',  label: 'Club',   width: 160, render: (v, r) =>
      <span className={r.pos <= 4 ? 'text-pl-green font-semibold' : r.pos >= 18 ? 'text-red-400' : ''}>{v}</span> },
    { key: 'p',     label: 'P',      width: 40 },
    { key: 'w',     label: 'W',      width: 40 },
    { key: 'd',     label: 'D',      width: 40 },
    { key: 'l',     label: 'L',      width: 40 },
    { key: 'gf',    label: 'GF',     width: 40 },
    { key: 'ga',    label: 'GA',     width: 40 },
    { key: 'gd',    label: 'GD',     width: 50, render: v => <span className={v >= 0 ? 'text-pl-green' : 'text-red-400'}>{v > 0 ? '+' : ''}{v}</span> },
    { key: 'pts',   label: 'Pts',    width: 50, render: v => <span className="font-bold text-gray-100">{v}</span> },
    { key: 'winPct',label: 'Win%',   width: 60, render: v => `${v.toFixed(1)}%` },
    { key: 'ppg',   label: 'PPG',    width: 55, render: v => v.toFixed(2) },
  ]

  const barData = useMemo(() =>
    [...teamStatsAll].sort((a, b) => (b[compareMetric] || 0) - (a[compareMetric] || 0)),
    [teamStatsAll, compareMetric])

  return (
    <div>
      <SectionHeader
        title="Season Explorer"
        subtitle="Deep-dive into any individual season — final table, KPIs, and cross-team comparison."
        right={
          <Select label="Season" value={season} onChange={setSeason}
            options={allSeasons.map(s => ({ value: s, label: s }))} />
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="Matches"         value={(kpi.matches || 0).toLocaleString()} color="text-gray-100"/>
        <KPI label="Goals"           value={(kpi.totalGoals || 0).toLocaleString()}/>
        <KPI label="Goals/Match"     value={fmt.dec(kpi.goalsPerMatch || 0)}/>
        <KPI label="Home Win %"      value={fmt.pct(kpi.homeWinPct || 0)} color="text-pl-green"/>
        <KPI label="Draw %"          value={fmt.pct(kpi.drawPct || 0)} color="text-gray-300"/>
        <KPI label="Away Win %"      value={fmt.pct(kpi.awayWinPct || 0)} color="text-pl-sky"/>
        <KPI label="Shots/Match"     value={fmt.dec(kpi.shotsPerMatch || 0)} color="text-amber-400"/>
        <KPI label="SOT/Match"       value={fmt.dec(kpi.sotPerMatch || 0)} color="text-amber-400"/>
        <KPI label="Corners/Match"   value={fmt.dec(kpi.cornersPerMatch || 0)} color="text-gray-300"/>
        <KPI label="Fouls/Match"     value={fmt.dec(kpi.foulsPerMatch || 0)} color="text-orange-400"/>
        <KPI label="Yellows/Match"   value={fmt.dec(kpi.yellowPerMatch || 0)} color="text-yellow-400"/>
        <KPI label="Reds/Match"      value={fmt.dec(kpi.redPerMatch || 0)} color="text-red-400"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
        {/* League Table */}
        <div className="lg:col-span-3">
          <Panel title={`${season} Final Table`}>
            <DataTable columns={tableColumns} data={table}/>
            <div className="flex gap-4 mt-3 text-xs font-mono">
              <span className="text-pl-green">■ Top 4 (UCL)</span>
              <span className="text-red-400">■ Bottom 3 (Relegated)</span>
            </div>
          </Panel>
        </div>

        {/* Top scorers and stats */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Panel title="Most Goals Scored">
            {[...teamStatsAll].sort((a,b) => b.gf - a.gf).slice(0,8).map((t, i) => (
              <div key={t.team} className="flex items-center gap-2 py-1.5 border-b border-surface-border/30 last:border-0">
                <span className="text-xs font-mono text-gray-600 w-4">{i+1}</span>
                <span className="text-xs font-mono text-gray-300 flex-1 truncate">{t.team}</span>
                <span className="text-xs font-display font-bold text-pl-green">{t.gf}</span>
              </div>
            ))}
          </Panel>
          <Panel title="Best Defense (fewest conceded)">
            {[...teamStatsAll].sort((a,b) => a.ga - b.ga).slice(0,8).map((t, i) => (
              <div key={t.team} className="flex items-center gap-2 py-1.5 border-b border-surface-border/30 last:border-0">
                <span className="text-xs font-mono text-gray-600 w-4">{i+1}</span>
                <span className="text-xs font-mono text-gray-300 flex-1 truncate">{t.team}</span>
                <span className="text-xs font-display font-bold text-pl-sky">{t.ga}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>

      {/* Team comparison bar */}
      <Panel title="Team Comparison">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-mono text-gray-400">Rank by:</span>
          <Select value={compareMetric} onChange={setCompareMetric} options={compareOptions}/>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} margin={{ bottom: 60 }}>
            <CartesianGrid {...GRID_PROPS}/>
            <XAxis dataKey="team" {...AXIS_PROPS} angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 10, fill: '#6b7280' }}/>
            <YAxis {...AXIS_PROPS}/>
            <Tooltip content={<CustomTooltip formatter={v => typeof v === 'number' ? v.toFixed(2) : v}/>}/>
            <Bar dataKey={compareMetric} fill={COLORS.green} radius={[3,3,0,0]} maxBarSize={28}/>
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  )
}
