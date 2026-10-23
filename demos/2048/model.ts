import {
  arrayShuffle,
  createBoard,
  createUndoStack,
  randomWeighted,
  type Direction,
} from '@shared/utils'
import { DEFAULT_PRESET, type Preset } from './preset'

export interface TileState {
  id?: number
  value: number
  x: number
  y: number
  spawnedAtInit?: boolean
}

export interface GameState {
  score: number
  steps: number
  tiles: TileState[]
  isEnded?: boolean
}

export interface GameProps extends Preset {
  undoCapacity?: number
  initialState?: Partial<GameState>
}

type TileSlots = Array<TileState | null>
type LineProps = {
  key: 'x' | 'y'
  isReverse: boolean
  lineSize: () => number
  lineIndices: (i: number) => number[]
}

const nextId = (() => {
  let id = 0
  return () => id++
})()

export function createModel(defaultProps: GameProps = DEFAULT_PRESET) {
  let props: GameProps = defaultProps
  let state: GameState
  let slots: TileSlots
  let boardGrid = createBoard()
  let undoStack = createUndoStack<GameState>()
  // prettier-ignore
  const lineMoves: Record<Direction, LineProps> = {
    up   : { key: "y", isReverse: true,  lineSize: () => boardGrid.w, lineIndices: (i: number) => boardGrid.getLineIndices(i, 'vertical') },
    down : { key: "y", isReverse: false, lineSize: () => boardGrid.w, lineIndices: (i: number) => boardGrid.getLineIndices(i, 'vertical') },
    left : { key: "x", isReverse: true,  lineSize: () => boardGrid.h, lineIndices: (i: number) => boardGrid.getLineIndices(i * boardGrid.w, 'horizontal') },
    right: { key: "x", isReverse: false, lineSize: () => boardGrid.h, lineIndices: (i: number) => boardGrid.getLineIndices(i * boardGrid.w, 'horizontal') },
  }

  function init({
    undoCapacity = 1,
    initialState,
    ...preset
  }: Partial<GameProps>) {
    props = { ...props, ...preset }
    state = { score: 0, steps: 0, tiles: [], ...initialState }
    boardGrid.resetBounds(props.boardSize)
    undoStack.reset(undoCapacity)
    slots = createSlots()

    if (state.tiles.length === 0) {
      spawn(props.spawnAtStart, true)
    } else {
      state.tiles.forEach(t => (t.id = nextId()))
    }

    state.isEnded = !canMove()
  }

  function move(direction: Direction) {
    if (state.isEnded) return

    const prev = snapshotState()
    const { hasMoved, scoreGained } = processLineMove(lineMoves[direction])

    if (!hasMoved) return

    state.tiles = state.tiles.filter(t => t.value !== 0)
    undoStack.push(prev)
    state.score += scoreGained
    state.steps += 1
    slots = createSlots()

    // spawn returns false when the remaining empty slots cannot fit the configured
    // count (board is full). This is an intended terminal condition, treated the same as
    // "no move available"; the !spawned short-circuit means canMove is not evaluated here.
    const spawned = spawn(props.spawnPerMove)
    if (!spawned || !canMove()) {
      state.isEnded = true
    }
  }

  function canMove() {
    if (slots.some(t => t === null)) return true

    const { w, h, total } = boardGrid
    for (let i = 0; i < total; i++) {
      const value = slots[i]?.value
      if (!value) continue

      const pos = boardGrid.indexToPos(i)
      if (pos.x < w - 1 && slots[i + 1]?.value === value) return true
      if (pos.y < h - 1 && slots[i + w]?.value === value) return true
    }

    return false
  }

  function undo() {
    const prevState = undoStack.pop()
    if (prevState) {
      state = prevState
      slots = createSlots()
    }
  }

  function canUndo() {
    return !undoStack.isEmpty()
  }

  function snapshot(): GameProps {
    return {
      ...props,
      initialState: snapshotState(true),
    }
  }

  function snapshotState(omitId = false): GameState {
    const tiles = omitId
      ? state.tiles.map(({ spawnedAtInit: _, id: __, ...t }) => t)
      : state.tiles.map(({ spawnedAtInit: _, ...t }) => t)

    return { ...state, tiles }
  }

  function spawn(count: number, spawnedAtInit = false): boolean {
    count = Math.max(0, Math.trunc(count))

    const empty = slots.reduce<number[]>((acc, t, i) => {
      if (t === null) acc.push(i)
      return acc
    }, [])

    // Not enough empty slots to fit every new tile: bail out without spawning a
    // partial set; the caller treats this as game over (see move).
    if (empty.length < count) return false

    arrayShuffle(empty, count).forEach(i => {
      const pos = boardGrid.indexToPos(i)
      const t = createTile(pos)
      if (spawnedAtInit) {
        t.spawnedAtInit = true
      }
      state.tiles.push(t)
      slots[i] = t
    })

    return true
  }

  function createSlots(): TileSlots {
    const slots: TileSlots = Array(boardGrid.total).fill(null)
    state.tiles.forEach(t => {
      if (t.value !== 0) slots[boardGrid.posToIndex(t)] = t
    })
    return slots
  }

  function createTile(pos: { x: number; y: number }): TileState {
    const { value } = randomWeighted(props.valueWeights)
    return { id: nextId(), value, ...pos }
  }

  function processLineMove({
    key,
    isReverse,
    lineSize,
    lineIndices,
  }: LineProps) {
    let hasMoved = false
    let scoreGained = 0

    for (let i = 0; i < lineSize(); i++) {
      const indices = lineIndices(i)
      const tiles = indices
        .map(j => slots[j])
        .filter(t => t !== null) as TileState[]
      const count = tiles.length

      if (count === 0) continue

      let slot = 0
      let step = 1
      if (!isReverse) {
        tiles.reverse()
        slot = indices.length - 1
        step = -1
      }

      let j = 0
      while (j < count) {
        const front = tiles[j]
        if (front[key] !== slot) {
          hasMoved = true
        }
        front[key] = slot
        slot += step
        j++

        if (j < count && front.value === tiles[j].value) {
          mergeTiles(tiles[j], front)
          scoreGained += tiles[j].value
          hasMoved = true
          j++
        }
      }
    }

    return { hasMoved, scoreGained }
  }

  function mergeTiles(survivor: TileState, absorbed: TileState) {
    survivor.x = absorbed.x
    survivor.y = absorbed.y
    survivor.value += absorbed.value
    absorbed.value = 0
  }

  init(defaultProps)

  return {
    get props() {
      return props
    },
    get state() {
      return state
    },
    init,
    move,
    undo,
    snapshot,
    canMove,
    canUndo,
  }
}
