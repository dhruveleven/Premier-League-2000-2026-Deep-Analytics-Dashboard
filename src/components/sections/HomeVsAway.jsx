import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, ZAxis
} from 'recharts'
import { useData } from '../../data/DataContext'
import { computeLeagueKPIs, computeTeamStats, teamMatches as getTeamMatches } from '../../analytics/engine'
import { SectionHeader, Select, Panel, KPI, DataTable, CustomTooltip, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

const ALL = 'All Seasons'

export default function HomeVsAway() {
  const { matches, allSeasons, allTeams } = useData()
  const [season, setSeason] = useState(ALL)

  const filtered = useMemo(() =>
    season === ALL ? matches : matches.filter(m => m.season === season),
    [matches, season])

  const kpi = useMemo(() => computeLeagueKPIs(filtered), [filtered])

  // Season-by-season home advantage trend
  const trendData = useMemo(() => allSeasons.map(s => {
    const sm = matches.filter(m => m.season === s)
    const k = computeLeagueKPIs(sm)
    const hPPG = (k.homeWinPct / 100 * 3 + k.drawPct / 100)
    const aPPG = (k.awayWinPct / 100 * 3 + k.drawPct / 100)
    return {
      season: s,
      homeWinPct: k.homeWinPct,
      awayWinPct: k.awayWinPct,
      drawPct: k.drawPct,
      homeGoals: k.homeGoalsPerMatch,
      awayGoals: k.awayGoalsPerMatch,
      homeAdvantage: hPPG - aPPG,
    }
  }), [matches, allSeasons])

  // Team-level home advantage
  const teamHAData = useMemo(() => {
    const fm = season === ALL ? matches : filtered
    return allTeams.map(t => {
      const tm = getTeamMatches(fm, t)
      if (tm.length < 10) return null
      const s = computeTeamStats(tm, t)
      return s ? { team: t, homeAdvantage: s.homeAdvantage, homePPG: s.homePPG, awayPPG: s.awayPPG, matches: s.matches } : null
    }).filter(Boolean).sort((a, b) => b.homeAdvantage - a.homeAdvantage)
  }, [matches, filtered, allTeams, season])

  const compData = [
    { metric: 'Goals/Match',  home: kpi.homeGoalsPerMatch || 0, away: kpi.awayGoalsPerMatch || 0 },
    { metric: 'Win %',        home: kpi.homeWinPct || 0,        away: kpi.awayWinPct || 0 },
    { metric: 'Shots/Match',  home: (filtered.reduce((a, m) => a + m.hs, 0) / (filtered.length || 1)), away: (filtered.reduce((a, m) => a + m.as, 0) / (filtered.length || 1)) },
    { metric: 'SOT/Match',    home: (filtered.reduce((a, m) => a + m.hst, 0) / (filtered.length || 1)), away: (filtered.reduce((a, m) => a + m.ast, 0) / (filtered.length || 1)) },
    { metric: 'Corners/Match',home: (filtered.reduce((a, m) => a + m.hc, 0) / (filtered.length || 1)),  away: (filtered.reduce((a, m) => a + m.ac, 0) / (filtered.length || 1)) },
    { metric: 'Fouls/Match',  home: (filtered.reduce((a, m) => a + m.hf, 0) / (filtered.length || 1)),  away: (filtered.reduce((a, m) => a + m.af, 0) / (filtered.length || 1)) },
    { metric: 'Yellows/Match',home: (filtered.reduce((a, m) => a + m.hy, 0) / (filtered.length || 1)),  away: (filtered.reduce((a, m) => a + m.ay, 0) / (filtered.length || 1)) },
  ]

  const haTableColumns = [
    { key: 'team',          label: 'Club',       width: 160 },
    { key: 'homePPG',       label: 'Home PPG',   width: 90, render: v => <span className="text-pl-green">{v.toFixed(2)}</span> },
    { key: 'awayPPG',       label: 'Away PPG',   width: 90, render: v => <span className="text-pl-sky">{v.toFixed(2)}</span> },
    { key: 'homeAdvantage', label: 'HA Index',   width: 90, render: v => <span className={v >= 0 ? 'text-pl-green font-bold' : 'text-red-400 font-bold'}>{v > 0 ? '+' : ''}{v.toFixed(2)}</span> },
    { key: 'matches',       label: 'Matches',    width: 70 },
  ]

  const avgHA = teamHAData.length ? teamHAData.reduce((a, b) => a + b.homeAdvantage, 0) / teamHAData.length : 0

  return (
    <div>
      <SectionHeader
        title="Home vs Away"
        subtitle="Quantifying home advantage across the Premier League — league-wide trends, team-level analysis, and the erosion of home advantage over 26 seasons."
        right={
          <Select label="Period" value={season} onChange={setSeason}
            options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]} />
        }
      />

      {/* Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="Home Win %"      value={fmt.pct(kpi.homeWinPct || 0)} color="text-pl-green"/>
        <KPI label="Draw %"          value={fmt.pct(kpi.drawPct || 0)} color="text-gray-300"/>
        <KPI label="Away Win %"      value={fmt.pct(kpi.awayWinPct || 0)} color="text-pl-sky"/>
        <KPI label="Home Goals/Match"value={fmt.dec(kpi.homeGoalsPerMatch || 0)} color="text-pl-green"/>
        <KPI label="Away Goals/Match"value={fmt.dec(kpi.awayGoalsPerMatch || 0)} color="text-pl-sky"/>
        <KPI label="Avg HA Index"    value={fmt.dec(avgHA)} color={avgHA >= 0 ? 'text-pl-green' : 'text-red-400'}
          sub="Home PPG − Away PPG"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Head-to-head bar comparison */}
        <Panel title="Home vs Away — Key Metrics">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={compData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid {...GRID_PROPS} horizontal={false} vertical/>
              <XAxis type="number" {...AXIS_PROPS}/>
              <YAxis dataKey="metric" type="category" {...AXIS_PROPS} width={100}/>
              <Tooltip content={<CustomTooltip formatter={v => v.toFixed(2)}/>}/>
              <Legend/>
              <Bar dataKey="home" name="Home" fill={COLORS.green} radius={[0,3,3,0]} maxBarSize={14}/>
              <Bar dataKey="away" name="Away" fill={COLORS.sky}   radius={[0,3,3,0]} maxBarSize={14}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Home advantage trend */}
        <Panel title="Home Advantage Index by Season (Home PPG − Away PPG)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData} margin={{ right: 10 }}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="season" {...AXIS_PROPS} angle={-35} textAnchor="end" height={55} interval={2}/>
              <YAxis {...AXIS_PROPS}/>
              <Tooltip content={<CustomTooltip formatter={v => v.toFixed(3)}/>}/>
              <Line type="monotone" dataKey="homeAdvantage" name="HA Index"
                    stroke={COLORS.green} strokeWidth={2} dot={{ r: 3, fill: COLORS.green }}/>
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs font-mono text-gray-600 mt-2">A declining trend suggests home advantage has eroded over the period. Correlation does not imply causation.</p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Win % trends */}
        <Panel title="Home / Draw / Away Win % by Season">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ right: 10 }}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="season" {...AXIS_PROPS} angle={-35} textAnchor="end" height={55} interval={2}/>
              <YAxis {...AXIS_PROPS} domain={[20, 55]}/>
              <Tooltip content={<CustomTooltip formatter={v => `${v.toFixed(1)}%`}/>}/>
              <Legend/>
              <Line type="monotone" dataKey="homeWinPct" name="Home Win %" stroke={COLORS.green} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="drawPct"    name="Draw %"     stroke={COLORS.muted}  strokeWidth={1.5} dot={false} strokeDasharray="4 4"/>
              <Line type="monotone" dataKey="awayWinPct" name="Away Win %" stroke={COLORS.sky}   strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        {/* Goals home vs away trend */}
        <Panel title="Home vs Away Goals/Match by Season">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ right: 10 }}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="season" {...AXIS_PROPS} angle={-35} textAnchor="end" height={55} interval={2}/>
              <YAxis {...AXIS_PROPS}/>
              <Tooltip content={<CustomTooltip formatter={v => v.toFixed(2)}/>}/>
              <Legend/>
              <Line type="monotone" dataKey="homeGoals" name="Home Goals/Match" stroke={COLORS.green} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="awayGoals" name="Away Goals/Match" stroke={COLORS.sky}   strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Team HA rankings */}
      <Panel title="Home Advantage by Team (HA Index = Home PPG − Away PPG)">
        <p className="text-xs font-mono text-gray-500 mb-4">
          A high HA Index means the team performs significantly better at home than away. This metric uses PPG, so it is comparable across teams with different match counts.
          Minimum 10 matches in the selected period.
        </p>
        <DataTable columns={haTableColumns} data={teamHAData}/>
      </Panel>
    </div>
  )
}
