import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import { useData } from '../../data/DataContext'
import { computeLeagueKPIs } from '../../analytics/engine'
import { SectionHeader, Select, KPI, Panel, CustomTooltip, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS, RESULT_COLORS } from '../../utils/theme'

const ALL = 'All Seasons'

export default function LeagueOverview() {
  const { matches, allSeasons } = useData()
  const [season, setSeason] = useState(ALL)

  const filtered = useMemo(() =>
    season === ALL ? matches : matches.filter(m => m.season === season),
    [matches, season])

  const kpi = useMemo(() => computeLeagueKPIs(filtered), [filtered])

  const resultData = [
    { name: 'Home Win', value: kpi.hWins   || 0, pct: kpi.homeWinPct || 0, color: COLORS.green },
    { name: 'Draw',     value: kpi.draws   || 0, pct: kpi.drawPct    || 0, color: COLORS.muted },
    { name: 'Away Win', value: kpi.aWins   || 0, pct: kpi.awayWinPct || 0, color: COLORS.sky   },
  ]

  const statsBar = [
    { stat: 'Goals/Match',    value: kpi.goalsPerMatch  || 0 },
    { stat: 'Shots/Match',    value: kpi.shotsPerMatch  || 0 },
    { stat: 'SOT/Match',      value: kpi.sotPerMatch    || 0 },
    { stat: 'Corners/Match',  value: kpi.cornersPerMatch|| 0 },
    { stat: 'Fouls/Match',    value: kpi.foulsPerMatch  || 0 },
    { stat: 'Yellows/Match',  value: kpi.yellowPerMatch || 0 },
    { stat: 'Reds/Match',     value: kpi.redPerMatch    || 0 },
  ]

  const halfData = [
    { half: 'First Half',  goals: kpi.firstHalfGoalsPerMatch  || 0 },
    { half: 'Second Half', goals: kpi.secondHalfGoalsPerMatch || 0 },
  ]

  const RADIAN = Math.PI / 180
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
                fontSize={14} fontFamily="League Spartan">
        {pct.toFixed(1)}%
      </text>
    )
  }

  return (
    <div>
      <SectionHeader
        title="League Overview"
        subtitle="High-level statistics for the selected period. Home advantage, scoring rates, and disciplinary profile at a glance."
        right={
          <Select value={season} onChange={setSeason}
            options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]}
            label="Period" />
        }
      />

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="Matches"          value={(kpi.matches || 0).toLocaleString()} color="text-gray-100" />
        <KPI label="Total Goals"      value={(kpi.totalGoals || 0).toLocaleString()} />
        <KPI label="Goals / Match"    value={fmt.dec(kpi.goalsPerMatch || 0)} />
        <KPI label="Home Win %"       value={fmt.pct(kpi.homeWinPct || 0)} color="text-pl-green" />
        <KPI label="Draw %"           value={fmt.pct(kpi.drawPct || 0)} color="text-gray-300" />
        <KPI label="Away Win %"       value={fmt.pct(kpi.awayWinPct || 0)} color="text-pl-sky" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        <KPI label="Home Goals/Match" value={fmt.dec(kpi.homeGoalsPerMatch || 0)} color="text-pl-green" />
        <KPI label="Away Goals/Match" value={fmt.dec(kpi.awayGoalsPerMatch || 0)} color="text-pl-sky" />
        <KPI label="Shots / Match"    value={fmt.dec(kpi.shotsPerMatch || 0)} color="text-amber-400" />
        <KPI label="SOT / Match"      value={fmt.dec(kpi.sotPerMatch || 0)} color="text-amber-400" />
        <KPI label="Corners / Match"  value={fmt.dec(kpi.cornersPerMatch || 0)} color="text-gray-300" />
        <KPI label="Fouls / Match"    value={fmt.dec(kpi.foulsPerMatch || 0)} color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Result distribution pie */}
        <Panel title="Result Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={resultData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                   outerRadius={100} labelLine={false} label={renderLabel}>
                {resultData.map((e, i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={(v, n) => `${v.toLocaleString()} (${resultData.find(d=>d.name===n)?.pct.toFixed(1)}%)`}/>}/>
              <Legend formatter={(v, e) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-around mt-2">
            {resultData.map(d => (
              <div key={d.name} className="text-center">
                <div className="font-display text-xl font-bold" style={{ color: d.color }}>{d.pct.toFixed(1)}%</div>
                <div className="text-xs font-mono text-gray-500">{d.name}</div>
                <div className="text-xs font-mono text-gray-400">{d.value.toLocaleString()} matches</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Match statistics bar */}
        <Panel title="Match Statistics (per game)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statsBar} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid {...GRID_PROPS} horizontal={false} vertical/>
              <XAxis type="number" {...AXIS_PROPS} />
              <YAxis dataKey="stat" type="category" {...AXIS_PROPS} width={100}/>
              <Tooltip content={<CustomTooltip formatter={v => v.toFixed(2)}/>}/>
              <Bar dataKey="value" fill={COLORS.green} radius={[0, 3, 3, 0]} maxBarSize={20}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Goals home vs away */}
        <Panel title="Goals: Home vs Away (per match)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { side: 'Home', goals: kpi.homeGoalsPerMatch || 0 },
              { side: 'Away', goals: kpi.awayGoalsPerMatch || 0 },
            ]}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="side" {...AXIS_PROPS}/>
              <YAxis {...AXIS_PROPS}/>
              <Tooltip content={<CustomTooltip formatter={v => v.toFixed(2)}/>}/>
              <Bar dataKey="goals" radius={[4, 4, 0, 0]} maxBarSize={60}>
                <Cell fill={COLORS.green}/>
                <Cell fill={COLORS.sky}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* First vs second half goals */}
        <Panel title="Goals by Half (per match)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={halfData}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="half" {...AXIS_PROPS}/>
              <YAxis {...AXIS_PROPS}/>
              <Tooltip content={<CustomTooltip formatter={v => v.toFixed(2)}/>}/>
              <Bar dataKey="goals" fill={COLORS.purple} radius={[4, 4, 0, 0]} maxBarSize={60}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Shot conversion */}
        <Panel title="Shot Efficiency">
          <div className="flex flex-col justify-center h-40 gap-4 px-2">
            {[
              { label: 'Shot Conversion', value: kpi.shotConversion || 0, color: COLORS.green },
              { label: 'SOT Conversion',  value: kpi.sotConversion  || 0, color: COLORS.sky   },
              { label: 'SOT Rate',        value: kpi.sotPerMatch > 0 && kpi.shotsPerMatch > 0 ? kpi.sotPerMatch / kpi.shotsPerMatch : 0, color: COLORS.purple },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">{label}</span>
                  <span style={{ color }}>{(value * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, value * 100)}%`, background: color }}/>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
