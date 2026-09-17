import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

// ── KPI Card ─────────────────────────────────────────────────────────────────
export function KPI({ label, value, delta, color = 'text-pl-green', sub }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-value ${color}`}>{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="text-xs text-gray-500 font-mono mt-0.5">{sub}</div>}
      {delta !== undefined && (
        <div className={`kpi-delta ${delta >= 0 ? 'text-pl-green' : 'text-red-400'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}
        </div>
      )}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle max-w-2xl">{subtitle}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-surface-border mb-6 overflow-x-auto">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`tab-btn whitespace-nowrap ${active === t.id ? 'active' : ''}`}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ value, onChange, options, label, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">{label}</span>}
      <select value={value} onChange={e => onChange(e.target.value)} className="filter-select">
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  )
}

// ── Sortable data table ───────────────────────────────────────────────────────
export function DataTable({ columns, data, maxRows = 500, onRowClick }) {
  const [sort, setSort] = useState({ key: null, dir: 1 })
  const [page, setPage] = useState(0)
  const PAGE = 100

  const sorted = useMemo(() => {
    if (!sort.key) return data
    return [...data].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      return typeof av === 'number' ? (av - bv) * sort.dir : String(av).localeCompare(String(bv)) * sort.dir
    })
  }, [data, sort])

  const paged = sorted.slice(page * PAGE, (page + 1) * PAGE)
  const pages = Math.ceil(sorted.length / PAGE)

  const handleSort = key => {
    setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }))
    setPage(0)
  }

  return (
    <div>
      <div className="scroll-area" style={{ maxHeight: 620 }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} onClick={() => handleSort(c.key)} style={{ width: c.width }}>
                  <span className="flex items-center gap-1">
                    {c.label}
                    {sort.key === c.key
                      ? sort.dir === -1 ? <ChevronDown size={10}/> : <ChevronUp size={10}/>
                      : <ChevronsUpDown size={10} className="opacity-30"/>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}>
                {columns.map(c => (
                  <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
            {!paged.length && (
              <tr><td colSpan={columns.length} className="text-center text-gray-500 py-8">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-3 mt-3 text-xs font-mono text-gray-400">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="btn btn-secondary disabled:opacity-30 text-xs py-1 px-3">Prev</button>
          <span>{page + 1} / {pages} ({sorted.length} rows)</span>
          <button disabled={page === pages - 1} onClick={() => setPage(p => p + 1)}
            className="btn btn-secondary disabled:opacity-30 text-xs py-1 px-3">Next</button>
        </div>
      )}
    </div>
  )
}

// ── Custom recharts tooltip ───────────────────────────────────────────────────
export function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      {label && <div className="text-gray-400 mb-2 text-xs">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
          <span className="text-gray-300">{p.name}:</span>
          <span style={{ color: p.color }}>
            {formatter ? formatter(p.value, p.name) : typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Result badge ──────────────────────────────────────────────────────────────
export function ResultBadge({ result }) {
  return <span className={`badge badge-${result}`}>{result}</span>
}

// ── Score display ─────────────────────────────────────────────────────────────
export function Score({ h, a, big }) {
  return (
    <span className={`font-display font-bold ${big ? 'text-2xl' : 'text-sm'} text-gray-100`}>
      {h} – {a}
    </span>
  )
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────
export function Panel({ title, children, className = '' }) {
  return (
    <div className={`panel ${className}`}>
      {title && <h3 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-4">{title}</h3>}
      {children}
    </div>
  )
}

// ── Loading state ─────────────────────────────────────────────────────────────
export function Loading({ pct, label }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="font-display text-4xl font-bold text-pl-green tracking-widest">PL Analytics</div>
      <div className="w-72">
        <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
          <span>Loading {label}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1 bg-surface-muted rounded-full overflow-hidden">
          <div className="h-full bg-pl-green rounded-full transition-all duration-300"
               style={{ width: `${pct}%` }}/>
        </div>
      </div>
      <p className="text-xs text-gray-500 font-mono">Ingesting 26 seasons of Premier League data</p>
    </div>
  )
}

// ── Stat row ──────────────────────────────────────────────────────────────────
export function StatRow({ label, value, max, color = '#00FF87' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-32 text-xs text-gray-400 font-mono truncate shrink-0">{label}</div>
      <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <div className="w-16 text-right text-xs font-mono text-gray-200">{typeof value === 'number' ? value.toFixed(2) : value}</div>
    </div>
  )
}

// ── Era chip ──────────────────────────────────────────────────────────────────
export function EraChip({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
        active ? 'bg-pl-green text-pitch-950 font-semibold' : 'bg-surface-muted text-gray-400 hover:text-gray-100'
      }`}>
      {label}
    </button>
  )
}

// ── Number formatting helpers ─────────────────────────────────────────────────
export const fmt = {
  pct: v => `${v.toFixed(1)}%`,
  dec: (v, d = 2) => v.toFixed(d),
  int: v => Math.round(v).toLocaleString(),
  ppg: v => v.toFixed(2),
}
