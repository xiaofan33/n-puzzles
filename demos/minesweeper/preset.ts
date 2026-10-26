import { NEIGHBOR_DIRS, clamp, randomInt, type GridSize } from '@shared/utils'

export interface BoardConfig extends Readonly<GridSize> {
  readonly m: number
}

export interface Preset {
  readonly id: 'easy' | 'medium' | 'hard'
  readonly label: string
  readonly board: BoardConfig
}

export const DEFAULT_BOARD_CONFIG: BoardConfig = Object.freeze({
  w: 9,
  h: 9,
  m: 10,
})

export const PRESET_LIST: readonly Preset[] = Object.freeze([
  Object.freeze({ id: 'easy', label: '简单', board: DEFAULT_BOARD_CONFIG }),
  Object.freeze({
    id: 'medium',
    label: '中等',
    board: Object.freeze({ w: 16, h: 16, m: 40 }),
  }),
  Object.freeze({
    id: 'hard',
    label: '困难',
    board: Object.freeze({ w: 30, h: 16, m: 99 }),
  }),
])

export function findPreset(board: BoardConfig): Preset | undefined
export function findPreset(id: string): Preset | undefined
export function findPreset(input: BoardConfig | string) {
  if (typeof input === 'string') {
    return PRESET_LIST.find(d => d.id === input)
  }
  const { w, h, m } = input
  return PRESET_LIST.find(
    ({ board }) => board.w === w && board.h === h && board.m === m,
  )
}

export const PALETTE_LIST = Object.freeze([
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
] as const)

export type Palette = (typeof PALETTE_LIST)[number]

export interface Settings {
  boardConfig: BoardConfig
  palette: Palette
  radius: number /** rounded radius (px) */
  size: number /** cell size (px) */
  clickToFlag: boolean
  lockDensity: boolean /** keep mine density when the board size changes */
}

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  boardConfig: DEFAULT_BOARD_CONFIG,
  palette: 'sky',
  radius: 2,
  size: 32,
  clickToFlag: false,
  lockDensity: true,
})

export const GLYPHS = Object.freeze({
  ready: '🙂',
  playing: '🤔',
  won: '😎',
  lost: '😵',
  flag: '🚩',
  mine: '💣',
  boom: '💥',
  timer: '⏱️',
  blank: '',
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
})

export const SETTINGS_LIMITS = Object.freeze({
  w: Object.freeze({ min: 5, max: 50 }),
  h: Object.freeze({ min: 5, max: 50 }),
  density: Object.freeze({ min: 4, max: 60 }), // mine density (%)
  size: Object.freeze({ min: 24, max: 48 }), // cell size (px)
})

/**
 * The first click reveals its own cell plus up to 8 neighbors, all kept
 * mine-free — so a board must keep at least this many cells safe.
 */
export const FIRST_CLICK_SAFE_COUNT = NEIGHBOR_DIRS.length + 1

/**
 * Mine-count range for a board of `total` cells, derived from
 * `SETTINGS_LIMITS.density`. `total` must exceed `FIRST_CLICK_SAFE_COUNT`,
 * otherwise the range would be empty.
 */
export function mineCountBounds(total: number) {
  if (!Number.isInteger(total) || total <= FIRST_CLICK_SAFE_COUNT) {
    throw new RangeError(
      `mineCountBounds: total (${total}) must be an integer greater than ${FIRST_CLICK_SAFE_COUNT}`,
    )
  }

  const { min, max } = SETTINGS_LIMITS.density
  return {
    min: Math.max(1, Math.ceil((total * min) / 100)),
    max: Math.min(
      Math.floor((total * max) / 100),
      total - FIRST_CLICK_SAFE_COUNT,
    ),
  }
}

export function randomBoardConfig(): BoardConfig {
  const { w, h, density } = SETTINGS_LIMITS

  const rw = randomInt(w.min, w.max)
  const rh = randomInt(h.min, h.max)

  const total = rw * rh
  const range = mineCountBounds(total)
  const rm = clamp(
    Math.round((total * randomInt(density.min, density.max)) / 100),
    range.min,
    range.max,
  )

  return { w: rw, h: rh, m: rm }
}

export function randomPalette(excluded?: Palette): Palette {
  const available = PALETTE_LIST.filter(key => key !== excluded)
  if (available.length === 0) {
    throw new Error('randomPalette: no palette left after exclusion')
  }
  return available[randomInt(0, available.length - 1)]
}
