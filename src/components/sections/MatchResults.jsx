import React, { useState, useMemo } from 'react'
import { useData } from '../../data/DataContext'
import { SectionHeader, Select, DataTable, ResultBadge, Score, Panel, KPI, fmt } from '../ui'

const ALL = 'All'

function MatchDetailPanel({ match, onClose }) {
  if (!match) return null
  const isHomeWin = match.ftr === 'H', isAway = match.ftr === 'A'
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-pitch-900 border border-surface-border rounded-xl p-6 max-w-2xl w-full"
           onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div className="font-mono text-xs text-gray-400">{match.season} · MD{match.matchday} · {match.date?.toLocaleDateString('en-GB')}</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 font-mono text-lg">×</button>
        </div>
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-right">
            <div className={`font-display text-xl font-bold ${isHomeWin ? 'text-pl-green' : 'text-gray-300'}`}>{match.homeTeam}</div>
            <div className="text-xs text-gray-500 font-mono">HOME</div>
          </div>
          <div className="text-center">
            <Score h={match.fthg} a={match.ftag} big/>
            <div className="text-xs text-gray-500 font-mono mt-1">HT: {match.hthg}–{match.htag}</div>
          </div>
          <div className="text-left">
            <div className={`font-display text-xl font-bold ${isAway ? 'text-pl-sky' : 'text-gray-300'}`}>{match.awayTeam}</div>
            <div className="text-xs text-gray-500 font-mono">AWAY</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          {[
            ['Shots', match.hs, match.as],
            ['Shots on Target', match.hst, match.ast],
            ['Corners', match.hc, match.ac],
            ['Fouls', match.hf, match.af],
            ['Yellow Cards', match.hy, match.ay],
            ['Red Cards', match.hr, match.ar],
          ].map(([stat, h, a]) => (
            <div key={stat} className="panel py-2 text-center">
              <div className="text-gray-500 mb-1">{stat}</div>
              <div className="flex justify-center items-center gap-3">
                <span className={`font-bold text-lg ${h > a ? 'text-pl-green' : 'text-gray-300'}`}>{h}</span>
                <span className="text-gray-600">–</span>
                <span className={`font-bold text-lg ${a > h ? 'text-pl-sky' : 'text-gray-300'}`}>{a}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <div className="text-xs font-mono text-gray-500">HT→FT State</div>
          <div className="text-sm font-mono text-pl-green mt-1">{match.htftState}</div>
        </div>
        {match.referee && (
          <div className="mt-3 text-center text-xs font-mono text-gray-500">Referee: {match.referee}</div>
        )}
      </div>
    </div>
  )
}

export default function MatchResults() {
  const { matches, allSeasons, allTeams, allReferees } = useData()
  const [season, setSeason]   = useState(allSeasons[allSeasons.length - 1] || ALL)
  const [team, setTeam]       = useState(ALL)
  const [result, setResult]   = useState(ALL)
  const [referee, setReferee] = useState(ALL)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]   = useState('')

  const filtered = useMemo(() => {
    return matches.filter(m => {
      if (season !== ALL && m.season !== season) return false
      if (team !== ALL && m.homeTeam !== team && m.awayTeam !== team) return false
      if (result !== ALL && m.ftr !== result) return false
      if (referee !== ALL && m.referee !== referee) return false
      if (search) {
        const s = search.toLowerCase()
        if (!m.homeTeam.toLowerCase().includes(s) && !m.awayTeam.toLowerCase().includes(s) && !m.referee.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [matches, season, team, result, referee, search])

  const columns = [
    { key: 'date',      label: 'Date',     width: 90,  render: (v) => v?.toLocaleDateString('en-GB') },
    { key: 'matchday',  label: 'MD',        width: 40  },
    { key: 'homeTeam',  label: 'Home',      width: 150 },
    { key: 'awayTeam',  label: 'Away',      width: 150 },
    { key: 'hthg',      label: 'HT',        width: 60,  render: (v, r) => `${v}–${r.htag}` },
    { key: 'fthg',      label: 'FT',        width: 60,  render: (v, r) => `${v}–${r.ftag}` },
    { key: 'ftr',       label: 'Res',       width: 50,  render: v => <ResultBadge result={v}/> },
    { key: 'totalShots',label: 'Shots',     width: 60,  render: (v, r) => `${r.hs}–${r.as}` },
    { key: 'totalSOT',  label: 'SOT',       width: 60,  render: (v, r) => `${r.hst}–${r.ast}` },
    { key: 'totalCorners', label: 'CK',     width: 60,  render: (v, r) => `${r.hc}–${r.ac}` },
    { key: 'totalFouls',label: 'Fouls',     width: 60,  render: (v, r) => `${r.hf}–${r.af}` },
    { key: 'totalYellow',label: 'Yel',      width: 50,  render: (v, r) => `${r.hy}–${r.ay}` },
    { key: 'totalRed',  label: 'Red',       width: 50,  render: (v, r) => `${r.hr}–${r.ar}` },
    { key: 'referee',   label: 'Referee',   width: 130 },
  ]

  return (
    <div>
      <SectionHeader
        title="Match Results"
        subtitle="Complete Premier League match database — filter by season, team, result, referee. Click any match for detailed statistics."
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 bg-surface-raised border border-surface-border rounded-lg">
        <Select label="Season" value={season} onChange={setSeason}
          options={[{ value: ALL, label: 'All Seasons' }, ...allSeasons.map(s => ({ value: s, label: s }))]} />
        <Select label="Team" value={team} onChange={setTeam}
          options={[{ value: ALL, label: 'All Teams' }, ...allTeams.map(t => ({ value: t, label: t }))]} />
        <Select label="Result" value={result} onChange={setResult}
          options={[{ value: ALL, label: 'All' }, { value: 'H', label: 'Home Win' }, { value: 'D', label: 'Draw' }, { value: 'A', label: 'Away Win' }]} />
        <Select label="Referee" value={referee} onChange={setReferee}
          options={[{ value: ALL, label: 'All Referees' }, ...allReferees.map(r => ({ value: r, label: r }))]} />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Team or referee…"
            className="filter-select w-44" />
        </div>
      </div>

      <div className="text-xs font-mono text-gray-500 mb-3">
        {filtered.length.toLocaleString()} matches
      </div>

      <Panel>
        <DataTable columns={columns} data={filtered} onRowClick={setSelected} />
      </Panel>

      {selected && <MatchDetailPanel match={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
