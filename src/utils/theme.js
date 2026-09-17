export const COLORS = {
  green:   '#00FF87',
  sky:     '#7C3AED',
  purple:  '#A78BFA',
  amber:   '#A78BFA',
  red:     '#FF0055',
  orange:  '#FF0055',
  blue:    '#7C3AED',
  pink:    '#FF0055',
  teal:    '#00FF87',
  lime:    '#00FF87',
  muted:   '#A78BFA',
  grid:    '#5B1B64',
  axis:    '#A78BFA',
}

export const TEAM_COLORS = [
  '#00FF87','#7C3AED','#A78BFA','#FF0055','#FFFFFF',
  '#38E54D','#C4B5FD','#FF4D7D','#00D977','#E9D5FF',
  '#B08CFF','#FF6B94','#5CFFA9','#D8B4FE','#FF1F69',
  '#00B965','#9366F1','#FF3378','#8B5CF6','#7EF4B5',
]

export function teamColor(index) {
  return TEAM_COLORS[index % TEAM_COLORS.length]
}

export const CHART_STYLE = {
  backgroundColor: 'transparent',
  fontSize: 14,
  fontFamily: 'League Spartan, sans-serif',
}

export const AXIS_PROPS = {
  tick: { fill: '#A78BFA', fontSize: 14, fontFamily: 'League Spartan, sans-serif' },
  axisLine: { stroke: '#5B1B64' },
  tickLine: { stroke: '#5B1B64' },
}

export const GRID_PROPS = {
  stroke: '#5B1B64',
  strokeDasharray: '3 3',
  vertical: false,
}

export const RESULT_COLORS = {
  H: '#00FF87',
  D: '#A78BFA',
  A: '#7C3AED',
  W: '#00FF87',
  L: '#FF0055',
}
