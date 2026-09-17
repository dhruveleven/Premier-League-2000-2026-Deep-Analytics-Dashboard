import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts'
import { useData } from '../../data/DataContext'
import { computeTeamStats, teamMatches as getTeamMatches, computeRefereeStats, avg, pct } from '../../analytics/engine'
import { SectionHeader, Select, Panel, KPI, DataTable, CustomTooltip, fmt } from '../ui'
import { COLORS, AXIS_PROPS, GRID_PROPS } from '../../utils/theme'

const ALL = 'All Seasons'

// ── Section 12: Corner Analysis ──────────────────────────────────────────────
export function CornerAnalysis() {
  const { matches, allSeasons, allTeams } = useData()
  const [season, setSeason] = useState(ALL)

  const filtered = useMemo(() =>
    season === ALL ? matches : matches.filter(m => m.season === season),
    [matches, season])

  const avgH = avg(filtered.map(m => m.hc))
  const avgA = avg(filtered.map(m => m.ac))
  const avgT = avg(filtered.map(m => m.totalCorners))

  // Team corner stats
  const teamCorners = useMemo(() =>
    allTeams.map(t => {
      const tm = getTeamMatches(filtered, t)
      if (tm.length < 5) return null
      const myCK = tm.reduce((a, m) => a + (m.homeTeam === t ? m.hc : m.ac), 0)
      const opCK = tm.reduce((a, m) => a + (m.homeTeam === t ? m.ac : m.hc), 0)
      const wins = tm.filter(m => (m.homeTeam === t ? m.ftr === 'H' : m.ftr === 'A')).length
      const ckWin = tm.filter(m => (m.homeTeam === t ? m.hc > m.ac : m.ac > m.hc)).length
      return {
        team: t, matches: tm.length,
        ckPerMatch: myCK / tm.length,
        opCKPerMatch: opCK / tm.length,
        ckDiff: (myCK - opCK) / tm.length,
        winPct: pct(wins, tm.length),
        ckBattleWinPct: pct(ckWin, tm.length),
      }
    }).filter(Boolean).sort((a, b) => b.ckPerMatch - a.ckPerMatch),
    [filtered, allTeams])

  // Season trend
  const trendData = useMemo(() => allSeasons.map(s => {
    const sm = matches.filter(m => m.season === s)
    return { season: s, home: avg(sm.map(m => m.hc)), away: avg(sm.map(m => m.ac)), total: avg(sm.map(m => m.totalCorners)) }
  }), [matches, allSeasons])

  // Corner battle vs result
  const cornerWinData = [
    { label: 'Won CK Battle (Home)', matches: filtered.filter(m => m.hc > m.ac), col: 'hWin' },
    { label: 'Won CK Battle (Away)', matches: filtered.filter(m => m.ac > m.hc), col: 'aWin' },
  ].map(c => ({
    label: c.label, total: c.matches.length,
    'Home Win': pct(c.matches.filter(m => m.ftr === 'H').length, c.matches.length),
    'Draw':     pct(c.matches.filter(m => m.ftr === 'D').length, c.matches.length),
    'Away Win': pct(c.matches.filter(m => m.ftr === 'A').length, c.matches.length),
  }))

  const cornerColumns = [
    { key: 'team',       label: 'Team',         width: 160 },
    { key: 'ckPerMatch', label: 'CK Won/Match',  width: 110, render: v => <span className="text-pl-green">{v.toFixed(2)}</span> },
    { key: 'opCKPerMatch',label: 'CK Conceded',  width: 110, render: v => v.toFixed(2) },
    { key: 'ckDiff',     label: 'CK Diff/Match', width: 110, render: v => <span className={v >= 0 ? 'text-pl-green' : 'text-red-400'}>{v > 0 ? '+' : ''}{v.toFixed(2)}</span> },
    { key: 'winPct',     label: 'Win %',          width: 80,  render: v => `${v.toFixed(1)}%` },
    { key: 'matches',    label: 'Matches',         width: 70 },
  ]

  return (
    <div>
      <SectionHeader
        title="Corner Analysis"
        subtitle="Corner generation, concession, differential, and the relationship between corner advantage and match results."
        right={<Select label="Period" value={season} onChange={setSeason} options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]} />}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <KPI label="Home Corners/Match" value={fmt.dec(avgH)} color="text-pl-green"/>
        <KPI label="Away Corners/Match" value={fmt.dec(avgA)} color="text-pl-sky"/>
        <KPI label="Total Corners/Match"value={fmt.dec(avgT)} color="text-gray-100"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Panel title="Corners per Match by Season">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData} margin={{ right: 10 }}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="season" {...AXIS_PROPS} angle={-35} textAnchor="end" height={55} interval={2}/>
              <YAxis {...AXIS_PROPS}/>
              <Tooltip content={<CustomTooltip formatter={v => v.toFixed(2)}/>}/>
              <Legend/>
              <Line type="monotone" dataKey="home"  name="Home" stroke={COLORS.green} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="away"  name="Away" stroke={COLORS.sky}   strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="total" name="Total"stroke={COLORS.muted}  strokeWidth={1} dot={false} strokeDasharray="4 4"/>
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Corner Advantage vs Result">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cornerWinData} margin={{ bottom: 10 }}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="label" {...AXIS_PROPS} tick={{ fontSize: 10 }}/>
              <YAxis {...AXIS_PROPS} tickFormatter={v => `${v}%`}/>
              <Tooltip content={<CustomTooltip formatter={v => `${v.toFixed(1)}%`}/>}/>
              <Legend/>
              <Bar dataKey="Home Win" stackId="a" fill={COLORS.green} maxBarSize={50}/>
              <Bar dataKey="Draw"     stackId="a" fill={COLORS.muted}  maxBarSize={50}/>
              <Bar dataKey="Away Win" stackId="a" fill={COLORS.sky}    maxBarSize={50}/>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs font-mono text-gray-600 mt-2">Descriptive association — winning the corner battle is correlated with, but does not cause, winning the match.</p>
        </Panel>
      </div>
      <Panel title="Team Corner Rankings">
        <DataTable columns={cornerColumns} data={teamCorners}/>
      </Panel>
    </div>
  )
}

// ── Section 13: Discipline Analysis ──────────────────────────────────────────
export function DisciplineAnalysis() {
  const { matches, allSeasons, allTeams } = useData()
  const [season, setSeason] = useState(ALL)

  const filtered = useMemo(() =>
    season === ALL ? matches : matches.filter(m => m.season === season),
    [matches, season])

  const avgY = avg(filtered.map(m => m.totalYellow))
  const avgR = avg(filtered.map(m => m.totalRed))
  const avgF = avg(filtered.map(m => m.totalFouls))

  // Red card effect on result
  const redCardEffect = useMemo(() => {
    const homeRed = filtered.filter(m => m.hr > 0 && m.ar === 0)
    const awayRed = filtered.filter(m => m.ar > 0 && m.hr === 0)
    const noRed   = filtered.filter(m => m.hr === 0 && m.ar === 0)
    return [
      { cat: 'No Red Cards',   hW: pct(noRed.filter(m=>m.ftr==='H').length, noRed.length),   dr: pct(noRed.filter(m=>m.ftr==='D').length, noRed.length),   aW: pct(noRed.filter(m=>m.ftr==='A').length, noRed.length),   n: noRed.length },
      { cat: 'Home Red Card',  hW: pct(homeRed.filter(m=>m.ftr==='H').length, homeRed.length), dr: pct(homeRed.filter(m=>m.ftr==='D').length, homeRed.length), aW: pct(homeRed.filter(m=>m.ftr==='A').length, homeRed.length), n: homeRed.length },
      { cat: 'Away Red Card',  hW: pct(awayRed.filter(m=>m.ftr==='H').length, awayRed.length), dr: pct(awayRed.filter(m=>m.ftr==='D').length, awayRed.length), aW: pct(awayRed.filter(m=>m.ftr==='A').length, awayRed.length), n: awayRed.length },
    ]
  }, [filtered])

  const trendData = useMemo(() => allSeasons.map(s => {
    const sm = matches.filter(m => m.season === s)
    return { season: s, yellow: avg(sm.map(m => m.totalYellow)), red: avg(sm.map(m => m.totalRed)), fouls: avg(sm.map(m => m.totalFouls)) }
  }), [matches, allSeasons])

  const teamDiscipline = useMemo(() =>
    allTeams.map(t => {
      const tm = getTeamMatches(filtered, t)
      if (tm.length < 5) return null
      const myY = tm.reduce((a, m) => a + (m.homeTeam === t ? m.hy : m.ay), 0)
      const myR = tm.reduce((a, m) => a + (m.homeTeam === t ? m.hr : m.ar), 0)
      const myF = tm.reduce((a, m) => a + (m.homeTeam === t ? m.hf : m.af), 0)
      return { team: t, matches: tm.length, yellowPerMatch: myY/tm.length, redPerMatch: myR/tm.length, foulsPerMatch: myF/tm.length, foulPerCard: myY > 0 ? myF/myY : 0 }
    }).filter(Boolean).sort((a, b) => b.yellowPerMatch - a.yellowPerMatch),
    [filtered, allTeams])

  const discColumns = [
    { key: 'team',          label: 'Team',         width: 160 },
    { key: 'foulsPerMatch', label: 'Fouls/Match',  width: 100, render: v => v.toFixed(2) },
    { key: 'yellowPerMatch',label: 'Yellow/Match', width: 100, render: v => <span className="text-yellow-400">{v.toFixed(2)}</span> },
    { key: 'redPerMatch',   label: 'Red/Match',    width: 90,  render: v => <span className="text-red-400">{v.toFixed(3)}</span> },
    { key: 'foulPerCard',   label: 'Fouls/Yellow', width: 100, render: v => v.toFixed(1) },
    { key: 'matches',       label: 'Matches',      width: 70 },
  ]

  return (
    <div>
      <SectionHeader
        title="Discipline Analysis"
        subtitle="Fouls, yellow and red cards — team profiles, league trends, and the descriptive relationship between cards and match outcomes."
        right={<Select label="Period" value={season} onChange={setSeason} options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]} />}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <KPI label="Fouls/Match"  value={fmt.dec(avgF)} color="text-orange-400"/>
        <KPI label="Yellow/Match" value={fmt.dec(avgY)} color="text-yellow-400"/>
        <KPI label="Red/Match"    value={fmt.dec(avgR)} color="text-red-400"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Panel title="Disciplinary Trends by Season">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ right: 10 }}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="season" {...AXIS_PROPS} angle={-35} textAnchor="end" height={55} interval={2}/>
              <YAxis {...AXIS_PROPS}/>
              <Tooltip content={<CustomTooltip formatter={v => v.toFixed(2)}/>}/>
              <Legend/>
              <Line type="monotone" dataKey="fouls"  name="Fouls/Match"  stroke={COLORS.orange} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="yellow" name="Yellow/Match" stroke={COLORS.amber}  strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="red"    name="Red/Match"    stroke={COLORS.red}    strokeWidth={1.5} dot={false} strokeDasharray="3 3"/>
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Red Card Effect on Match Result">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={redCardEffect.map(d => ({ cat: d.cat, 'Home Win': d.hW, Draw: d.dr, 'Away Win': d.aW }))}>
              <CartesianGrid {...GRID_PROPS}/>
              <XAxis dataKey="cat" {...AXIS_PROPS} tick={{ fontSize: 10 }}/>
              <YAxis {...AXIS_PROPS} tickFormatter={v => `${v.toFixed(0)}%`}/>
              <Tooltip content={<CustomTooltip formatter={v => `${v.toFixed(1)}%`}/>}/>
              <Legend/>
              <Bar dataKey="Home Win" stackId="a" fill={COLORS.green} maxBarSize={50}/>
              <Bar dataKey="Draw"     stackId="a" fill={COLORS.muted}  maxBarSize={50}/>
              <Bar dataKey="Away Win" stackId="a" fill={COLORS.sky}    maxBarSize={50}/>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs font-mono text-gray-600 mt-2">Descriptive association only. Red cards in this dataset cannot be attributed to a specific match minute or context.</p>
        </Panel>
      </div>
      <Panel title="Team Disciplinary Profile">
        <DataTable columns={discColumns} data={teamDiscipline}/>
      </Panel>
    </div>
  )
}

// ── Section 14: Referee Analysis ─────────────────────────────────────────────
export function RefereeAnalysis() {
  const { matches, allTeams, allReferees } = useData()
  const [referee, setReferee] = useState(allReferees[0] || '')
  const [team, setTeam]       = useState(allTeams[0] || '')

  const refStats = useMemo(() => computeRefereeStats(matches), [matches])

  const selectedRef = useMemo(() => refStats.find(r => r.referee === referee), [refStats, referee])

  // Referee × team
  const refTeamMatches = useMemo(() =>
    matches.filter(m => m.referee === referee && (m.homeTeam === team || m.awayTeam === team)),
    [matches, referee, team])

  const refTeamSummary = useMemo(() => {
    if (!refTeamMatches.length) return null
    const wins = refTeamMatches.filter(m => (m.homeTeam === team ? m.ftr === 'H' : m.ftr === 'A')).length
    const draws = refTeamMatches.filter(m => m.ftr === 'D').length
    const losses = refTeamMatches.length - wins - draws
    const myY = refTeamMatches.reduce((a, m) => a + (m.homeTeam === team ? m.hy : m.ay), 0)
    const myR = refTeamMatches.reduce((a, m) => a + (m.homeTeam === team ? m.hr : m.ar), 0)
    const myF = refTeamMatches.reduce((a, m) => a + (m.homeTeam === team ? m.hf : m.af), 0)
    return { wins, draws, losses, myY, myR, myF, n: refTeamMatches.length }
  }, [refTeamMatches, team])

  const refColumns = [
    { key: 'referee',    label: 'Referee',     width: 160 },
    { key: 'matches',    label: 'Matches',     width: 70  },
    { key: 'homeWinPct', label: 'H Win %',     width: 80,  render: v => `${v.toFixed(1)}%` },
    { key: 'drawPct',    label: 'Draw %',      width: 80,  render: v => `${v.toFixed(1)}%` },
    { key: 'awayWinPct', label: 'A Win %',     width: 80,  render: v => `${v.toFixed(1)}%` },
    { key: 'avgFouls',   label: 'Fouls/M',     width: 80,  render: v => v.toFixed(2) },
    { key: 'avgYellow',  label: 'Yellow/M',    width: 85,  render: v => <span className="text-yellow-400">{v.toFixed(2)}</span> },
    { key: 'avgRed',     label: 'Red/M',       width: 80,  render: v => <span className="text-red-400">{v.toFixed(3)}</span> },
    { key: 'cardBias',   label: 'Home−Away Yellow/M', width: 140, render: v => <span className={Math.abs(v) > 0.3 ? 'text-amber-400' : 'text-gray-400'}>{v > 0 ? '+' : ''}{v.toFixed(2)}</span> },
  ]

  return (
    <div>
      <SectionHeader
        title="Referee Analysis"
        subtitle="Descriptive referee statistics — match tendencies, card rates, and result distributions. Patterns here are descriptive only and do not constitute evidence of referee bias."
      />
      <div className="panel border-yellow-500/20 bg-yellow-500/5 mb-5">
        <p className="text-xs font-mono text-yellow-400">
          Important: Raw referee averages are NOT evidence of bias. Referees are assigned to different matches, venues, and competitive contexts. The data cannot control for these factors. This section surfaces descriptive patterns for exploration only.
        </p>
      </div>

      {/* Full referee table */}
      <Panel title="All Referees (ranked by matches)" className="mb-5">
        <DataTable columns={refColumns} data={refStats}/>
      </Panel>

      {/* Referee detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Panel title="Referee Profile">
          <Select label="Referee" value={referee} onChange={setReferee}
            options={allReferees.map(r => ({ value: r, label: r }))} className="mb-4"/>
          {selectedRef && (
            <div className="space-y-2">
              {[
                { label: 'Matches',     value: selectedRef.matches },
                { label: 'Home Win %',  value: `${selectedRef.homeWinPct.toFixed(1)}%` },
                { label: 'Draw %',      value: `${selectedRef.drawPct.toFixed(1)}%` },
                { label: 'Away Win %',  value: `${selectedRef.awayWinPct.toFixed(1)}%` },
                { label: 'Fouls/Match', value: selectedRef.avgFouls.toFixed(2) },
                { label: 'Yellow/Match',value: selectedRef.avgYellow.toFixed(2) },
                { label: 'Red/Match',   value: selectedRef.avgRed.toFixed(3) },
                { label: 'Home Yellow/M', value: (selectedRef.homeYellow / selectedRef.matches).toFixed(2) },
                { label: 'Away Yellow/M', value: (selectedRef.awayYellow / selectedRef.matches).toFixed(2) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs font-mono border-b border-surface-border/30 pb-1">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-gray-100">{value}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Referee × Team">
          <div className="flex gap-3 mb-4 flex-wrap">
            <Select label="Referee" value={referee} onChange={setReferee}
              options={allReferees.map(r => ({ value: r, label: r }))} />
            <Select label="Team" value={team} onChange={setTeam}
              options={allTeams.map(t => ({ value: t, label: t }))} />
          </div>
          {refTeamSummary ? (
            <div className="space-y-2">
              <div className="text-xs font-mono text-gray-400">
                {referee} officiating {team}: <span className="text-gray-100">{refTeamSummary.n} matches</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                <div className="panel text-center"><div className="font-display text-xl font-bold text-pl-green">{refTeamSummary.wins}</div><div className="text-xs font-mono text-gray-500">Wins</div></div>
                <div className="panel text-center"><div className="font-display text-xl font-bold text-gray-300">{refTeamSummary.draws}</div><div className="text-xs font-mono text-gray-500">Draws</div></div>
                <div className="panel text-center"><div className="font-display text-xl font-bold text-red-400">{refTeamSummary.losses}</div><div className="text-xs font-mono text-gray-500">Losses</div></div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs font-mono"><span className="text-gray-400">Yellows received</span><span className="text-yellow-400">{refTeamSummary.myY}</span></div>
                <div className="flex justify-between text-xs font-mono"><span className="text-gray-400">Reds received</span><span className="text-red-400">{refTeamSummary.myR}</span></div>
                <div className="flex justify-between text-xs font-mono"><span className="text-gray-400">Fouls committed</span><span className="text-orange-400">{refTeamSummary.myF}</span></div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 font-mono text-xs py-4 text-center">No matches found</p>
          )}
        </Panel>
      </div>
    </div>
  )
}
