import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { useData } from '../../data/DataContext'
import { computeH2H, buildLeagueTable } from '../../analytics/engine'
import { SectionHeader, Select, Panel, KPI, DataTable, ResultBadge, CustomTooltip, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

const ALL = 'All Seasons'

export default function HeadToHead() {
  const { matches, allTeams, allSeasons } = useData()
  const [teamA, setTeamA] = useState(allTeams[0] || '')
  const [teamB, setTeamB] = useState(allTeams[1] || '')
  const [season, setSeason]   = useState(ALL)

  const filtered = useMemo(() =>
    season === ALL ? matches : matches.filter(m => m.season === season),
    [matches, season])

  const h2h = useMemo(() => computeH2H(filtered, teamA, teamB), [filtered, teamA, teamB])

  // Per-season breakdown
  const seasonBreakdown = useMemo(() => allSeasons.map(s => {
    const sm = matches.filter(m => m.season === s)
    const sh = computeH2H(sm, teamA, teamB)
    if (!sh) return null
    return { season: s, aWins: sh.aWins, draws: sh.draws, bWins: sh.bWins, total: sh.total, avgGoals: sh.avgGoals }
  }).filter(Boolean), [matches, allSeasons, teamA, teamB])

  const matchColumns = [
    { key: 'date',      label: 'Date',  width: 90,  render: v => v?.toLocaleDateString('en-GB') },
    { key: 'season',    label: 'Season',width: 70 },
    { key: 'homeTeam',  label: 'Home',  width: 150 },
    { key: 'awayTeam',  label: 'Away',  width: 150 },
    { key: 'fthg',      label: 'HT',    width: 55,  render: (v, r) => `${v}–${r.htag}` },
    { key: 'ftag',      label: 'FT',    width: 55,  render: (v, r) => <span className="font-bold">{r.fthg}–{v}</span> },
    { key: 'ftr',       label: 'Res',   width: 45,  render: v => <ResultBadge result={v}/> },
    { key: 'totalGoals',label: 'Goals', width: 55 },
    { key: 'referee',   label: 'Referee', width: 130 },
  ]

  if (!h2h) {
    return (
      <div>
        <SectionHeader title="Head to Head" subtitle="Select two clubs to see their complete historical record."/>
        <div className="flex flex-wrap gap-3 p-4 bg-surface-raised border border-surface-border rounded-lg mb-6">
          <Select label="Team A" value={teamA} onChange={t => { setTeamA(t); if (t === teamB) setTeamB('') }}
            options={allTeams.map(t => ({ value: t, label: t }))} />
          <Select label="vs" value={teamB} onChange={setTeamB}
            options={allTeams.filter(t => t !== teamA).map(t => ({ value: t, label: t }))} />
          <Select label="Season" value={season} onChange={setSeason}
            options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]} />
        </div>
        <Panel><p className="text-gray-500 font-mono text-sm text-center py-8">No meetings found between {teamA} and {teamB} in the selected period.</p></Panel>
      </div>
    )
  }

  const aHomeH2H = computeH2H(h2h.aHome, teamA, teamB)
  const bHomeH2H = computeH2H(h2h.bHome, teamA, teamB)

  return (
    <div>
      <SectionHeader title="Head to Head" subtitle="Complete historical record between two clubs — overall, home/away split, and season-by-season breakdown."/>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 p-4 bg-surface-raised border border-surface-border rounded-lg mb-6">
        <Select label="Team A" value={teamA} onChange={t => { setTeamA(t) }}
          options={allTeams.map(t => ({ value: t, label: t }))} />
        <Select label="vs" value={teamB} onChange={setTeamB}
          options={allTeams.filter(t => t !== teamA).map(t => ({ value: t, label: t }))} />
        <Select label="Season" value={season} onChange={setSeason}
          options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]} />
      </div>

      {/* H2H summary header */}
      <div className="panel mb-5">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-pl-green">{h2h.aWins}</div>
            <div className="font-display text-xl font-semibold text-gray-200">{teamA}</div>
            <div className="text-xs font-mono text-gray-500">wins</div>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-gray-400">{h2h.draws}</div>
            <div className="text-xs font-mono text-gray-500">Draws</div>
            <div className="text-xs font-mono text-gray-600">{h2h.total} meetings</div>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-pl-sky">{h2h.bWins}</div>
            <div className="font-display text-xl font-semibold text-gray-200">{teamB}</div>
            <div className="text-xs font-mono text-gray-500">wins</div>
          </div>
        </div>
        {/* Win bar */}
        <div className="mt-5 h-3 bg-surface-muted rounded-full overflow-hidden flex">
          <div className="h-full bg-pl-green rounded-l-full transition-all" style={{ width: `${(h2h.aWins / h2h.total) * 100}%` }}/>
          <div className="h-full bg-gray-600 transition-all" style={{ width: `${(h2h.draws / h2h.total) * 100}%` }}/>
          <div className="h-full bg-pl-sky rounded-r-full transition-all" style={{ width: `${(h2h.bWins / h2h.total) * 100}%` }}/>
        </div>
        <div className="flex justify-between text-xs font-mono text-gray-500 mt-1">
          <span className="text-pl-green">{((h2h.aWins / h2h.total) * 100).toFixed(1)}%</span>
          <span>{((h2h.draws / h2h.total) * 100).toFixed(1)}% draws</span>
          <span className="text-pl-sky">{((h2h.bWins / h2h.total) * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
        <KPI label="Total Meetings"   value={h2h.total}/>
        <KPI label="Avg Goals/Match"  value={fmt.dec(h2h.avgGoals)}/>
        <KPI label={`${teamA} Home`}  value={`${h2h.aHome.filter(m => m.ftr === 'H').length}W–${h2h.aHome.filter(m => m.ftr === 'D').length}D–${h2h.aHome.filter(m => m.ftr === 'A').length}L`} color="text-pl-green"/>
        <KPI label={`${teamB} Home`}  value={`${h2h.bHome.filter(m => m.ftr === 'A').length}W–${h2h.bHome.filter(m => m.ftr === 'D').length}D–${h2h.bHome.filter(m => m.ftr === 'H').length}L`} color="text-pl-sky"/>
      </div>

      {/* Season breakdown chart */}
      {seasonBreakdown.length > 1 && (
        <Panel title="Season-by-Season Record" className="mb-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={seasonBreakdown} margin={{ bottom: 40 }}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="season" {...AXIS_PROPS} angle={-45} textAnchor="end" height={60} interval={0} tick={{ fontSize: 9, fill: '#6b7280' }}/>
              <YAxis {...AXIS_PROPS} allowDecimals={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend/>
              <Bar dataKey="aWins" name={`${teamA} Wins`} stackId="a" fill={COLORS.green} maxBarSize={20}/>
              <Bar dataKey="draws" name="Draws" stackId="a" fill={COLORS.muted} maxBarSize={20}/>
              <Bar dataKey="bWins" name={`${teamB} Wins`} stackId="a" fill={COLORS.sky} maxBarSize={20}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {/* Match history */}
      <Panel title="Match History">
        <DataTable columns={matchColumns} data={h2h.matches}/>
      </Panel>
    </div>
  )
}
