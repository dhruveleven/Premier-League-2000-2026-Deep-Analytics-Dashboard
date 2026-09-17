import React, { useState, Suspense, lazy } from 'react'
import { Menu, X } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { DataProvider, useData } from './data/DataContext'
import { Loading } from './components/ui'
import { CornerAnalysis, DisciplineAnalysis, RefereeAnalysis } from './components/sections/CornerDisciplineReferee'
import { TeamRankings, PerformanceMatrix } from './components/sections/TeamRankingsMatrix'

const MatchResults      = lazy(() => import('./components/sections/MatchResults'))
const LeagueOverview    = lazy(() => import('./components/sections/LeagueOverview'))
const LeagueEvolution   = lazy(() => import('./components/sections/LeagueEvolution'))
const SeasonExplorer    = lazy(() => import('./components/sections/SeasonExplorer'))
const TitleRace         = lazy(() => import('./components/sections/TitleRace'))
const RelegationZone    = lazy(() => import('./components/sections/RelegationZone'))
const TeamExplorer      = lazy(() => import('./components/sections/TeamExplorer'))
const HomeVsAway        = lazy(() => import('./components/sections/HomeVsAway'))
const HeadToHead        = lazy(() => import('./components/sections/HeadToHead'))
const HTFTAnalysis      = lazy(() => import('./components/sections/HTFTAnalysis'))
const ScoringAnalysis   = lazy(() => import('./components/sections/ScoringAnalysis'))
const SeasonProgression = lazy(() => import('./components/sections/SeasonProgression'))

const NAV = [
  { id: 'league-overview',    label: 'League Overview',    group: 'Explore' },
  { id: 'match-results',      label: 'Match Results',      group: 'Explore' },
  { id: 'season-explorer',    label: 'Season Explorer',    group: 'Explore' },
  { id: 'league-evolution',   label: 'League Evolution',   group: 'Trends' },
  { id: 'title-race',         label: 'Title Race',         group: 'Seasons' },
  { id: 'relegation',         label: 'Relegation Zone',    group: 'Seasons' },
  { id: 'season-progression', label: 'Season Progression', group: 'Seasons' },
  { id: 'team-explorer',      label: 'Team Explorer',      group: 'Teams' },
  { id: 'home-away',          label: 'Home vs Away',       group: 'Teams' },
  { id: 'head-to-head',       label: 'Head to Head',       group: 'Teams' },
  { id: 'team-rankings',      label: 'Team Rankings',      group: 'Teams' },
  { id: 'performance-matrix', label: 'Performance Matrix', group: 'Teams' },
  { id: 'htft',               label: 'HT → FT Analysis',   group: 'Analytics' },
  { id: 'scoring',            label: 'Goals & Shots',      group: 'Analytics' },
  { id: 'corners',            label: 'Corner Analysis',    group: 'Analytics' },
  { id: 'discipline',         label: 'Discipline',         group: 'Analytics' },
  { id: 'referee',            label: 'Referee Analysis',   group: 'Analytics' },
]

const GROUPS = ['Explore', 'Trends', 'Seasons', 'Teams', 'Analytics']

function SectionContent({ active }) {
  const direct = {
    corners:             <CornerAnalysis />,
    discipline:          <DisciplineAnalysis />,
    referee:             <RefereeAnalysis />,
    'team-rankings':     <TeamRankings />,
    'performance-matrix':<PerformanceMatrix />,
  }
  if (direct[active]) return direct[active]
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500 font-sans text-base">Loading section…</span>
      </div>
    }>
      {active === 'match-results'      && <MatchResults />}
      {active === 'league-overview'    && <LeagueOverview />}
      {active === 'league-evolution'   && <LeagueEvolution />}
      {active === 'season-explorer'    && <SeasonExplorer />}
      {active === 'title-race'         && <TitleRace />}
      {active === 'relegation'         && <RelegationZone />}
      {active === 'season-progression' && <SeasonProgression />}
      {active === 'team-explorer'      && <TeamExplorer />}
      {active === 'home-away'          && <HomeVsAway />}
      {active === 'head-to-head'       && <HeadToHead />}
      {active === 'htft'               && <HTFTAnalysis />}
      {active === 'scoring'            && <ScoringAnalysis />}
    </Suspense>
  )
}

function Dashboard() {
  const { loading, progress } = useData()
  const [active, setActive]       = useState('league-overview')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (loading) return <Loading pct={progress.pct} label={progress.label} />

  return (
    <div className="min-h-screen md:flex">

      <header className="mobile-header">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="mobile-menu-button"
          aria-label="Open navigation"
        >
          <Menu size={24} />
        </button>
        <span className="font-display font-bold text-lg text-gray-100">PL in numbers</span>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'md:w-[68px]' : 'md:w-[240px]'}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-border">
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-base text-gray-100 leading-tight truncate">
                PL in numbers
              </div>
              <div className="font-sans text-xs text-gray-500 mt-0.5">
                2000/01 – 2025/26
              </div>
            </div>
          )}
          <button
            onClick={() => {
              if (window.matchMedia('(max-width: 767px)').matches) {
                setMobileOpen(false)
              } else {
                setCollapsed(c => !c)
              }
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-gray-600 hover:text-gray-300 transition-colors text-sm flex-shrink-0 ml-auto"
          >
            <span className="hidden md:inline">{collapsed ? '▶' : '◀'}</span>
            <X className="md:hidden" size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 overflow-y-auto py-3"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#5B1B64 transparent' }}
        >
          {GROUPS.map(group => (
            <div key={group}>
              {!collapsed && (
                <div className="px-4 pt-5 pb-2 text-xs font-sans font-semibold text-gray-600 uppercase tracking-widest">
                  {group}
                </div>
              )}
              {NAV.filter(n => n.group === group).map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActive(item.id)
                    setMobileOpen(false)
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    ${active === item.id
                      ? 'bg-pl-green/10 text-pl-green border-r-2 border-pl-green'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-surface-raised'}`}
                >
                  {!collapsed && (
                    <span className="font-sans text-base font-medium truncate">
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
              {!collapsed && (
                <div className="h-px bg-surface-border/40 mx-4 mt-3" />
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-surface-border">
            <div className="text-xs font-sans text-gray-600">26 seasons · Phase 1</div>
            <div className="text-xs font-sans text-gray-700 mt-0.5">Historical Analytics</div>
          </div>
        )}
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="min-w-0 bg-pitch-950">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <SectionContent active={active} />
        </div>
      </main>

    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <Dashboard />
      <Analytics />
    </DataProvider>
  )
}