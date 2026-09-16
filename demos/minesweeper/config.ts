import { clamp, randomInt } from '@shared/lib'
import { FIRST_CLICK_SAFE_COUNT, type BoardConfig } from './model'

export interface Preset {
  id: 'easy' | 'medium' | 'hard'
  label: string
  boardConfig: BoardConfig
}

export const presetList: readonly Preset[] = [
  { id: 'easy', label: '初级', boardConfig: { w: 9, h: 9, m: 10 } },
  { id: 'medium', label: '中级', boardConfig: { w: 16, h: 16, m: 40 } },
  { id: 'hard', label: '高级', boardConfig: { w: 30, h: 16, m: 99 } },
] as const

export const defaultPreset = presetList[0]

export function findPreset(board: BoardConfig): Preset | undefined
export function findPreset(id: string): Preset | undefined
export function findPreset(input: BoardConfig | string) {
  if (typeof input === 'string') {
    return presetList.find(d => d.id === input)
  }
  const { w, h, m } = input
  return presetList.find(
    ({ boardConfig }) =>
      boardConfig.w === w && boardConfig.h === h && boardConfig.m === m,
  )
}

export const palettes = [
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
] as const

export type Palette = (typeof palettes)[number]

export interface Settings {
  boardConfig: BoardConfig
  palette: Palette
  radius: number /** rounded radius (px) */
  size: number /** cell size (px) */
  clickToFlag: boolean
  lockDensity: boolean /** keep mine density when the board size changes */
}

export const defaultSettings: Settings = {
  boardConfig: defaultPreset.boardConfig,
  palette: 'sky',
  radius: 2,
  size: 32,
  clickToFlag: false,
  lockDensity: true,
}

export const glyphs = {
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
} as const

export const limits = {
  w: { min: 5, max: 50 },
  h: { min: 5, max: 50 },
  density: { min: 4, max: 60 }, // mine density (%)
  size: { min: 24, max: 48 }, // cell size (px)
} as const

/**
 * Mine-count range for a board of `total` cells, derived from `limits.density`.
 * Requires `total > FIRST_CLICK_SAFE_COUNT`, otherwise the upper bound goes negative.
 */
export function mineCountBounds(total: number) {
  const { min, max } = limits.density
  return {
    min: Math.max(1, Math.ceil((total * min) / 100)),
    max: Math.min(
      Math.floor((total * max) / 100),
      total - FIRST_CLICK_SAFE_COUNT,
    ),
  }
}

export function randomBoardConfig(): BoardConfig {
  const { w, h, density } = limits

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
  const available = palettes.filter(key => key !== excluded)
  return available[randomInt(0, available.length - 1)]
}
