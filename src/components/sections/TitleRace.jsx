import React, { useMemo, useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { useData } from '../../data/DataContext'
import { buildSeasonProgression, buildLeagueTable } from '../../analytics/engine'
import { SectionHeader, Select, Panel, DataTable } from '../ui'
import { TEAM_COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

export default function TitleRace() {
  const { matches, allSeasons, allTeams } = useData()
  const [season, setSeason] = useState(allSeasons[allSeasons.length - 1] || '')
  const [matchday, setMatchday] = useState(38)
  const [highlight, setHighlight] = useState(new Set())
  const [view, setView] = useState('position') // 'position' | 'points'

  const seasonMatches = useMemo(() =>
    matches.filter(m => m.season === season), [matches, season])

  const progression = useMemo(() =>
    buildSeasonProgression(seasonMatches), [seasonMatches])

  const maxMD = progression.length

  // Build chart data: for each matchday, each team's position/points
  const allTeamNames = useMemo(() => {
    if (!progression.length) return []
    return [...new Set(progression.flatMap(p => p.standings.map(s => s.team)))]
  }, [progression])

  const colorMap = useMemo(() => {
    const m = {}
    allTeamNames.forEach((t, i) => { m[t] = TEAM_COLORS[i % TEAM_COLORS.length] })
    return m
  }, [allTeamNames])

  const chartData = useMemo(() => {
    return progression.slice(0, matchday).map(p => {
      const row = { matchday: p.matchday }
      p.standings.forEach(s => {
        row[`${s.team}_pos`] = s.pos
        row[`${s.team}_pts`] = s.pts
      })
      return row
    })
  }, [progression, matchday])

  const currentStandings = useMemo(() => {
    if (!progression.length) return []
    const entry = progression[Math.min(matchday, progression.length) - 1]
    return entry?.standings || []
  }, [progression, matchday])

  const finalTable = useMemo(() => buildLeagueTable(seasonMatches), [seasonMatches])

  const toggleHighlight = useCallback(team => {
    setHighlight(prev => {
      const next = new Set(prev)
      next.has(team) ? next.delete(team) : next.add(team)
      return next
    })
  }, [])

  const visibleTeams = highlight.size > 0 ? allTeamNames.filter(t => highlight.has(t)) : allTeamNames

  const tableColumns = [
    { key: 'pos',  label: '#',    width: 35 },
    { key: 'team', label: 'Club', width: 160, render: (v, r) => (
      <span className={r.pos === 1 ? 'text-pl-green font-bold' : r.pos >= 18 ? 'text-red-400' : ''}>{v}</span>
    )},
    { key: 'p',   label: 'P',  width: 40 },
    { key: 'pts', label: 'Pts',width: 50, render: v => <span className="font-bold">{v}</span> },
    { key: 'gd',  label: 'GD', width: 50, render: v => <span className={v >= 0 ? 'text-pl-green' : 'text-red-400'}>{v > 0 ? '+' : ''}{v}</span> },
    { key: 'w',   label: 'W',  width: 35 },
    { key: 'd',   label: 'D',  width: 35 },
    { key: 'l',   label: 'L',  width: 35 },
    { key: 'gf',  label: 'GF', width: 40 },
    { key: 'ga',  label: 'GA', width: 40 },
  ]

  if (!season) return null

  return (
    <div>
      <SectionHeader
        title="Title Race"
        subtitle="Interactive season progression — drag the slider to replay how the table developed matchday by matchday."
        right={
          <Select label="Season" value={season} onChange={s => { setSeason(s); setMatchday(38); setHighlight(new Set()) }}
            options={allSeasons.map(s => ({ value: s, label: s }))} />
        }
      />

      {/* Controls */}
      <div className="panel mb-5">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex-1 min-w-0 sm:min-w-48">
            <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
              <span>Matchday</span>
              <span className="text-pl-green font-bold">{Math.min(matchday, maxMD)} / {maxMD}</span>
            </div>
            <input type="range" min={1} max={maxMD || 38} value={Math.min(matchday, maxMD || 38)}
              onChange={e => setMatchday(Number(e.target.value))}
              className="w-full accent-pl-green cursor-pointer"/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('position')}
              className={`btn text-xs py-1 ${view === 'position' ? 'btn-primary' : 'btn-secondary'}`}>Position</button>
            <button onClick={() => setView('points')}
              className={`btn text-xs py-1 ${view === 'points' ? 'btn-primary' : 'btn-secondary'}`}>Points</button>
          </div>
          <div>
            <div className="text-xs font-mono text-gray-500 mb-1">Highlight teams</div>
            <div className="flex flex-wrap gap-1.5 max-w-lg">
              {allTeamNames.slice(0, 20).map(t => (
                <button key={t} onClick={() => toggleHighlight(t)}
                  className={`text-xs font-mono px-2 py-0.5 rounded transition-colors ${
                    highlight.has(t) ? 'font-semibold' : 'bg-surface-muted text-gray-500 hover:text-gray-200'
                  }`}
                  style={highlight.has(t) ? { background: colorMap[t] + '33', color: colorMap[t], border: `1px solid ${colorMap[t]}66` } : {}}>
                  {t.length > 12 ? t.slice(0, 12) + '…' : t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Line chart */}
        <div className="lg:col-span-2">
          <Panel title={view === 'position' ? 'League Position by Matchday' : 'Cumulative Points by Matchday'}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ right: 10 }}>
                <CartesianGrid {...GRID_PROPS}/>
                <XAxis dataKey="matchday" {...AXIS_PROPS} label={{ value: 'Matchday', position: 'insideBottom', offset: -4, fill: '#6b7280', fontSize: 11 }}/>
                <YAxis {...AXIS_PROPS} reversed={view === 'position'} domain={view === 'position' ? [1, 20] : undefined}
                  label={{ value: view === 'position' ? 'Position' : 'Points', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}/>
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const pts = [...payload].sort((a, b) => view === 'position' ? a.value - b.value : b.value - a.value)
                  return (
                    <div className="custom-tooltip max-h-48 overflow-auto" style={{ maxWidth: 200 }}>
                      <div className="text-gray-400 mb-1 text-xs">MD {label}</div>
                      {pts.slice(0, 10).map(p => (
                        <div key={p.dataKey} className="flex gap-2 items-center">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.stroke }}/>
                          <span className="text-gray-300 text-xs truncate" style={{ maxWidth: 100 }}>{p.name}</span>
                          <span style={{ color: p.stroke }} className="text-xs ml-auto">{view === 'position' ? `#${p.value}` : `${p.value}pts`}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}/>
                {visibleTeams.map(t => (
                  <Line key={t} type="monotone"
                    dataKey={`${t}_${view === 'position' ? 'pos' : 'pts'}`}
                    name={t} stroke={colorMap[t]}
                    strokeWidth={highlight.has(t) ? 2.5 : highlight.size > 0 ? 0.5 : 1.5}
                    dot={false} activeDot={{ r: 3 }}/>
                ))}
                {view === 'position' && (
                  <>
                    <ReferenceLine y={4.5} stroke="#00FF87" strokeDasharray="4 4" strokeWidth={1} opacity={0.4}/>
                    <ReferenceLine y={17.5} stroke="#f87171" strokeDasharray="4 4" strokeWidth={1} opacity={0.4}/>
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Live standings */}
        <div>
          <Panel title={`Standings at MD ${Math.min(matchday, maxMD)}`}>
            <div className="scroll-area" style={{ maxHeight: 420 }}>
              {currentStandings.map(s => (
                <div key={s.team} className="flex items-center gap-2 py-1.5 border-b border-surface-border/30 last:border-0">
                  <span className={`text-xs font-mono w-5 text-center font-bold ${
                    s.pos === 1 ? 'text-pl-green' : s.pos >= 18 ? 'text-red-400' : 'text-gray-500'}`}>{s.pos}</span>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colorMap[s.team] || '#666' }}/>
                  <span className="text-xs font-mono flex-1 truncate">{s.team}</span>
                  <span className="text-xs font-bold text-gray-100">{s.pts}pts</span>
                  <span className={`text-xs font-mono ${s.gd >= 0 ? 'text-pl-green' : 'text-red-400'}`}>{s.gd > 0 ? '+' : ''}{s.gd}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Title analysis */}
      <Panel title="Season Summary">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {finalTable.slice(0, 1).map(t => (
            <div key={t.team} className="text-center p-3 bg-pl-green/10 border border-pl-green/20 rounded-lg">
              <div className="text-xs font-mono text-pl-green mb-1">Champions</div>
              <div className="font-display font-bold text-gray-100">{t.team}</div>
              <div className="font-display text-2xl font-bold text-pl-green">{t.pts}pts</div>
            </div>
          ))}
          {finalTable[1] && (
            <div className="text-center p-3 bg-surface-raised border border-surface-border rounded-lg">
              <div className="text-xs font-mono text-gray-400 mb-1">Runners Up</div>
              <div className="font-display font-bold text-gray-100">{finalTable[1].team}</div>
              <div className="font-display text-2xl font-bold text-gray-300">{finalTable[1].pts}pts</div>
            </div>
          )}
          {finalTable.length >= 18 && (
            <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="text-xs font-mono text-red-400 mb-1">Relegated</div>
              {finalTable.slice(-3).map(t => (
                <div key={t.team} className="font-mono text-xs text-red-300">{t.team} ({t.pts})</div>
              ))}
            </div>
          )}
          {finalTable[3] && (
            <div className="text-center p-3 bg-surface-raised border border-surface-border rounded-lg">
              <div className="text-xs font-mono text-gray-400 mb-1">4th Place</div>
              <div className="font-display font-bold text-gray-100">{finalTable[3].team}</div>
              <div className="font-display text-2xl font-bold text-gray-300">{finalTable[3].pts}pts</div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}
