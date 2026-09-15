import {
  NEIGHBOR_DIRS,
  arrayShuffle,
  create2DArray,
  createBoardGrid,
  createTimer,
} from '@shared/lib'

export type GamePhase = 'ready' | 'playing' | 'won' | 'lost'
export type Operation = 'reveal' | 'toggle-flag' | 'chord-reveal'
/**
 * 'exploded' | 'misflagged' are computed post-game views, added for convenient UI rendering
 */
export type CellView =
  'covered' | 'revealed' | 'flagged' | 'exploded' | 'misflagged'

export interface Cell {
  index: number
  mine: boolean
  view: CellView
  adjacentMineCount?: number
}

export interface BoardConfig {
  w: number
  h: number
  m: number /** number of mines */
}

export interface ModelProps extends BoardConfig {
  elapsedMs?: number /** milliseconds */
  cellMasks?: readonly number[]
}

const CELL_FLAGS = {
  reveal: 1 << 0, // 0b001
  flag: 1 << 1, // 0b010
  mine: 1 << 2, // 0b100
} as const

/**
 * The first click reveals its own cell plus up to 8 neighbors, all kept mine-free
 * by `placeMines` — so a board must keep at least this many cells safe.
 */
export const FIRST_CLICK_SAFE_COUNT = NEIGHBOR_DIRS.length + 1

export function createModel(props: ModelProps = { w: 9, h: 9, m: 10 }) {
  let phase: GamePhase = 'ready'
  let cells: Cell[] = []
  let flagIndices: Set<number> = new Set()
  let mineIndices: number[] = []
  let totalMineCount = 0
  let totalSafeCount = 0
  let adjacentCellsCache = new WeakMap<Cell, Cell[]>()
  const board = createBoardGrid(props)
  const timer = createTimer(props.elapsedMs)

  function restore({ elapsedMs, cellMasks, w, h, m }: ModelProps) {
    const total = w * h
    if (m <= 0 || total - m < FIRST_CLICK_SAFE_COUNT) {
      throw new RangeError(
        `restore: m (${m}) must be > 0 and leave at least ${FIRST_CLICK_SAFE_COUNT} safe cells on a ${w}x${h} board`,
      )
    }

    flagIndices.clear()
    mineIndices = []
    totalMineCount = m
    totalSafeCount = total - m
    timer.reset(elapsedMs || 0)
    phase = 'ready'

    const needsInit = board.w !== w || board.h !== h || cells.length === 0
    if (needsInit) {
      adjacentCellsCache = new WeakMap<Cell, Cell[]>()
      board.setBounds({ w, h })
      cells = Array.from({ length: total }, (_, i) => ({
        index: i,
        mine: false,
        view: 'covered',
      }))
    } else {
      cells.forEach(c => {
        c.mine = false
        c.view = 'covered'
        c.adjacentMineCount = undefined
      })
    }

    if (cellMasks?.length) {
      applyCellMasks(cellMasks)
      timer.start()
      phase = 'playing'
    }
  }

  /**
   * Restart the game with the same board config and mine distribution.
   */
  function restart() {
    cells.forEach(c => (c.view = 'covered'))
    totalSafeCount = cells.length - totalMineCount
    flagIndices.clear()
    timer.reset()
    phase = 'ready'
  }

  function operate(cell: Cell, op: Operation) {
    if (phase === 'won' || phase === 'lost') return

    if (phase === 'ready') {
      if (mineIndices.length === 0) {
        placeMines(cell)
      }
      timer.start()
      phase = 'playing'
    }

    switch (op) {
      case 'reveal':
        reveal(cell)
        break
      case 'toggle-flag':
        toggleFlag(cell)
        break
      case 'chord-reveal':
        chordReveal(cell)
        break
    }
  }

  function revealAll() {
    if (phase === 'won') {
      for (const c of cells) {
        if (c.view === 'covered') {
          c.view = 'flagged'
          flagIndices.add(c.index)
        }
      }
    } else if (phase === 'lost') {
      for (const c of cells) {
        if (c.view === 'flagged' && !c.mine) {
          c.view = 'misflagged'
        }
        if (c.view === 'covered' && c.mine) {
          c.view = 'revealed'
        }
      }
    }
  }

  function toCells2D() {
    return create2DArray(board.h, board.w, p => cells[board.posToIndex(p)])
  }

  function getAdjacentCells(cell: Cell) {
    const cache = adjacentCellsCache.get(cell)
    if (cache) return cache

    const result = board.getNeighbors(cell.index, true).map(i => cells[i])
    adjacentCellsCache.set(cell, result)
    return result
  }

  function getAdjacentMineCount(cell: Cell) {
    ensureAdjacentMineCount(cell)
    return cell.adjacentMineCount
  }

  function getCellMasks() {
    const result: number[] = []
    for (const c of cells) {
      const mask =
        (c.mine ? CELL_FLAGS.mine : 0) |
        (c.view === 'revealed' ? CELL_FLAGS.reveal : 0) |
        (c.view === 'flagged' ? CELL_FLAGS.flag : 0)
      if (mask > 0) {
        result.push(c.index, mask)
      }
    }
    return result
  }

  function applyCellMasks(cellMasks: readonly number[]) {
    const revealed: Cell[] = []
    for (let i = 0; i < cellMasks.length; i += 2) {
      const index = cellMasks[i]
      const cell = cells[index]
      const mask = cellMasks[i + 1]
      if (mask & CELL_FLAGS.reveal) {
        cell.view = 'revealed'
        revealed.push(cell)
        totalSafeCount--
      }
      if (mask & CELL_FLAGS.flag) {
        cell.view = 'flagged'
        flagIndices.add(index)
      }
      if (mask & CELL_FLAGS.mine) {
        cell.mine = true
        mineIndices.push(index)
      }
    }
    revealed.forEach(ensureAdjacentMineCount)
  }

  function ensureAdjacentMineCount(cell: Cell) {
    if (cell.adjacentMineCount !== undefined) return

    const mineCells = getAdjacentCells(cell).filter(c => c.mine)
    cell.adjacentMineCount = mineCells.length
  }

  function placeMines(safeCell: Cell) {
    const excluded = new Set([safeCell, ...getAdjacentCells(safeCell)])
    const candidates = cells.filter(c => !excluded.has(c))
    arrayShuffle(candidates, totalMineCount).forEach(c => {
      c.mine = true
      mineIndices.push(c.index)
    })
  }

  function reveal(cell: Cell) {
    if (phase !== 'playing' || cell.view !== 'covered') return

    if (cell.mine) {
      cell.view = 'exploded'
      phase = 'lost'
      timer.stop()
      revealAll()
      return
    }

    cell.view = 'revealed'
    if (getAdjacentMineCount(cell) === 0) {
      floodReveal(cell)
    }

    totalSafeCount--
    if (totalSafeCount === 0) {
      phase = 'won'
      timer.stop()
      revealAll()
    }
  }

  function toggleFlag(cell: Cell) {
    if (cell.view === 'covered') {
      cell.view = 'flagged'
      flagIndices.add(cell.index)
    } else if (cell.view === 'flagged') {
      cell.view = 'covered'
      flagIndices.delete(cell.index)
    }
  }

  function chordReveal(cell: Cell) {
    if (cell.view !== 'revealed') return

    const adjacent = getAdjacentCells(cell)
    const count = adjacent.filter(c => c.view === 'flagged').length
    if (count === 0 || count !== getAdjacentMineCount(cell)) return

    adjacent.forEach(reveal)
  }

  function floodReveal(cell: Cell) {
    const stack = [cell]
    while (stack.length > 0) {
      getAdjacentCells(stack.pop()!).forEach(c => {
        if (c.view === 'covered' && !c.mine) {
          c.view = 'revealed'
          totalSafeCount--
          if (getAdjacentMineCount(c) === 0) {
            stack.push(c)
          }
        }
      })
    }
  }

  restore(props)

  return {
    restore,
    restart,
    operate,
    revealAll,
    toCells2D,
    getCellMasks,
    getAdjacentCells,
    get boardConfig() {
      return { w: board.w, h: board.h, m: totalMineCount }
    },
    get phase() {
      return phase
    },
    get elapsedMs() {
      return timer.value
    },
    get flagCount() {
      return flagIndices.size
    },
  }
}
