import { describe, expect, it } from 'vitest'
import { create2DArray } from '@shared/lib'
import { createModel, type ModelProps, type TileState } from './model'

function tilesToGrid(tiles: TileState[], rows: number, cols = rows) {
  const grid = create2DArray(rows, cols, 0)
  tiles.filter(t => t.value !== 0).forEach(t => (grid[t.y][t.x] = t.value))
  return grid
}

function gridToTiles(grid: number[][]) {
  const tiles: TileState[] = []
  const h = grid.length
  const w = grid[0]?.length ?? 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const value = grid[y][x]
      if (value !== 0) {
        tiles.push({ x, y, value })
      }
    }
  }
  return tiles
}

function createTestModel(grid: number[][], patch?: Partial<ModelProps>) {
  const m = createModel()
  m.restore({
    spawnPerMove: 0,
    initialState: {
      tiles: gridToTiles(grid),
    },
    ...patch,
  })
  return m
}

describe('Game2048Model - Utility Functions', () => {
  it('should convert grid to tiles correctly', () => {
    const grid = [
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 8, 0],
      [0, 0, 0, 16],
    ]

    const tiles = gridToTiles(grid)
    expect(tiles).toHaveLength(4)
    expect(tiles).toContainEqual({ value: 2, x: 0, y: 0 })
    expect(tiles).toContainEqual({ value: 4, x: 1, y: 1 })
    expect(tiles).toContainEqual({ value: 8, x: 2, y: 2 })
    expect(tiles).toContainEqual({ value: 16, x: 3, y: 3 })
  })

  it('should convert tiles to grid correctly', () => {
    const tiles = [
      { value: 2, x: 0, y: 0 },
      { value: 4, x: 1, y: 1 },
      { value: 8, x: 2, y: 2 },
      { value: 16, x: 3, y: 3 },
    ]

    const grid = tilesToGrid(tiles, 4)
    expect(grid).toEqual([
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 8, 0],
      [0, 0, 0, 16],
    ])
  })
})

describe('Game2048Model - Movement', () => {
  const initialGrid = [
    [2, 0, 2, 0],
    [2, 2, 4, 4],
    [2, 2, 4, 8],
    [2, 2, 2, 0],
  ]

  const movementTests = [
    {
      direction: 'right' as const,
      expected: [
        [0, 0, 0, 4],
        [0, 0, 4, 8],
        [0, 4, 4, 8],
        [0, 0, 2, 4],
      ],
    },
    {
      direction: 'down' as const,
      expected: [
        [0, 0, 0, 0],
        [0, 0, 2, 0],
        [4, 2, 8, 4],
        [4, 4, 2, 8],
      ],
    },
    {
      direction: 'left' as const,
      expected: [
        [4, 0, 0, 0],
        [4, 8, 0, 0],
        [4, 4, 8, 0],
        [4, 2, 0, 0],
      ],
    },
    {
      direction: 'up' as const,
      expected: [
        [4, 4, 2, 4],
        [4, 2, 8, 8],
        [0, 0, 2, 0],
        [0, 0, 0, 0],
      ],
    },
  ]

  it.each(movementTests)(
    'should move tiles $direction correctly',
    ({ direction, expected }) => {
      const model = createTestModel(initialGrid)
      model.move(direction)
      expect(tilesToGrid(model.state.tiles, 4)).toEqual(expected)
    },
  )

  it('should move tiles correctly on a rectangular grid', () => {
    const grid = [
      [2, 0, 2, 0],
      [2, 2, 4, 4],
      [2, 2, 2, 2],
    ]
    const model = createTestModel(grid, { boardSize: { h: 3, w: 4 } })
    model.move('right')
    expect(tilesToGrid(model.state.tiles, 3, 4)).toEqual([
      [0, 0, 0, 4],
      [0, 0, 4, 8],
      [0, 0, 4, 4],
    ])
    model.move('up')
    expect(tilesToGrid(model.state.tiles, 3, 4)).toEqual([
      [0, 0, 8, 4],
      [0, 0, 0, 8],
      [0, 0, 0, 4],
    ])
  })

  it('should move tiles correctly on a tall rectangular grid', () => {
    const grid = [
      [2, 0],
      [2, 2],
      [4, 0],
      [0, 4],
      [2, 2],
    ]
    const model = createTestModel(grid, { boardSize: { h: 5, w: 2 } })
    model.move('down')
    expect(tilesToGrid(model.state.tiles, 5, 2)).toEqual([
      [0, 0],
      [0, 0],
      [4, 2],
      [4, 4],
      [2, 2],
    ])
    model.move('left')
    expect(tilesToGrid(model.state.tiles, 5, 2)).toEqual([
      [0, 0],
      [0, 0],
      [4, 2],
      [8, 0],
      [4, 0],
    ])
  })
})

describe('Game2048Model - Scoring', () => {
  it('should calculate score correctly after merging tiles', () => {
    const grid = [
      [2, 0, 2, 0],
      [2, 2, 4, 4],
      [2, 2, 4, 8],
      [2, 2, 2, 0],
    ]

    const model = createTestModel(grid)
    const initialScore = model.state.score
    model.move('right')

    // Expected merges: 2+2=4, 2+2=4, 4+4=8, 2+2=4, 2+2=4
    const expectedScoreIncrease = 4 + 4 + 8 + 4 + 4
    expect(model.state.score).toBe(initialScore + expectedScoreIncrease)
  })

  it('should not increase score when no tiles merge', () => {
    const grid = [
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]

    const model = createTestModel(grid)
    const initialScore = model.state.score
    model.move('right')

    expect(model.state.score).toBe(initialScore)
  })
})

describe('Game2048Model - Game Over State', () => {
  it('should not set gameOver when moves are still possible', () => {
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 8],
      [4, 2, 4, 8],
    ]

    const model = createTestModel(grid)
    model.move('right')
    expect(model.state.gg).toBe(false)
  })

  it('should set gameOver when no moves are possible', () => {
    const grid = [
      [8, 16, 8, 16],
      [16, 8, 16, 8],
      [32, 16, 8, 32],
      [16, 32, 16, 32],
    ]

    const model = createTestModel(grid, { spawnPerMove: 1 })
    model.move('up')
    expect(model.state.gg).toBe(true)
  })

  it('should keep accepting moves after a successful spawn (regression: spawn returned undefined)', () => {
    const grid = [
      [0, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]

    const model = createTestModel(grid, { spawnPerMove: 1 })
    model.move('left')
    expect(model.state.gg).toBe(false)
    expect(model.state.steps).toBe(1)

    model.move('right')
    expect(model.state.gg).toBe(false)
    expect(model.state.steps).toBe(2)
  })

  it('should not set gameOver when dying tiles leave empty cells', () => {
    // 2 merges free 2 cells and spawnPerMove=0 leaves them empty.
    // Without the fix, the 2 dying (value=0) tiles inflate tiles.length
    // to 16, making canMove() report no empty cell -> false gg.
    const grid = [
      [2, 8, 2, 2],
      [16, 32, 2, 8],
      [4, 2, 8, 8],
      [2, 8, 4, 16],
    ]

    const model = createTestModel(grid, { spawnPerMove: 0 })
    model.move('left')
    expect(model.state.gg).toBe(false)
  })
})
