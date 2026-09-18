import { DIR_OFFSETS, arrayShuffle, createBoardGrid } from '@shared/lib'
import { isSolvable } from './solve'
import { validateIds } from './utils'

/**
 * 玩法模式，三者互相独立：
 * - `zero-last` 经典数字：行优先编号，归位后空位停在图片区末格
 * - `snail` 经典数字：螺旋编号，归位后空位停在图片区中心
 * - `fullPic` 图片：图片区底部追加一行停放空位，图片区满铺棋子，
 *   这样归位后整张图片都能显示出来
 */
export type Goal = 'zero-last' | 'snail' | 'fullPic'

/**
 * 排列中的一个棋子。当前位置由它在 `ModelState.pieces` 中的下标表达，
 * 不另存坐标，避免同一信息有两个来源。
 */
export interface PieceState {
  /** 0 表示空位 */
  readonly id: number
  /** 目标位置，由 `goal`/`boardSize` 推导，整局不变 */
  readonly goalPos: Position
}

export interface ModelState {
  /** 当前移动次数 */
  steps: number
  /** 所有棋子都已归位 */
  solved: boolean
  /** 行优先排列；`null` 表示附加行里不放棋子的死格 */
  pieces: Array<PieceState | null>
}

export interface ModelProps {
  /** 图片区尺寸，`fullPic` 下不含追加的那一行 */
  boardSize: GridSize
  goal: Goal
  /**
   * 不能移动的格子下标：该格上的棋子无法滑出，空位也无法滑入
   * @default []
   */
  lockedCells?: number[]
  /** 覆盖初始状态，用于自定义排列或初始步数 */
  initialState?: Partial<ModelState>
}

const MAX_SHUFFLE_ATTEMPTS = 100
const SHUFFLE_MOVES_PER_CELL = 10
const DIRS: readonly Direction[] = ['up', 'down', 'left', 'right']
const OPPOSITE_DIRS: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

/** 螺旋（蜗牛）顺序：从外圈起顺时针逐层向内，末端即图片区中心 */
function createSpiralOrder(w: number, h: number) {
  const order: number[] = []
  let top = 0
  let bottom = h - 1
  let left = 0
  let right = w - 1

  while (top <= bottom && left <= right) {
    for (let x = left; x <= right; x++) order.push(top * w + x)
    top++
    for (let y = top; y <= bottom; y++) order.push(y * w + right)
    right--
    if (top <= bottom) {
      for (let x = right; x >= left; x--) order.push(bottom * w + x)
      bottom--
    }
    if (left <= right) {
      for (let y = bottom; y >= top; y--) order.push(y * w + left)
      left++
    }
  }

  return order
}

/** 图片区内按顺序第 i 格应放的 id */
function createGoalOrder(goal: Goal, w: number, h: number) {
  if (goal === 'snail') return createSpiralOrder(w, h)
  return Array.from({ length: w * h }, (_, i) => i)
}

export function createModel(initialProps: ModelProps) {
  let props = initialProps
  let state: ModelState
  let pieces: Array<PieceState | null> = []
  let goalOrder: number[] = []
  let blankIndexInGoal = 0
  let lockedCells: ReadonlySet<number> = new Set()
  const boardGrid = createBoardGrid()

  /** 空位始终保持 id 0，且排在目标顺序之外 */
  function goalIndexOf(id: number) {
    return id === 0 ? blankIndexInGoal : goalOrder[id - 1]
  }

  function createPiece(id: number): PieceState {
    return { id, goalPos: boardGrid.indexToPos(goalIndexOf(id)) }
  }

  function createSolvedPieces() {
    const pictureCount = goalOrder.length
    // 图片模式下图片块占满图片区，空位停在附加行
    const tileCount = hasExtraRow() ? pictureCount : pictureCount - 1
    const next = new Array<PieceState | null>(boardGrid.total).fill(null)

    goalOrder.forEach((cell, i) => {
      if (i < tileCount) next[cell] = createPiece(i + 1)
    })
    next[blankIndexInGoal] = createPiece(0)

    return next
  }

  function toIdGrid() {
    const { w, h } = boardGrid
    return Array.from({ length: h }, (_, y) =>
      pieces.slice(y * w, (y + 1) * w).map(p => p?.id ?? null),
    )
  }

  function isSolved() {
    return pieces.every((p, i) => !p || boardGrid.posToIndex(p.goalPos) === i)
  }

  function findBlankIndex() {
    return pieces.findIndex(p => p?.id === 0)
  }

  /** 该格可以参与滑动：有棋子，且格子未被锁定 */
  function isMovable(index: number) {
    return Boolean(pieces[index]) && !lockedCells.has(index)
  }

  function neighborIndexOf(index: number, dir: Direction) {
    const pos = boardGrid.indexToPos(index)
    const offset = DIR_OFFSETS[dir]
    const next = { x: pos.x + offset.x, y: pos.y + offset.y }
    return boardGrid.isValidPos(next) ? boardGrid.posToIndex(next) : undefined
  }

  function adjacent(a: number, b: number) {
    const pa = boardGrid.indexToPos(a)
    const pb = boardGrid.indexToPos(b)
    return Math.abs(pa.x - pb.x) + Math.abs(pa.y - pb.y) === 1
  }

  /** 图片区底部是否追加一行：图片区之外的格子不放棋子，供空位停放 */
  function hasExtraRow() {
    return props.goal === 'fullPic'
  }

  function restore(patch: Partial<ModelProps> = {}) {
    const { initialState, ...preset } = patch
    props = { ...props, ...preset }

    const { w, h } = props.boardSize
    boardGrid.setBounds({ w, h: h + (hasExtraRow() ? 1 : 0) })
    goalOrder = createGoalOrder(props.goal, w, h)
    blankIndexInGoal = hasExtraRow()
      ? boardGrid.total - 1
      : goalOrder[goalOrder.length - 1]
    lockedCells = new Set(props.lockedCells ?? [])

    const initialPieces = initialState?.pieces
    pieces = initialPieces?.length ? initialPieces : createSolvedPieces()
    state = { steps: 0, solved: false, ...initialState, pieces }

    const validation = validateIds(toIdGrid())
    if (!validation.isValid) throw new Error(validation.message)

    if (!initialPieces?.length) {
      shuffle()
      state.steps = 0
    }
    state.solved = isSolved()
  }

  /** 把 `index` 处的棋子滑入相邻的空位 */
  function slide(index: number) {
    if (!isMovable(index)) return false

    const blankIndex = findBlankIndex()
    if (!adjacent(index, blankIndex)) return false

    const blank = pieces[blankIndex]
    pieces[blankIndex] = pieces[index]
    pieces[index] = blank

    state.steps += 1
    state.solved = isSolved()
    return true
  }

  /** 空位朝 `dir` 方向滑动 */
  function move(dir: Direction) {
    const index = neighborIndexOf(findBlankIndex(), dir)
    if (index !== undefined) slide(index)
  }

  /** `id` 对应的棋子滑入相邻的空位 */
  function movePiece(id: number) {
    slide(pieces.findIndex(p => p?.id === id))
  }

  function canMoveDir(dir: Direction) {
    const index = neighborIndexOf(findBlankIndex(), dir)
    return index !== undefined && isMovable(index)
  }

  /** 打乱未被锁定的格子，保证有解且不是已解状态 */
  function shuffle() {
    if (hasExtraRow() || lockedCells.size > 0) {
      shuffleByMoves()
      return
    }

    // 普通矩形网格：按逆序数奇偶筛选，可均匀覆盖所有可解排列
    const ids = pieces.map(p => p?.id ?? 0)
    const { w, h } = boardGrid

    for (let attempt = 0; attempt < MAX_SHUFFLE_ATTEMPTS; attempt++) {
      const shuffled = arrayShuffle(ids)
      shuffled.forEach((id, i) => (pieces[i] = createPiece(id)))

      const grid = Array.from({ length: h }, (_, y) =>
        shuffled.slice(y * w, (y + 1) * w),
      )
      if (!isSolved() && isSolvable(grid)) return
    }
  }

  /** 存在死格/锁格时奇偶判据不再适用，改用随机合法走法，结果必然可解 */
  function shuffleByMoves() {
    for (let attempt = 0; attempt < MAX_SHUFFLE_ATTEMPTS; attempt++) {
      let lastDir: Direction | undefined

      for (let i = 0; i < boardGrid.total * SHUFFLE_MOVES_PER_CELL; i++) {
        const options = DIRS.filter(dir => dir !== lastDir && canMoveDir(dir))
        if (options.length === 0) break

        const dir = options[Math.floor(Math.random() * options.length)]
        move(dir)
        lastDir = OPPOSITE_DIRS[dir]
      }

      if (!isSolved()) return
    }
  }

  function dump(): ModelProps {
    return { ...props, initialState: dumpState() }
  }

  function dumpState(): ModelState {
    return { ...state, pieces: pieces.map(p => (p ? { ...p } : null)) }
  }

  restore(initialProps)

  return {
    get props() {
      return props
    },
    get state() {
      return state
    },
    /** 实际渲染尺寸：`fullPic` 下比 `boardSize` 多一行 */
    get gridSize() {
      return { w: boardGrid.w, h: boardGrid.h }
    },
    restore,
    move,
    movePiece,
    dump,
  }
}
