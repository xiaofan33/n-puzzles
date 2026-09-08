export const defaultPreset = {
  boardSize: { w: 4, h: 4 },
  spawnAtStart: 2,
  spawnPerMove: 1,
  valueWeights: [
    { value: 2, weight: 90 },
    { value: 4, weight: 10 },
  ],
}

export type Preset = typeof defaultPreset

export const presetList: Preset[] = [
  { ...defaultPreset },
  {
    boardSize: { w: 4, h: 3 },
    spawnAtStart: 2,
    spawnPerMove: 1,
    valueWeights: [
      { value: 2, weight: 90 },
      { value: 4, weight: 10 },
    ],
  },
  {
    boardSize: { w: 5, h: 5 },
    spawnAtStart: 3,
    spawnPerMove: 2,
    valueWeights: [
      { value: 2, weight: 70 },
      { value: 4, weight: 20 },
      { value: 8, weight: 10 },
    ],
  },
]
