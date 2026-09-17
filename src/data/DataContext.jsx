import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { loadAllSeasons, SEASON_FILES } from './loader'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [matches, setMatches] = useState([])
  const [errors, setErrors] = useState([])
  const [seasonsMeta, setSeasonsMeta] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({ pct: 0, label: '' })

  useEffect(() => {
    loadAllSeasons((pct, label) => setProgress({ pct, label }))
      .then(({ matches, errors, seasonsMeta }) => {
        setMatches(matches)
        setErrors(errors)
        setSeasonsMeta(seasonsMeta)
        setLoading(false)
      })
  }, [])

  const derived = useMemo(() => {
    if (!matches.length) return { allSeasons: [], allTeams: [], allReferees: [] }
    const allSeasons = [...new Set(matches.map(m => m.season))].sort()
    const allTeams   = [...new Set(matches.flatMap(m => [m.homeTeam, m.awayTeam]))].sort()
    const allReferees = [...new Set(matches.map(m => m.referee).filter(Boolean))].sort()
    return { allSeasons, allTeams, allReferees }
  }, [matches])

  return (
    <DataContext.Provider value={{ matches, errors, seasonsMeta, loading, progress, ...derived }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
