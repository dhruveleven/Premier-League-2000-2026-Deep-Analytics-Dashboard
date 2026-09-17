import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, ZAxis
} from 'recharts'
import { useData } from '../../data/DataContext'
import { computeLeagueKPIs, computeTeamStats, teamMatches as getTeamMatches, scorlineDistribution, avg, sum, pct } from '../../analytics/engine'
import { SectionHeader, Select, Panel, KPI, DataTable, CustomTooltip, Tabs, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

const ALL = 'All Seasons'

const TABS = [
  { id: 'scoring',  label: 'Scoring'   },
  { id: 'shots',    label: 'Shots'     },
  { id: 'teams',    label: 'Team Rankings' },
  { id: 'relations',label: 'Relationships' },
]

export default function ScoringAnalysis() {
  const { matches, allSeasons, allTeams } = useData()
  const [season, setSeason] = useState(ALL)
  const [tab, setTab] = useState('scoring')

  const filtered = useMemo(() =>
    season === ALL ? matches : matches.filter(m => m.season === season),
    [matches, season])

  const kpi = useMemo(() => computeLeagueKPIs(filtered), [filtered])

  // Scoreline distribution top 20
  const scorelines = useMemo(() => scorlineDistribution(filtered).slice(0, 20), [filtered])

  // Goals-per-match distribution
  const goalDist = useMemo(() => {
    const counts = {}
    for (const m of filtered) {
      const g = m.totalGoals
      counts[g] = (counts[g] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => a[0] - b[0]).map(([goals, count]) => ({
      goals: `${goals} goals`, count, pct: pct(count, filtered.length)
    }))
  }, [filtered])

  // Team attacking rankings
  const teamRankings = useMemo(() =>
    allTeams.map(t => {
      const tm = getTeamMatches(filtered, t)
      if (tm.length < 5) return null
      return computeTeamStats(tm, t)
    }).filter(Boolean),
    [filtered, allTeams])

  // Shot battle correlation
  const shotWinData = useMemo(() => {
    const cats = [
      { label: 'Won Shot Battle',  matches: filtered.filter(m => m.hs > m.as),  hWin: 0, draw: 0, aWin: 0 },
      { label: 'Lost Shot Battle', matches: filtered.filter(m => m.hs < m.as),  hWin: 0, draw: 0, aWin: 0 },
      { label: 'Won SOT Battle',   matches: filtered.filter(m => m.hst > m.ast), hWin: 0, draw: 0, aWin: 0 },
      { label: 'Lost SOT Battle',  matches: filtered.filter(m => m.hst < m.ast), hWin: 0, draw: 0, aWin: 0 },
    ]
    return cats.map(c => {
      const n = c.matches.length
      const hW = c.matches.filter(m => m.ftr === 'H').length
      const dr = c.matches.filter(m => m.ftr === 'D').length
      const aW = c.matches.filter(m => m.ftr === 'A').length
      return { label: c.label, total: n, 'Home Win': pct(hW, n), Draw: pct(dr, n), 'Away Win': pct(aW, n) }
    })
  }, [filtered])

  // Team scatter: shots vs goals
  const scatterData = useMemo(() =>
    teamRankings.map(t => ({
      team: t.team,
      shots: t.shotsPerMatch,
      goals: t.gf / t.matches,
      sot:   t.sotPerMatch,
      conv:  t.shotConv * 100,
    })),
    [teamRankings])

  const attackColumns = [
    { key: 'team',          label: 'Team',        width: 160 },
    { key: 'gf',            label: 'Goals',       width: 70,  render: v => <span className="text-pl-green font-bold">{v}</span> },
    { key: 'shotsPerMatch', label: 'Shots/M',     width: 80,  render: v => v?.toFixed(2) },
    { key: 'sotPerMatch',   label: 'SOT/M',       width: 80,  render: v => v?.toFixed(2) },
    { key: 'shotConv',      label: 'Shot Conv.',  width: 90,  render: v => `${(v*100).toFixed(1)}%` },
    { key: 'sotConv',       label: 'SOT Conv.',   width: 90,  render: v => `${(v*100).toFixed(1)}%` },
    { key: 'matches',       label: 'Matches',     width: 70 },
  ]

  return (
    <div>
      <SectionHeader
        title="Goals, Shots & Attacking"
        subtitle="Scoring patterns, shot volume and efficiency, scoreline distribution, and the relationship between attacking activity and results."
        right={
          <Select label="Period" value={season} onChange={setSeason}
            options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]} />
        }
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="Goals/Match"     value={fmt.dec(kpi.goalsPerMatch || 0)}/>
        <KPI label="Home Goals/Match"value={fmt.dec(kpi.homeGoalsPerMatch || 0)} color="text-pl-green"/>
        <KPI label="Away Goals/Match"value={fmt.dec(kpi.awayGoalsPerMatch || 0)} color="text-pl-sky"/>
        <KPI label="1st Half Goals"  value={fmt.dec(kpi.firstHalfGoalsPerMatch || 0)} color="text-purple-400"/>
        <KPI label="2nd Half Goals"  value={fmt.dec(kpi.secondHalfGoalsPerMatch || 0)} color="text-orange-400"/>
        <KPI label="Shots/Match"     value={fmt.dec(kpi.shotsPerMatch || 0)} color="text-amber-400"/>
        <KPI label="SOT/Match"       value={fmt.dec(kpi.sotPerMatch || 0)} color="text-amber-400"/>
        <KPI label="Shot Conv."      value={fmt.pct((kpi.shotConversion || 0) * 100)} color="text-lime-400"/>
        <KPI label="SOT Conv."       value={fmt.pct((kpi.sotConversion || 0) * 100)} color="text-lime-400"/>
        <KPI label="0-0 Matches"     value={filtered.filter(m => m.totalGoals === 0).length} color="text-gray-400"/>
        <KPI label="5+ Goal Games"   value={filtered.filter(m => m.totalGoals >= 5).length} color="text-red-400"/>
        <KPI label="Total Goals"     value={(kpi.totalGoals || 0).toLocaleString()} color="text-pl-green"/>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab}/>

      {tab === 'scoring' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="Goals Per Match Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={goalDist}>
                <CartesianGrid {...GRID_PROPS}/>
                <XAxis dataKey="goals" {...AXIS_PROPS}/>
                <YAxis {...AXIS_PROPS}/>
                <Tooltip content={<CustomTooltip formatter={(v, n) => n === 'count' ? v.toLocaleString() : `${v.toFixed(1)}%`}/>}/>
                <Bar dataKey="count" name="Matches" fill={COLORS.green} radius={[3,3,0,0]} maxBarSize={30}/>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Top 20 Scorelines">
            <div className="scroll-area" style={{ maxHeight: 300 }}>
              {scorelines.map((s, i) => (
                <div key={s.score} className="flex items-center gap-3 py-1.5 border-b border-surface-border/30 last:border-0">
                  <span className="text-xs font-mono text-gray-600 w-4">{i+1}</span>
                  <span className="font-display font-bold text-gray-100 w-12">{s.score}</span>
                  <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full bg-pl-green rounded-full" style={{ width: `${(s.count / scorelines[0].count) * 100}%` }}/>
                  </div>
                  <span className="text-xs font-mono text-gray-300 w-12 text-right">{s.count.toLocaleString()}</span>
                  <span className="text-xs font-mono text-gray-500 w-10 text-right">{pct(s.count, filtered.length).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'shots' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="Home vs Away Shot & SOT">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { metric: 'Shots', home: filtered.reduce((a, m) => a + m.hs, 0) / (filtered.length || 1), away: filtered.reduce((a, m) => a + m.as, 0) / (filtered.length || 1) },
                { metric: 'SOT',   home: filtered.reduce((a, m) => a + m.hst, 0) / (filtered.length || 1), away: filtered.reduce((a, m) => a + m.ast, 0) / (filtered.length || 1) },
              ]}>
                <CartesianGrid {...GRID_PROPS}/>
                <XAxis dataKey="metric" {...AXIS_PROPS}/>
                <YAxis {...AXIS_PROPS}/>
                <Tooltip content={<CustomTooltip formatter={v => v.toFixed(2)}/>}/>
                <Legend/>
                <Bar dataKey="home" name="Home" fill={COLORS.green} radius={[3,3,0,0]} maxBarSize={50}/>
                <Bar dataKey="away" name="Away" fill={COLORS.sky}   radius={[3,3,0,0]} maxBarSize={50}/>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Shot Conversion vs SOT Conversion">
            <div className="flex flex-col justify-center h-64 gap-6 px-4">
              {[
                { label: 'Shot Conversion (Goals/Shots)', value: (kpi.shotConversion || 0) * 100, color: COLORS.green, max: 20 },
                { label: 'SOT Conversion (Goals/SOT)',    value: (kpi.sotConversion  || 0) * 100, color: COLORS.sky,   max: 50 },
                { label: 'SOT Rate (SOT/Shots)',          value: kpi.shotsPerMatch > 0 ? (kpi.sotPerMatch / kpi.shotsPerMatch) * 100 : 0, color: COLORS.purple, max: 60 },
              ].map(({ label, value, color, max }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-gray-400">{label}</span>
                    <span style={{ color }}>{value.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }}/>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'teams' && (
        <Panel title="Team Attacking Rankings">
          <DataTable columns={attackColumns} data={[...teamRankings].sort((a, b) => b.gf - a.gf)}/>
        </Panel>
      )}

      {tab === 'relations' && (
        <div className="space-y-5">
          <Panel title="Does Winning the Shot Battle = Winning the Match?">
            <p className="text-xs font-mono text-gray-500 mb-4">
              Result distribution when home team wins/loses the shots and SOT battle. Descriptive correlation only — does not account for match state or context.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={shotWinData} margin={{ bottom: 20 }}>
                <CartesianGrid {...GRID_PROPS}/>
                <XAxis dataKey="label" {...AXIS_PROPS} tick={{ fontSize: 10, fill: '#6b7280' }} angle={-10} textAnchor="end" height={50}/>
                <YAxis {...AXIS_PROPS} tickFormatter={v => `${v.toFixed(0)}%`}/>
                <Tooltip content={<CustomTooltip formatter={v => `${v.toFixed(1)}%`}/>}/>
                <Legend/>
                <Bar dataKey="Home Win" stackId="a" fill={COLORS.green} maxBarSize={40}/>
                <Bar dataKey="Draw"     stackId="a" fill={COLORS.muted}  maxBarSize={40}/>
                <Bar dataKey="Away Win" stackId="a" fill={COLORS.sky}    maxBarSize={40}/>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Shots/Match vs Goals/Match (Team Scatter)">
            <p className="text-xs font-mono text-gray-500 mb-4">Each point is one team in the selected period. Teams in the upper-right generate high shot volume AND high scoring. Teams in the lower-right generate shots but do not convert efficiently.</p>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ right: 20 }}>
                <CartesianGrid {...GRID_PROPS}/>
                <XAxis dataKey="shots" name="Shots/Match" {...AXIS_PROPS} label={{ value: 'Shots per Match', position: 'insideBottom', offset: -4, fill: '#6b7280', fontSize: 11 }}/>
                <YAxis dataKey="goals" name="Goals/Match" {...AXIS_PROPS} label={{ value: 'Goals per Match', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}/>
                <ZAxis range={[40, 40]}/>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="custom-tooltip">
                      <div className="text-pl-green font-semibold mb-1">{d.team}</div>
                      <div className="text-gray-300 text-xs">Shots/M: {d.shots.toFixed(2)}</div>
                      <div className="text-gray-300 text-xs">Goals/M: {d.goals.toFixed(2)}</div>
                      <div className="text-gray-300 text-xs">Conv: {d.conv.toFixed(1)}%</div>
                    </div>
                  )
                }}/>
                <Scatter data={scatterData} fill={COLORS.green} fillOpacity={0.7}/>
              </ScatterChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}
    </div>
  )
}
