export const AXIAL_DIRS: readonly Position[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
]

export const NEIGHBOR_DIRS: readonly Position[] = [
  ...AXIAL_DIRS,
  { x: -1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
]

export const DIR_OFFSETS: Readonly<Record<Direction, Position>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export type GridBounds = GridSize & Position

export function createBoardGrid(bounds?: Partial<GridBounds>) {
  let w = 1,
    h = 1,
    x = 0,
    y = 0

  function setBounds(patch: Partial<GridBounds>) {
    if (patch.w !== undefined) w = patch.w
    if (patch.h !== undefined) h = patch.h
    if (patch.x !== undefined) x = patch.x
    if (patch.y !== undefined) y = patch.y
  }

  function posToIndex(pos: Position) {
    return (pos.y - y) * w + (pos.x - x)
  }

  function indexToPos(index: number) {
    return {
      x: (index % w) + x,
      y: Math.floor(index / w) + y,
    }
  }

  function isValidPos(pos: Position) {
    const rx = pos.x - x
    const ry = pos.y - y
    return rx >= 0 && rx < w && ry >= 0 && ry < h
  }

  function getNeighbors(input: number, includeDiagonals?: boolean): number[]
  function getNeighbors(input: Position, includeDiagonals?: boolean): Position[]
  function getNeighbors(
    input: Position | number,
    includeDiagonals = false,
  ): Position[] | number[] {
    const dirs = includeDiagonals ? NEIGHBOR_DIRS : AXIAL_DIRS

    if (typeof input === 'number') {
      return dirs
        .map(d => ({
          i: input + d.y * w + d.x,
          x: (input % w) + d.x + x,
          y: Math.floor(input / w) + d.y + y,
        }))
        .filter(p => isValidPos(p))
        .map(p => p.i)
    }

    return dirs
      .map(d => ({ x: input.x + d.x, y: input.y + d.y }))
      .filter(p => isValidPos(p))
  }

  function getLineIndices(index: number, orientation: Orientation): number[] {
    if (orientation === 'horizontal') {
      const start = Math.floor(index / w) * w
      return Array.from({ length: w }, (_, i) => start + i)
    }
    const col = index % w
    return Array.from({ length: h }, (_, i) => col + i * w)
  }

  setBounds(bounds || {})

  return {
    get w() {
      return w
    },
    get h() {
      return h
    },
    get x() {
      return x
    },
    get y() {
      return y
    },
    get total() {
      return w * h
    },
    setBounds,
    posToIndex,
    indexToPos,
    isValidPos,
    getNeighbors,
    getLineIndices,
  }
}
