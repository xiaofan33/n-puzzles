import type { GridSize } from '@shared/utils'

export type ValueWeight = { value: number; weight: number }

export type Preset = {
  readonly boardSize: Readonly<GridSize>
  readonly spawnAtStart: number
  readonly spawnPerMove: number
  readonly valueWeights: readonly Readonly<ValueWeight>[]
}

const freezePreset = (preset: Preset): Preset =>
  Object.freeze({
    ...preset,
    boardSize: Object.freeze(preset.boardSize),
    valueWeights: Object.freeze(preset.valueWeights.map(w => Object.freeze(w))),
  })

export const DEFAULT_PRESET = freezePreset({
  boardSize: { w: 4, h: 4 },
  spawnAtStart: 2,
  spawnPerMove: 1,
  valueWeights: [
    { value: 2, weight: 90 },
    { value: 4, weight: 10 },
  ],
})

export const PRESET_LIST: readonly Preset[] = Object.freeze([
  DEFAULT_PRESET,
  freezePreset({
    boardSize: { w: 4, h: 3 },
    spawnAtStart: 2,
    spawnPerMove: 1,
    valueWeights: [
      { value: 2, weight: 90 },
      { value: 4, weight: 10 },
    ],
  }),
  freezePreset({
    boardSize: { w: 5, h: 5 },
    spawnAtStart: 3,
    spawnPerMove: 2,
    valueWeights: [
      { value: 2, weight: 70 },
      { value: 4, weight: 20 },
      { value: 8, weight: 10 },
    ],
  }),
])
