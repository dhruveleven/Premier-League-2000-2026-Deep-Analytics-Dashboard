import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ReferenceLine
} from 'recharts'
import { useData } from '../../data/DataContext'
import { computeTeamStats, teamSeasonRecords, buildLeagueTable, teamMatches as getTeamMatches } from '../../analytics/engine'
import { SectionHeader, Select, Panel, KPI, DataTable, CustomTooltip, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

const METRIC_OPTIONS = [
  { value: 'pos',        label: 'League Position'  },
  { value: 'pts',        label: 'Points'            },
  { value: 'gf',         label: 'Goals Scored'      },
  { value: 'ga',         label: 'Goals Conceded'    },
  { value: 'gd',         label: 'Goal Difference'   },
  { value: 'winPct',     label: 'Win Rate'          },
  { value: 'shotsPerMatch',   label: 'Shots/Match'  },
  { value: 'sotPerMatch',     label: 'SOT/Match'    },
  { value: 'cornersPerMatch', label: 'Corners/Match'},
  { value: 'foulsPerMatch',   label: 'Fouls/Match'  },
  { value: 'yellowPerMatch',  label: 'Yellow/Match' },
]

export default function TeamExplorer() {
  const { matches, allSeasons, allTeams } = useData()
  const [team, setTeam] = useState(allTeams[0] || '')
  const [metric, setMetric] = useState('pos')

  const allStats = useMemo(() => computeTeamStats(getTeamMatches(matches, team), team), [matches, team])

  const seasonRecords = useMemo(() =>
    teamSeasonRecords(matches, team, allSeasons), [matches, team, allSeasons])

  const tableColumns = [
    { key: 'season',  label: 'Season',   width: 80 },
    { key: 'pos',     label: 'Pos',      width: 50, render: v => v ? <span className={v === 1 ? 'text-pl-green font-bold' : v >= 18 ? 'text-red-400' : ''}>{v}</span> : '—' },
    { key: 'pts',     label: 'Pts',      width: 50, render: v => <span className="font-bold">{v}</span> },
    { key: 'matches', label: 'P',        width: 40 },
    { key: 'w',       label: 'W',        width: 35 },
    { key: 'd',       label: 'D',        width: 35 },
    { key: 'l',       label: 'L',        width: 35 },
    { key: 'gf',      label: 'GF',       width: 40 },
    { key: 'ga',      label: 'GA',       width: 40 },
    { key: 'gd',      label: 'GD',       width: 50, render: v => <span className={v >= 0 ? 'text-pl-green' : 'text-red-400'}>{v > 0 ? '+' : ''}{v}</span> },
    { key: 'winPct',  label: 'Win%',     width: 60, render: v => `${v.toFixed(1)}%` },
    { key: 'ppg',     label: 'PPG',      width: 55, render: v => v.toFixed(2) },
    { key: 'homePPG', label: 'Home PPG', width: 75, render: v => v?.toFixed(2) },
    { key: 'awayPPG', label: 'Away PPG', width: 75, render: v => v?.toFixed(2) },
  ]

  const chartData = seasonRecords.map(r => ({
    season: r.season,
    [metric]: r[metric],
  }))

  const isReversed = metric === 'pos' || metric === 'ga' || metric === 'foulsPerMatch' || metric === 'yellowPerMatch'

  const seasonsPresent = new Set(seasonRecords.map(r => r.season))
  const absentSeasons = allSeasons.filter(s => !seasonsPresent.has(s))

  return (
    <div>
      <SectionHeader
        title="Team Explorer"
        subtitle="Full Premier League career analysis for any club — season records, career totals, and historical performance trends."
        right={
          <Select label="Team" value={team} onChange={setTeam}
            options={allTeams.map(t => ({ value: t, label: t }))} />
        }
      />

      {/* Career KPIs */}
      {allStats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <KPI label="PL Seasons"    value={seasonRecords.length} color="text-gray-100"/>
          <KPI label="Matches"       value={allStats.matches.toLocaleString()}/>
          <KPI label="Win %"         value={fmt.pct(allStats.winPct)} color="text-pl-green"/>
          <KPI label="Points"        value={allStats.pts.toLocaleString()}/>
          <KPI label="Goals Scored"  value={allStats.gf.toLocaleString()} color="text-pl-green"/>
          <KPI label="Goals Conceded"value={allStats.ga.toLocaleString()} color="text-red-400"/>
          <KPI label="Goal Diff"     value={`${allStats.gd > 0 ? '+' : ''}${allStats.gd}`} color={allStats.gd >= 0 ? 'text-pl-green' : 'text-red-400'}/>
          <KPI label="Home PPG"      value={fmt.dec(allStats.homePPG)} color="text-pl-green"/>
          <KPI label="Away PPG"      value={fmt.dec(allStats.awayPPG)} color="text-pl-sky"/>
          <KPI label="Home Advantage"value={fmt.dec(allStats.homeAdvantage)} color={allStats.homeAdvantage >= 0 ? 'text-pl-green' : 'text-red-400'}/>
          <KPI label="Clean Sheets"  value={allStats.cleanSheets}/>
          <KPI label="Shot Conv."    value={fmt.pct(allStats.shotConv * 100)} color="text-amber-400"/>
        </div>
      )}

      {absentSeasons.length > 0 && (
        <div className="panel mb-5 border-yellow-500/20 bg-yellow-500/5">
          <span className="text-xs font-mono text-yellow-400">Absent from Premier League in: {absentSeasons.join(', ')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Historical trend */}
        <div className="lg:col-span-2">
          <Panel title="Historical Performance Trend">
            <div className="flex items-center gap-3 mb-4">
              <Select label="Metric" value={metric} onChange={setMetric} options={METRIC_OPTIONS}/>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ right: 10 }}>
                <CartesianGrid {...GRID_PROPS}/>
                <XAxis dataKey="season" {...AXIS_PROPS} angle={-35} textAnchor="end" height={55} interval={2}/>
                <YAxis {...AXIS_PROPS} reversed={isReversed}/>
                <Tooltip content={<CustomTooltip formatter={v => typeof v === 'number' ? v.toFixed(2) : v}/>}/>
                <Line type="monotone" dataKey={metric} name={METRIC_OPTIONS.find(o => o.value === metric)?.label}
                      stroke={COLORS.green} strokeWidth={2} dot={{ r: 3, fill: COLORS.green }} connectNulls/>
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Home vs Away breakdown */}
        {allStats && (
          <Panel title="Home vs Away Career">
            <div className="space-y-4">
              {[
                { label: 'Win %', home: allStats.homeW / allStats.homeMatches * 100, away: allStats.awayW / allStats.awayMatches * 100 },
                { label: 'Goals/Match', home: allStats.homeGF / allStats.homeMatches, away: allStats.awayGF / allStats.awayMatches },
                { label: 'PPG', home: allStats.homePPG, away: allStats.awayPPG },
              ].map(({ label, home, away }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                    <span>{label}</span>
                    <span><span className="text-pl-green">{home.toFixed(2)}</span> vs <span className="text-pl-sky">{away.toFixed(2)}</span></span>
                  </div>
                  <div className="h-2 bg-surface-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-pl-green/70" style={{ width: `${Math.min(50, home / 2)}%` }}/>
                    <div className="flex-1"/>
                    <div className="h-full bg-pl-sky/70" style={{ width: `${Math.min(50, away / 2)}%` }}/>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-gray-600 mt-0.5">
                    <span>Home</span><span>Away</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 bg-surface-muted rounded">
                <div className="text-xs font-mono text-gray-400">Home Advantage Index</div>
                <div className={`font-display text-2xl font-bold ${allStats.homeAdvantage >= 0 ? 'text-pl-green' : 'text-red-400'}`}>
                  {allStats.homeAdvantage > 0 ? '+' : ''}{allStats.homeAdvantage.toFixed(2)}
                </div>
                <div className="text-xs font-mono text-gray-500">PPG at home minus PPG away</div>
              </div>
            </div>
          </Panel>
        )}
      </div>

      {/* Season-by-season table */}
      <Panel title="Season-by-Season Record">
        <DataTable columns={tableColumns} data={seasonRecords}/>
      </Panel>
    </div>
  )
}
