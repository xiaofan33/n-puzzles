import { describe, expect, it } from 'vitest'
import { createBoard } from './board'

describe('Board', () => {
  describe('getNeighbors — number input, cardinal only', () => {
    // 3x3 board:
    //   0 1 2
    //   3 4 5
    //   6 7 8
    const board = createBoard({ w: 3, h: 3 })

    it('center cell returns 4 neighbors', () => {
      const result = board.getNeighbors(4)
      expect(result).toEqual([1, 7, 3, 5])
    })

    it('top-left corner returns 2 neighbors', () => {
      const result = board.getNeighbors(0)
      expect(result).toEqual([3, 1])
    })

    it('top-right corner returns 2 neighbors', () => {
      const result = board.getNeighbors(2)
      expect(result).toEqual([5, 1])
    })

    it('bottom-left corner returns 2 neighbors', () => {
      const result = board.getNeighbors(6)
      expect(result).toEqual([3, 7])
    })

    it('bottom-right corner returns 2 neighbors', () => {
      const result = board.getNeighbors(8)
      expect(result).toEqual([5, 7])
    })

    it('top-edge cell returns 3 neighbors', () => {
      const result = board.getNeighbors(1)
      expect(result).toEqual([4, 0, 2])
    })

    it('right-edge cell returns 3 neighbors', () => {
      const result = board.getNeighbors(5)
      expect(result).toEqual([2, 8, 4])
    })
  })

  describe('getNeighbors — number input, with diagonals', () => {
    const board = createBoard({ w: 3, h: 3 })

    it('center cell returns 8 neighbors', () => {
      const result = board.getNeighbors(4, true)
      expect(result).toEqual([1, 7, 3, 5, 0, 6, 2, 8])
    })

    it('top-left corner returns 3 neighbors', () => {
      const result = board.getNeighbors(0, true)
      expect(result).toEqual([3, 1, 4])
    })

    it('top-edge cell returns 5 neighbors', () => {
      const result = board.getNeighbors(1, true)
      expect(result).toEqual([4, 0, 2, 3, 5])
    })
  })

  describe('getNeighbors — Position input', () => {
    const board = createBoard({ w: 3, h: 3 })

    it('center returns 4 cardinal neighbors', () => {
      const result = board.getNeighbors({ x: 1, y: 1 })
      expect(result).toEqual([
        { x: 1, y: 0 },
        { x: 1, y: 2 },
        { x: 0, y: 1 },
        { x: 2, y: 1 },
      ])
    })

    it('corner returns 2 cardinal neighbors', () => {
      const result = board.getNeighbors({ x: 0, y: 0 })
      expect(result).toEqual([
        { x: 0, y: 1 },
        { x: 1, y: 0 },
      ])
    })

    it('center returns 8 diagonal neighbors', () => {
      const result = board.getNeighbors({ x: 1, y: 1 }, true)
      expect(result).toEqual([
        { x: 1, y: 0 },
        { x: 1, y: 2 },
        { x: 0, y: 1 },
        { x: 2, y: 1 },
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
      ])
    })
  })

  describe('getNeighbors — number vs Position equivalence', () => {
    const sizes = [
      { w: 3, h: 3 },
      { w: 5, h: 4 },
      { w: 1, h: 5 },
      { w: 7, h: 1 },
    ]

    for (const size of sizes) {
      it(`${size.w}x${size.h}: both branches produce same neighbor set`, () => {
        const board = createBoard(size)
        for (let i = 0; i < board.total; i++) {
          const indexResult = board.getNeighbors(i) as number[]
          const pos = board.indexToPos(i)
          const posResult = board.getNeighbors(pos)

          const posAsIndex = posResult.map(p => board.posToIndex(p))
          expect(posAsIndex).toEqual(indexResult)
        }
      })

      it(`${size.w}x${size.h}: both branches produce same neighbor set (diagonals)`, () => {
        const board = createBoard(size)
        for (let i = 0; i < board.total; i++) {
          const indexResult = board.getNeighbors(i, true) as number[]
          const pos = board.indexToPos(i)
          const posResult = board.getNeighbors(pos, true)

          const posAsIndex = posResult.map(p => board.posToIndex(p))
          expect(posAsIndex).toEqual(indexResult)
        }
      })
    }
  })

  describe('getNeighbors — offset board', () => {
    it('offset=(5,5) 3x3: number branch returns correct indices', () => {
      const board = createBoard({ x: 5, y: 5, w: 3, h: 3 })
      // index 0 = world pos (5,5) = board-relative (0,0)
      // neighbors: right→index 1, down→index 3
      const result = board.getNeighbors(0)
      expect(result).toEqual([3, 1])
    })

    it('offset=(5,5) 3x3: Position branch uses world coordinates', () => {
      const board = createBoard({ x: 5, y: 5, w: 3, h: 3 })
      const result = board.getNeighbors({ x: 5, y: 5 })
      expect(result).toEqual([
        { x: 5, y: 6 },
        { x: 6, y: 5 },
      ])
    })

    it('offset=(5,5) 3x3: out-of-board world positions have no neighbors', () => {
      const board = createBoard({ x: 5, y: 5, w: 3, h: 3 })
      // (0, 0) is outside the board area [5..7]x[5..7]
      const result = board.getNeighbors({ x: 0, y: 0 })
      expect(result).toEqual([])
    })

    it('offset board: number vs Position equivalence', () => {
      const board = createBoard({ x: 10, y: 20, w: 4, h: 3 })
      for (let i = 0; i < board.total; i++) {
        const indexResult = board.getNeighbors(i) as number[]
        const pos = board.indexToPos(i)
        const posResult = board.getNeighbors(pos)

        const posAsIndex = posResult.map(p => board.posToIndex(p))
        expect(posAsIndex).toEqual(indexResult)
      }
    })
  })

  describe('getNeighbors — edge case boards', () => {
    it('1x1 board: no neighbors', () => {
      const board = createBoard({ w: 1, h: 1 })
      expect(board.getNeighbors(0)).toEqual([])
      expect(board.getNeighbors(0, true)).toEqual([])
      expect(board.getNeighbors({ x: 0, y: 0 })).toEqual([])
    })

    it('1x4 single row: only left/right neighbors', () => {
      const board = createBoard({ w: 4, h: 1 })
      expect(board.getNeighbors(0)).toEqual([1]) // right only
      expect(board.getNeighbors(1)).toEqual([0, 2]) // left, right
      expect(board.getNeighbors(3)).toEqual([2]) // left only
    })

    it('4x1 single column: only up/down neighbors', () => {
      const board = createBoard({ w: 1, h: 4 })
      expect(board.getNeighbors(0)).toEqual([1]) // down only
      expect(board.getNeighbors(1)).toEqual([0, 2]) // up, down
      expect(board.getNeighbors(3)).toEqual([2]) // up only
    })
  })

  describe('posToIndex / indexToPos', () => {
    it('round-trip with zero offset', () => {
      const board = createBoard({ w: 5, h: 4 })
      for (let i = 0; i < board.total; i++) {
        expect(board.posToIndex(board.indexToPos(i))).toBe(i)
      }
    })

    it('round-trip with non-zero offset', () => {
      const board = createBoard({ x: 3, y: 7, w: 5, h: 4 })
      for (let i = 0; i < board.total; i++) {
        expect(board.posToIndex(board.indexToPos(i))).toBe(i)
      }
    })
  })

  describe('isValidPos', () => {
    it('zero offset: in-bounds and out-of-bounds', () => {
      const board = createBoard({ w: 3, h: 3 })
      expect(board.isValidPos({ x: 0, y: 0 })).toBe(true)
      expect(board.isValidPos({ x: 2, y: 2 })).toBe(true)
      expect(board.isValidPos({ x: -1, y: 0 })).toBe(false)
      expect(board.isValidPos({ x: 3, y: 0 })).toBe(false)
      expect(board.isValidPos({ x: 0, y: 3 })).toBe(false)
    })

    it('non-zero offset: uses world coordinates', () => {
      const board = createBoard({ x: 5, y: 5, w: 3, h: 3 })
      expect(board.isValidPos({ x: 5, y: 5 })).toBe(true)
      expect(board.isValidPos({ x: 7, y: 7 })).toBe(true)
      expect(board.isValidPos({ x: 4, y: 5 })).toBe(false)
      expect(board.isValidPos({ x: 8, y: 5 })).toBe(false)
      expect(board.isValidPos({ x: 0, y: 0 })).toBe(false)
    })
  })

  describe('getLineIndices', () => {
    const board = createBoard({ w: 3, h: 3 })

    describe('axis: row', () => {
      it('center cell → [3, 4, 5]', () => {
        expect(board.getLineIndices(4, 'horizontal')).toEqual([3, 4, 5])
      })

      it('top-left corner → [0, 1, 2]', () => {
        expect(board.getLineIndices(0, 'horizontal')).toEqual([0, 1, 2])
      })

      it('top-right corner → [0, 1, 2]', () => {
        expect(board.getLineIndices(2, 'horizontal')).toEqual([0, 1, 2])
      })

      it('bottom-right corner → [6, 7, 8]', () => {
        expect(board.getLineIndices(8, 'horizontal')).toEqual([6, 7, 8])
      })

      it('1x4 single row: any index returns all', () => {
        const g = createBoard({ w: 4, h: 1 })
        expect(g.getLineIndices(0, 'horizontal')).toEqual([0, 1, 2, 3])
        expect(g.getLineIndices(3, 'horizontal')).toEqual([0, 1, 2, 3])
      })

      it('4x1 single column: each row has 1 element', () => {
        const g = createBoard({ w: 1, h: 4 })
        expect(g.getLineIndices(0, 'horizontal')).toEqual([0])
        expect(g.getLineIndices(3, 'horizontal')).toEqual([3])
      })

      it('non-zero offset: offset does not affect result', () => {
        const g = createBoard({ x: 5, y: 10, w: 3, h: 3 })
        expect(g.getLineIndices(4, 'horizontal')).toEqual([3, 4, 5])
      })
    })

    describe('axis: col', () => {
      it('center cell → [1, 4, 7]', () => {
        expect(board.getLineIndices(4, 'vertical')).toEqual([1, 4, 7])
      })

      it('top-left corner → [0, 3, 6]', () => {
        expect(board.getLineIndices(0, 'vertical')).toEqual([0, 3, 6])
      })

      it('top-right corner → [2, 5, 8]', () => {
        expect(board.getLineIndices(2, 'vertical')).toEqual([2, 5, 8])
      })

      it('bottom-right corner → [2, 5, 8]', () => {
        expect(board.getLineIndices(8, 'vertical')).toEqual([2, 5, 8])
      })

      it('1x4 single row: each column has 1 element', () => {
        const board = createBoard({ w: 4, h: 1 })
        expect(board.getLineIndices(0, 'vertical')).toEqual([0])
        expect(board.getLineIndices(3, 'vertical')).toEqual([3])
      })

      it('4x1 single column: any index returns all', () => {
        const board = createBoard({ w: 1, h: 4 })
        expect(board.getLineIndices(0, 'vertical')).toEqual([0, 1, 2, 3])
        expect(board.getLineIndices(3, 'vertical')).toEqual([0, 1, 2, 3])
      })

      it('non-zero offset: offset does not affect result', () => {
        const board = createBoard({ x: 5, y: 10, w: 3, h: 3 })
        expect(board.getLineIndices(4, 'vertical')).toEqual([1, 4, 7])
      })
    })
  })

  describe('setBounds / total', () => {
    it('default board is 1x1', () => {
      const board = createBoard()
      expect(board.w).toBe(1)
      expect(board.h).toBe(1)
      expect(board.total).toBe(1)
    })

    it('setBounds updates only specified fields', () => {
      const board = createBoard({ x: 1, y: 2, w: 3, h: 4 })
      board.resetBounds({ w: 10 })
      expect(board.x).toBe(1)
      expect(board.y).toBe(2)
      expect(board.w).toBe(10)
      expect(board.h).toBe(4)
    })

    it('total equals w x h', () => {
      const board = createBoard({ w: 7, h: 3 })
      expect(board.total).toBe(21)
    })
  })
})
