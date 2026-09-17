# Premier League Historical Analytics Dashboard

A fully interactive football analytics platform built on 26 seasons of Premier League match data, from 2000/01 through 2025/26. The goal is not to simply display what happened, but to help users understand how the game has changed, how teams have evolved, and how different aspects of Premier League football relate to each other across time.

This is Phase 1: historical descriptive and diagnostic analytics only. No predictions, no machine learning, no xG modeling. Those belong to a separate future phase.

---

## Live Demo

Deployed via Vercel. All data is served as static CSV files. No backend required.

---

## Tech Stack

- React 18 with Vite
- Recharts for all data visualizations
- Tailwind CSS for styling
- PapaParse for CSV ingestion
- League Spartan typeface
- Vercel for deployment

All data processing happens in the browser. There is no server, no database, and no API calls beyond loading the CSV files.

---

## Data

26 CSV files covering every Premier League season from 2000/01 to 2025/26. Each file contains one row per match with the following fields:

| Field               | Description                  |
| ------------------- | ---------------------------- |
| Date                | Match date                   |
| HomeTeam / AwayTeam | Club names                   |
| FTHG / FTAG         | Full-time goals              |
| FTR                 | Full-time result: H, D, or A |
| HTHG / HTAG         | Half-time goals              |
| HTR                 | Half-time result             |
| Referee             | Match referee                |
| HS / AS             | Shots                        |
| HST / AST           | Shots on target              |
| HF / AF             | Fouls                        |
| HC / AC             | Corners                      |
| HY / AY             | Yellow cards                 |
| HR / AR             | Red cards                    |

Approximately 9,880 matches in total across 26 seasons.

---

---

## Dashboard Sections

| Section            | Purpose                                                                               |
| ------------------ | ------------------------------------------------------------------------------------- |
| League Overview    | High-level KPIs and result distribution for any selected period                       |
| Match Results      | Filterable database of every match with full statistics                               |
| Season Explorer    | Final league table and team comparison for any season                                 |
| League Evolution   | How scoring, results, attacking output, and discipline have changed across 26 seasons |
| Title Race         | Interactive matchday slider replaying the standings week by week                      |
| Relegation Zone    | Bottom-of-table progression and historical relegation thresholds                      |
| Season Progression | Cumulative points, goals, and form curves by matchday for any team                    |
| Team Explorer      | Full Premier League career record and season-by-season history for any club           |
| Home vs Away       | Home advantage trends, team-level HA index, and historical erosion analysis           |
| Head to Head       | Complete historical record between any two clubs                                      |
| Team Rankings      | Flexible ranking on any metric across any period                                      |
| Performance Matrix | Multi-dimensional scatter comparison across all teams                                 |
| HT to FT Analysis  | Comeback rates, collapse rates, and lead conversion by team                           |
| Goals and Shots    | Scoring patterns, scoreline distribution, shot efficiency, and result correlation     |
| Corner Analysis    | Corner generation, concession, differential, and association with results             |
| Discipline         | Fouls, yellow cards, red cards: team profiles and league-wide trends                  |
| Referee Analysis   | Descriptive referee statistics. Patterns only, not bias claims                        |

---

## Setup and Development

### Prerequisites

- Node.js 18 or higher
- The 26 season CSV files

### Install

```bash
cd pl-dashboard
npm install
```

### Run in development

```bash
npm run dev
```

The Vite dev server middleware automatically serves CSV files from `./data/` during development. No manual configuration required.

### Build for production

```bash
cp -r data public/data
npm run build
```

The CSV files must be inside `public/data/` for the production build to serve them as static assets.

### Deploy

```bash
vercel --prod
```

---

## Data Architecture

The loader (`src/data/loader.js`) handles:

- Parsing all 26 CSVs via PapaParse
- Team name normalisation across historical variants
- Date parsing in multiple formats
- Validation of FTR and HTR consistency against goal counts
- Matchday assignment from actual match dates, not row order
- Derivation of all match-level metrics on load

The analytics engine (`src/analytics/engine.js`) is the single source of truth for all computed metrics. No section computes its own raw statistics. Everything is consumed from this reusable layer.

---

## Analytical Principles

- All metrics are clearly defined. Win percentage means wins divided by matches played. Points per game means points divided by matches played.
- Per-match metrics are used for cross-team comparisons to avoid penalising teams with fewer seasons.
- Descriptive observations are not presented as causal claims.
- The referee section surfaces patterns for exploration only. Raw averages are not evidence of bias.
- The shot analysis does not use the term xG. The dataset contains no shot location data, so no expected goals model is presented.

---

## Phase 2 Roadmap

Phase 2 will build on this historical foundation and is planned to include:

- Elo rating system
- Shot-based expected goals model (requires shot location data)
- Match outcome probability models
- Form-weighted projections
- Relegation and title probability trackers

---

## Author

Built by Dhruv as a data science portfolio project.
