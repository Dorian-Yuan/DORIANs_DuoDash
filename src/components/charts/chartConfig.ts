import { DuoColors } from '../../styles/duolingoColors';

export const CHART_TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid var(--chart-tooltip-border)',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
  fontSize: 12,
  backgroundColor: 'var(--chart-tooltip-bg)'
} as const;

export const CHART_GRID_STYLE = {
  strokeDasharray: '3 3',
  vertical: false,
  stroke: 'var(--chart-grid)'
} as const;

const CHART_AXIS_TICK_STYLE = {
  fill: 'var(--chart-axis)',
  fontSize: 10
} as const;

export const CHART_X_AXIS_PROPS = {
  dataKey: 'date',
  axisLine: false,
  tickLine: false,
  tick: CHART_AXIS_TICK_STYLE,
  dy: 5
} as const;

export const CHART_Y_AXIS_PROPS = {
  axisLine: false,
  tickLine: false,
  tick: CHART_AXIS_TICK_STYLE,
  width: 32,
  domain: [0, 'auto'] as const
};

export const CHART_MARGIN = {
  top: 5,
  right: 10,
  bottom: 5,
  left: 0
} as const;

export const createDotStyle = (color: string) => ({
  r: 3,
  fill: color,
  strokeWidth: 2,
  stroke: 'var(--chart-dot-stroke)'
} as const);

export const ACTIVE_DOT_STYLE = { r: 5 } as const;

export const CHART_COLORS = {
  xp: DuoColors.featherGreen,
  time: DuoColors.macawBlue
} as const;
