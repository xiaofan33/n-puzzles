import {
  arrayShuffle,
  createBoardGrid,
  createUndoStack,
  randomWeighted,
} from '@shared/lib'
import { defaultPreset, type Preset } from './config'

type LineConfig = {
  key: keyof Position
  isReverse: boolean
  getLength: () => number
  getIndices: (i: number) => number[]
}

export interface TileState extends Position {
  id?: number
  value: number
  // whether this tile was generated at the start of a new game
  isInitial?: boolean
}

export interface ModelState {
  score: number
  steps: number
  tiles: TileState[]
  gg?: boolean
}

export interface ModelProps extends Preset {
  undoCapacity?: number
  initialState?: Partial<ModelState>
}

const nextId = (() => {
  let id = 0
  return () => id++
})()

export function createModel(defaultProps: ModelProps = defaultPreset) {
  let props: ModelProps
  let state: ModelState
  let slots: Array<TileState | null>
  const boardGrid = createBoardGrid()
  const undoStack = createUndoStack<ModelState>()
  // prettier-ignore
  const lineMoves: Record<Direction, LineConfig> = {
    up   : { key: "y", isReverse: true,  getLength: () => boardGrid.w, getIndices: (i: number) => boardGrid.getLineIndices(i, 'vertical') },
    down : { key: "y", isReverse: false, getLength: () => boardGrid.w, getIndices: (i: number) => boardGrid.getLineIndices(i, 'vertical') },
    left : { key: "x", isReverse: true,  getLength: () => boardGrid.h, getIndices: (i: number) => boardGrid.getLineIndices(i * boardGrid.w, 'horizontal') },
    right: { key: "x", isReverse: false, getLength: () => boardGrid.h, getIndices: (i: number) => boardGrid.getLineIndices(i * boardGrid.w, 'horizontal') },
  }

  function restore(patch: Partial<ModelProps> = {}) {
    const { undoCapacity = 1, initialState, ...preset } = patch

    props = { ...props, ...preset }
    state = { score: 0, steps: 0, tiles: [], gg: false, ...initialState }
    boardGrid.setBounds(props.boardSize)
    undoStack.reset(undoCapacity)
    slots = createSlots()

    if (state.tiles.length === 0) {
      spawn(props.spawnAtStart, true)
    } else {
      state.tiles.forEach(t => (t.id = nextId()))
    }

    state.gg = !canMove()
  }

  function move(dir: Direction) {
    if (state.gg) return

    const result = processLineMove(lineMoves[dir])
    if (!result.hasMoved) return

    state.tiles = state.tiles.filter(t => t.value !== 0)
    undoStack.push(dumpState())
    state.score += result.scoreGained
    state.steps += 1
    slots = createSlots()

    const spawned = spawn(props.spawnPerMove, true)
    if (!spawned || !canMove()) {
      state.gg = true
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

  function dump(): ModelProps {
    return {
      ...props,
      initialState: dumpState(true),
    }
  }

  function dumpState(omitId = false): ModelState {
    const tiles = omitId
      ? state.tiles.map(({ isInitial: _, id: __, ...t }) => t)
      : state.tiles.map(({ isInitial: _, ...t }) => t)

    return { ...state, tiles }
  }

  function spawn(count: number, initial = false) {
    if (count <= 0) return true

    const emptySlots = slots.reduce<number[]>((acc, t, i) => {
      if (t === null) acc.push(i)
      return acc
    }, [])
    if (emptySlots.length < count) return false

    arrayShuffle(emptySlots, count).forEach(i => {
      const pos = boardGrid.indexToPos(i)
      const t = createTile(pos)
      if (initial) {
        t.isInitial = true
      }
      state.tiles.push(t)
      slots[i] = t
    })
  }

  function createSlots() {
    const next = Array<TileState | null>(boardGrid.total).fill(null)
    state.tiles.forEach(t => {
      if (t.value !== 0) {
        next[boardGrid.posToIndex(t)] = t
      }
    })
    return next
  }

  function createTile(pos: Position): TileState {
    return {
      id: nextId(),
      value: randomWeighted(props.valueWeights).value,
      ...pos,
    }
  }

  function processLineMove(config: LineConfig) {
    const { key, isReverse, getLength, getIndices } = config
    let hasMoved = false
    let scoreGained = 0

    for (let i = 0; i < getLength(); i++) {
      const indices = getIndices(i)
      const tiles = indices.map(j => slots[j]).filter(t => t !== null)
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

  restore(defaultProps)

  return {
    get props() {
      return props
    },
    get state() {
      return state
    },
    restore,
    move,
    undo,
    dump,
    canMove,
    canUndo,
  }
}
