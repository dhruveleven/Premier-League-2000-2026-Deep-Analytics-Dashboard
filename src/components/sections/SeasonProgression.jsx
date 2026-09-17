import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { useData } from '../../data/DataContext'
import { buildSeasonProgression, teamMatches as getTeamMatches } from '../../analytics/engine'
import { SectionHeader, Select, Panel, CustomTooltip } from '../ui'
import { TEAM_COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

const ALL_TEAMS = 'All Teams'

const METRIC_OPTIONS = [
  { value: 'pts',         label: 'Cumulative Points'     },
  { value: 'gf',          label: 'Cumulative Goals Scored' },
  { value: 'ga',          label: 'Cumulative Goals Conceded' },
  { value: 'gd',          label: 'Goal Difference'       },
  { value: 'pos',         label: 'League Position'       },
  { value: 'rolling5pts', label: 'Rolling 5-Match Points' },
]

function rollingPoints(records, n) {
  const result = []
  for (let i = 0; i < records.length; i++) {
    const window = records.slice(Math.max(0, i - n + 1), i + 1)
    result.push(window.reduce((a, r) => a + r.pts, 0))
  }
  return result
}

export default function SeasonProgression() {
  const { matches, allSeasons, allTeams } = useData()
  const [season, setSeason] = useState(allSeasons[allSeasons.length - 1] || '')
  const [selectedTeams, setSelectedTeams] = useState([])
  const [metric, setMetric] = useState('pts')

  const seasonMatches = useMemo(() =>
    matches.filter(m => m.season === season), [matches, season])

  const progression = useMemo(() =>
    buildSeasonProgression(seasonMatches), [seasonMatches])

  const allTeamNames = useMemo(() => {
    if (!progression.length) return []
    return [...new Set(progression.flatMap(p => p.standings.map(s => s.team)))]
  }, [progression])

  const colorMap = useMemo(() => {
    const m = {}
    allTeamNames.forEach((t, i) => { m[t] = TEAM_COLORS[i % TEAM_COLORS.length] })
    return m
  }, [allTeamNames])

  const visibleTeams = selectedTeams.length > 0 ? selectedTeams : allTeamNames

  // Build per-team match-by-match records
  const teamProgressions = useMemo(() => {
    const result = {}
    for (const t of visibleTeams) {
      const tm = seasonMatches
        .filter(m => m.homeTeam === t || m.awayTeam === t)
        .sort((a, b) => a.matchday - b.matchday || a.date - b.date)
      let cPts = 0, cGF = 0, cGA = 0
      const records = tm.map((m, i) => {
        const isHome = m.homeTeam === t
        const gf = isHome ? m.fthg : m.ftag
        const ga = isHome ? m.ftag : m.fthg
        const pts = m.ftr === 'D' ? 1 : ((m.ftr === 'H') === isHome) ? 3 : 0
        cPts += pts; cGF += gf; cGA += ga
        return { matchday: m.matchday, pts: cPts, gf: cGF, ga: cGA, gd: cGF - cGA, matchPts: pts, idx: i }
      })
      const rolling5 = rollingPoints(records.map(r => ({ pts: r.matchPts })), 5)
      result[t] = records.map((r, i) => ({ ...r, rolling5pts: rolling5[i] }))
    }
    return result
  }, [seasonMatches, visibleTeams])

  // Build chart data: one row per matchday
  const chartData = useMemo(() => {
    const maxMD = Math.max(...Object.values(teamProgressions).flatMap(rs => rs.map(r => r.matchday)), 0)
    return Array.from({ length: maxMD }, (_, i) => {
      const md = i + 1
      const row = { matchday: md }
      for (const t of visibleTeams) {
        const rec = teamProgressions[t]?.filter(r => r.matchday <= md).slice(-1)[0]
        if (rec) row[t] = rec[metric]
      }
      return row
    })
  }, [teamProgressions, visibleTeams, metric])

  const toggleTeam = t => {
    setSelectedTeams(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    )
  }

  const isReversed = metric === 'pos' || metric === 'ga'

  return (
    <div>
      <SectionHeader
        title="Season Progression"
        subtitle="How any season was built — cumulative points, goals, goal difference, and rolling form across every matchday. Select specific teams to compare trajectories."
        right={<Select label="Season" value={season} onChange={s => { setSeason(s); setSelectedTeams([]) }}
          options={allSeasons.map(s => ({ value: s, label: s }))} />}
      />

      <div className="panel mb-5 flex flex-wrap gap-4 items-start">
        <Select label="Metric" value={metric} onChange={setMetric} options={METRIC_OPTIONS}/>
        <div>
          <div className="text-xs font-mono text-gray-500 mb-1.5 uppercase tracking-wider">Filter Teams ({selectedTeams.length || 'all'})</div>
          <div className="flex flex-wrap gap-1.5 max-w-2xl">
            {allTeamNames.map(t => (
              <button key={t} onClick={() => toggleTeam(t)}
                className={`text-xs font-mono px-2 py-0.5 rounded transition-colors ${
                  selectedTeams.includes(t) ? 'font-semibold' : 'bg-surface-muted text-gray-500 hover:text-gray-200'
                }`}
                style={selectedTeams.includes(t) ? { background: colorMap[t] + '33', color: colorMap[t], border: `1px solid ${colorMap[t]}55` } : {}}>
                {t.length > 12 ? t.slice(0, 12) + '…' : t}
              </button>
            ))}
            {selectedTeams.length > 0 && (
              <button onClick={() => setSelectedTeams([])} className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400">Clear</button>
            )}
          </div>
        </div>
      </div>

      <Panel title={`${METRIC_OPTIONS.find(o => o.value === metric)?.label} — ${season}`}>
        <ResponsiveContainer width="100%" height={460}>
          <LineChart data={chartData} margin={{ right: 20 }}>
            <CartesianGrid {...GRID_PROPS}/>
            <XAxis dataKey="matchday" {...AXIS_PROPS}
              label={{ value: 'Matchday', position: 'insideBottom', offset: -4, fill: '#6b7280', fontSize: 11 }}/>
            <YAxis {...AXIS_PROPS} reversed={isReversed}
              label={{ value: METRIC_OPTIONS.find(o => o.value === metric)?.label, angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}/>
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const pts = [...payload].sort((a, b) =>
                isReversed ? a.value - b.value : b.value - a.value)
              return (
                <div className="custom-tooltip max-h-56 overflow-auto" style={{ maxWidth: 200 }}>
                  <div className="text-gray-400 mb-1 text-xs">MD {label}</div>
                  {pts.slice(0, 12).map(p => (
                    <div key={p.dataKey} className="flex gap-2 items-center">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.stroke }}/>
                      <span className="text-gray-300 text-xs truncate" style={{ maxWidth: 100 }}>{p.name}</span>
                      <span style={{ color: p.stroke }} className="text-xs ml-auto">{typeof p.value === 'number' ? p.value.toFixed(0) : p.value}</span>
                    </div>
                  ))}
                </div>
              )
            }}/>
            {visibleTeams.map(t => (
              <Line key={t} type="monotone" dataKey={t} name={t}
                    stroke={colorMap[t]} strokeWidth={selectedTeams.includes(t) ? 2.5 : selectedTeams.length > 0 ? 0.8 : 1.5}
                    dot={false} activeDot={{ r: 3 }} connectNulls/>
            ))}
            {metric === 'pos' && (
              <>
                <ReferenceLine y={4.5}  stroke="#00FF87" strokeDasharray="3 3" opacity={0.3}/>
                <ReferenceLine y={17.5} stroke="#f87171" strokeDasharray="3 3" opacity={0.3}/>
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  )
}
