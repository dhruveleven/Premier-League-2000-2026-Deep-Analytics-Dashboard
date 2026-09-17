import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { useData } from '../../data/DataContext'
import { computeLeagueKPIs, eraStats, ERAS } from '../../analytics/engine'
import { SectionHeader, Panel, Tabs, CustomTooltip, EraChip, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

const METRICS = {
  scoring: [
    { key: 'goalsPerMatch',           label: 'Goals/Match',         color: COLORS.green  },
    { key: 'homeGoalsPerMatch',        label: 'Home Goals/Match',    color: COLORS.lime   },
    { key: 'awayGoalsPerMatch',        label: 'Away Goals/Match',    color: COLORS.sky    },
    { key: 'firstHalfGoalsPerMatch',   label: '1st Half Goals/Match',color: COLORS.purple },
    { key: 'secondHalfGoalsPerMatch',  label: '2nd Half Goals/Match',color: COLORS.orange },
  ],
  results: [
    { key: 'homeWinPct', label: 'Home Win %', color: COLORS.green  },
    { key: 'drawPct',    label: 'Draw %',     color: COLORS.muted  },
    { key: 'awayWinPct', label: 'Away Win %', color: COLORS.sky    },
  ],
  attacking: [
    { key: 'shotsPerMatch',    label: 'Shots/Match', color: COLORS.amber  },
    { key: 'sotPerMatch',      label: 'SOT/Match',   color: COLORS.orange },
  ],
  discipline: [
    { key: 'foulsPerMatch',  label: 'Fouls/Match',   color: COLORS.red    },
    { key: 'yellowPerMatch', label: 'Yellow/Match',  color: COLORS.amber  },
    { key: 'redPerMatch',    label: 'Red/Match',     color: COLORS.orange },
  ],
  corners: [
    { key: 'cornersPerMatch', label: 'Corners/Match', color: COLORS.teal },
  ],
}

const TABS = [
  { id: 'scoring',    label: 'Scoring'      },
  { id: 'results',    label: 'Results'      },
  { id: 'attacking',  label: 'Attacking'    },
  { id: 'discipline', label: 'Discipline'   },
  { id: 'corners',    label: 'Corners'      },
]

function Insight({ text }) {
  return (
    <div className="flex gap-2 text-xs font-mono text-gray-400 border-l-2 border-pl-green/40 pl-3 py-1">
      <span className="text-pl-green shrink-0">→</span> {text}
    </div>
  )
}

const INSIGHTS = {
  scoring: [
    'Track whether total goals per match have increased or decreased across the 26-season window.',
    'Away goals trending up relative to home goals signals a reduction in pure home advantage.',
    'First-half vs second-half split reveals whether the game opens up or closes down after the break.',
  ],
  results: [
    'Home win % declining over time is a key indicator of eroding home advantage.',
    'Draw % changes reflect whether matches are becoming more decisive.',
    'Away win % rising alongside goal changes may indicate structural tactical shifts.',
  ],
  attacking: [
    'Shots per match rising without a corresponding SOT increase suggests lower-quality volume shooting.',
    'A widening gap between shots and SOT indicates declining shot quality or more speculative attempts.',
  ],
  discipline: [
    'Yellow card trends reflect both referee patterns and tactical foul intensity.',
    'Red card frequency affects match outcomes and is worth correlating with result distribution.',
    'Fouls per match declining may reflect less physical play or different officiating standards.',
  ],
  corners: [
    'Corners are a proxy for attacking territorial pressure — more corners often means more possession in dangerous areas.',
    'Season-level corner trends can signal shifts in attacking style across the division.',
  ],
}

export default function LeagueEvolution() {
  const { matches, allSeasons } = useData()
  const [tab, setTab] = useState('scoring')

  const seasonData = useMemo(() => {
    return allSeasons.map(s => {
      const sm = matches.filter(m => m.season === s)
      return { season: s, ...computeLeagueKPIs(sm) }
    })
  }, [matches, allSeasons])

  const eras = useMemo(() => eraStats(matches), [matches])

  const metrics = METRICS[tab]

  return (
    <div>
      <SectionHeader
        title="League Evolution"
        subtitle="How has Premier League football changed from 2000/01 to 2025/26? Explore scoring, results, attacking activity, and discipline across 26 seasons."
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Main trend chart */}
      <Panel className="mb-5">
        <div className="text-xs font-mono text-gray-400 mb-4 uppercase tracking-widest">Season-by-Season Trend</div>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={seasonData} margin={{ left: 0, right: 10 }}>
            <CartesianGrid {...GRID_PROPS}/>
            <XAxis dataKey="season" {...AXIS_PROPS} angle={-35} textAnchor="end" height={55} interval={2}/>
            <YAxis {...AXIS_PROPS}/>
            <Tooltip content={<CustomTooltip formatter={v => typeof v === 'number' ? v.toFixed(2) : v}/>}/>
            <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: 11 }}>{v}</span>}/>
            {metrics.map(m => (
              <Line key={m.key} type="monotone" dataKey={m.key} name={m.label}
                    stroke={m.color} strokeWidth={2} dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {/* Era comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Panel title={`Era Comparison — ${tab}`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={eras} margin={{ left: 0, right: 10 }}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="era" {...AXIS_PROPS}/>
              <YAxis {...AXIS_PROPS}/>
              <Tooltip content={<CustomTooltip formatter={v => typeof v === 'number' ? v.toFixed(2) : v}/>}/>
              <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: 11 }}>{v}</span>}/>
              {metrics.slice(0, 2).map(m => (
                <Bar key={m.key} dataKey={m.key} name={m.label} fill={m.color} radius={[3,3,0,0]} maxBarSize={30}/>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Era Summary Table">
          <div className="scroll-area" style={{ maxHeight: 260 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Era</th>
                  {metrics.map(m => <th key={m.key}>{m.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {eras.map(e => (
                  <tr key={e.era}>
                    <td className="text-pl-green font-semibold">{e.era}</td>
                    {metrics.map(m => <td key={m.key}>{typeof e[m.key] === 'number' ? e[m.key].toFixed(2) : '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Analytical insights */}
      <Panel title="Analytical Context">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(INSIGHTS[tab] || []).map((t, i) => <Insight key={i} text={t}/>)}
        </div>
        <p className="text-xs text-gray-600 font-mono mt-4">
          Note: All observations are descriptive. Correlation between metrics does not imply causation. Contextual factors (COVID-19 season 2019/20, rule changes, expansion of VAR) should be considered when interpreting abrupt changes.
        </p>
      </Panel>
    </div>
  )
}
