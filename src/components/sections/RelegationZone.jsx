import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, BarChart, Bar
} from 'recharts'
import { useData } from '../../data/DataContext'
import { buildSeasonProgression, buildLeagueTable, relegationHistory } from '../../analytics/engine'
import { SectionHeader, Select, Panel, KPI, DataTable, CustomTooltip, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS, TEAM_COLORS } from '../../utils/theme'

export default function RelegationZone() {
  const { matches, allSeasons } = useData()
  const [season, setSeason] = useState(allSeasons[allSeasons.length - 1] || '')
  const [matchday, setMatchday] = useState(38)

  const seasonMatches = useMemo(() =>
    matches.filter(m => m.season === season), [matches, season])

  const progression = useMemo(() =>
    buildSeasonProgression(seasonMatches), [seasonMatches])

  const maxMD = progression.length

  const finalTable = useMemo(() => buildLeagueTable(seasonMatches), [seasonMatches])
  const bottom5 = finalTable.slice(-5).reverse()
  const relegated = finalTable.slice(-3)
  const survived = finalTable[16]

  // Track which teams were in zones at each matchday
  const zoneData = useMemo(() => {
    const bottom4teams = new Set([...finalTable.slice(-4).map(t => t.team)])
    return progression.slice(0, matchday).map(p => {
      const row = { matchday: p.matchday }
      bottom4teams.forEach(t => {
        const entry = p.standings.find(s => s.team === t)
        row[t] = entry?.pos ?? null
      })
      return row
    })
  }, [progression, matchday, finalTable])

  // Historical relegation metrics
  const histRelStats = useMemo(() => {
    return allSeasons.map(s => {
      const sm = matches.filter(m => m.season === s)
      const t = buildLeagueTable(sm)
      const bot3 = t.slice(-3)
      const pos17 = t[16]
      const pos18 = t[17]
      return {
        season: s,
        relegPts: bot3.map(t => t.pts),
        highestRelegated: Math.max(...bot3.map(t => t.pts)),
        lowestRelegated:  Math.min(...bot3.map(t => t.pts)),
        survivalPts: pos17?.pts ?? 0,
        margin: pos17 && pos18 ? pos17.pts - pos18.pts : 0,
        relegated: bot3.map(t => t.team),
      }
    })
  }, [matches, allSeasons])

  const colorMap = useMemo(() => {
    const m = {}
    finalTable.slice(-4).forEach((t, i) => { m[t.team] = TEAM_COLORS[i] })
    return m
  }, [finalTable])

  const tableColumns = [
    { key: 'pos',  label: '#',    width: 40, render: v => <span className="text-red-400 font-bold">{v}</span> },
    { key: 'team', label: 'Club', width: 160 },
    { key: 'pts',  label: 'Pts',  width: 50, render: v => <span className="font-bold">{v}</span> },
    { key: 'gd',   label: 'GD',   width: 50 }, { key: 'w', label: 'W', width: 35 },
    { key: 'd',    label: 'D',    width: 35 }, { key: 'l', label: 'L', width: 35 },
    { key: 'gf',   label: 'GF',   width: 40 }, { key: 'ga', label: 'GA', width: 40 },
  ]

  const histColumns = [
    { key: 'season', label: 'Season', width: 80 },
    { key: 'survivalPts', label: '17th Pts', width: 80, render: v => <span className="text-pl-green">{v}</span> },
    { key: 'highestRelegated', label: 'Highest Rel. Pts', width: 120 },
    { key: 'lowestRelegated',  label: 'Lowest Rel. Pts',  width: 120 },
    { key: 'margin', label: 'Survival Margin', width: 120, render: v => <span className={v <= 3 ? 'text-red-400' : 'text-gray-300'}>{v}pts</span> },
    { key: 'relegated', label: 'Relegated', width: 280, render: v => v?.join(', ') },
  ]

  const avgSurvival = histRelStats.reduce((a, b) => a + b.survivalPts, 0) / (histRelStats.length || 1)
  const avgHighRel  = histRelStats.reduce((a, b) => a + b.highestRelegated, 0) / (histRelStats.length || 1)
  const smallestMargin = Math.min(...histRelStats.map(r => r.margin))
  const largestMargin  = Math.max(...histRelStats.map(r => r.margin))

  const survivalData = histRelStats.map(r => ({ season: r.season, survivalPts: r.survivalPts, highestRel: r.highestRelegated }))

  return (
    <div>
      <SectionHeader
        title="Relegation Zone"
        subtitle="Track the bottom-of-table battle across any season and compare historical relegation thresholds."
        right={
          <Select label="Season" value={season} onChange={s => { setSeason(s); setMatchday(38) }}
            options={allSeasons.map(s => ({ value: s, label: s }))} />
        }
      />

      {/* Historical KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <KPI label="Avg 17th-place Pts" value={fmt.dec(avgSurvival)} color="text-pl-green"/>
        <KPI label="Avg Highest Relegated" value={fmt.dec(avgHighRel)} color="text-red-400"/>
        <KPI label="Smallest Survival Margin" value={`${smallestMargin}pts`} color="text-red-400"/>
        <KPI label="Largest Survival Margin"  value={`${largestMargin}pts`} color="text-pl-green"/>
      </div>

      {/* Season bottom 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2">
          <Panel title={`${season} — Bottom of Table`}>
            <DataTable columns={tableColumns} data={bottom5}/>
            <div className="mt-3 text-xs font-mono">
              <span className="text-red-400">■ Relegated:</span> {relegated.map(t => t.team).join(', ')}
              {survived && <span className="text-pl-green ml-4">■ Survived: {survived.team} ({survived.pts}pts)</span>}
            </div>
          </Panel>
        </div>
        <div>
          <Panel title="Survival Margin">
            {finalTable.slice(14).map((t, i) => (
              <div key={t.team} className="flex items-center gap-2 py-1.5 border-b border-surface-border/30 last:border-0">
                <span className={`text-xs font-mono w-5 text-center ${t.pos >= 18 ? 'text-red-400' : t.pos === 17 ? 'text-yellow-400' : 'text-gray-500'}`}>{t.pos}</span>
                <span className="text-xs font-mono flex-1 truncate">{t.team}</span>
                <span className={`text-xs font-bold ${t.pos >= 18 ? 'text-red-400' : 'text-gray-200'}`}>{t.pts}pts</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>

      {/* Relegation battle progression */}
      <Panel title="Relegation Zone Progression" className="mb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
              <span>Matchday</span>
              <span className="text-red-400 font-bold">{Math.min(matchday, maxMD)} / {maxMD}</span>
            </div>
            <input type="range" min={1} max={maxMD || 38} value={Math.min(matchday, maxMD || 38)}
              onChange={e => setMatchday(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"/>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={zoneData} margin={{ right: 10 }}>
            <CartesianGrid {...GRID_PROPS}/>
            <XAxis dataKey="matchday" {...AXIS_PROPS}/>
            <YAxis {...AXIS_PROPS} reversed domain={[1, 20]}/>
            <Tooltip content={<CustomTooltip formatter={v => v ? `#${v}` : 'N/A'}/>}/>
            <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: 11 }}>{v}</span>}/>
            <ReferenceLine y={17.5} stroke="#f87171" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Relegation', fill: '#f87171', fontSize: 10 }}/>
            {Object.keys(colorMap).map(t => (
              <Line key={t} type="monotone" dataKey={t} name={t}
                    stroke={colorMap[t]} strokeWidth={2} dot={false} activeDot={{ r: 3 }} connectNulls/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {/* Historical survival threshold */}
      <Panel title="Historical Survival Threshold (17th place vs Highest Relegated)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={survivalData} margin={{ right: 10 }}>
            <CartesianGrid {...GRID_PROPS}/>
            <XAxis dataKey="season" {...AXIS_PROPS} angle={-35} textAnchor="end" height={55} interval={2}/>
            <YAxis {...AXIS_PROPS} domain={[20, 50]}/>
            <Tooltip content={<CustomTooltip formatter={v => `${v}pts`}/>}/>
            <Legend/>
            <Line type="monotone" dataKey="survivalPts" name="17th Place (pts)" stroke={COLORS.green} strokeWidth={2} dot={{ r: 3 }}/>
            <Line type="monotone" dataKey="highestRel" name="Highest Relegated (pts)" stroke={COLORS.red} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4"/>
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Historical Relegation Records" className="mt-5">
        <DataTable columns={histColumns} data={histRelStats}/>
      </Panel>
    </div>
  )
}
