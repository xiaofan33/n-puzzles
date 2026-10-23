import type { GridSize, Position } from './types'

export const AXIAL_DIRS = Object.freeze(
  [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ].map(d => Object.freeze(d)),
)

export const NEIGHBOR_DIRS = Object.freeze(
  [
    ...AXIAL_DIRS,
    { x: -1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
  ].map(d => Object.freeze(d)),
)

export function createBoard(bounds: Partial<GridSize & Position> = {}) {
  let w = 1,
    h = 1,
    x = 0,
    y = 0

  function resetBounds(patch: Partial<GridSize & Position> = {}) {
    if (patch.w !== undefined) w = Math.max(1, Math.trunc(patch.w))
    if (patch.h !== undefined) h = Math.max(1, Math.trunc(patch.h))
    if (patch.x !== undefined) x = Math.trunc(patch.x)
    if (patch.y !== undefined) y = Math.trunc(patch.y)
  }

  // Coordinate & index helpers below assume in-range integer inputs.
  // Out-of-range or fractional values are not validated — guard with isValidPos.
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

  function getLineIndices(
    index: number,
    orientation: 'horizontal' | 'vertical',
  ): number[] {
    if (orientation === 'horizontal') {
      const start = Math.floor(index / w) * w
      return Array.from({ length: w }, (_, i) => start + i)
    }
    const col = index % w
    return Array.from({ length: h }, (_, i) => col + i * w)
  }

  resetBounds(bounds)

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
    resetBounds,
    posToIndex,
    indexToPos,
    isValidPos,
    getNeighbors,
    getLineIndices,
  }
}
