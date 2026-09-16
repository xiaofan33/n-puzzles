import { useMemo, useRef } from 'react'
import { cn } from 'cn'
import { pickCell } from '../utils'
import { glyphs, type Settings } from '../config'
import { useBoard } from './use'
import type { Cell, Operation } from '../model'
import styles from '../assets/board.module.css'

const BASE_GRADIENT = 'bg-linear-to-br border-(--cell-border)'
const GRADIENT = cn(BASE_GRADIENT, 'from-(--cell-from) to-(--cell-to)')
const HI_GRADIENT = cn(BASE_GRADIENT, 'from-(--cell-hi-from) to-(--cell-hi-to)')

export function CellItem(props: Cell & { highlight?: boolean }) {
  const { mine, view, adjacentMineCount, highlight = false } = props

  const code = useMemo(() => {
    if (view === 'exploded') return 'boom'
    if (view === 'flagged' || view === 'misflagged') return 'flag'
    if (view === 'revealed') {
      return mine
        ? 'mine'
        : (adjacentMineCount!.toString() as keyof typeof glyphs)
    }
    return 'blank'
  }, [mine, view, adjacentMineCount])

  const cls = useMemo(() => {
    if (view === 'exploded') {
      return `${styles['boom-shake']} border-transparent bg-red-600`
    }
    if (view === 'misflagged') return 'border-transparent bg-red-300'
    if (view === 'revealed' || highlight) return HI_GRADIENT
    return `${GRADIENT} hover:from-(--accent-soft) hover:to-(--accent-deep)`
  }, [view, highlight])

  return (
    <div
      data-code={code}
      className={cn(
        'flex size-(--cell-size) items-center justify-center rounded-(--cell-radius) border font-mono font-bold transition-[background-color]',
        cls,
      )}
    >
      {glyphs[code]}
    </div>
  )
}

export function Board(props: {
  isReady?: boolean
  settings: Settings
  cells: Cell[][]
  getAdjacentCells: (c: Cell) => Cell[]
  onOperate: (c: Cell, op: Operation) => void
}) {
  const { radius, size, clickToFlag } = props.settings
  const columns = props.cells[0]?.length || 0
  const gap = Math.round(size * 0.05)

  const cssVars = useMemo(
    () => ({
      '--col': `${columns}`,
      '--gap': `${gap}px`,
      '--cell-fontsize': `${size * 0.65}px`,
      '--cell-radius': `${radius}px`,
      '--cell-size': `${size}px`,
    }),
    [columns, radius, size],
  )

  const boardRef = useRef<HTMLDivElement | null>(null)
  const { enableHighlight, pointerPosition } = useBoard(boardRef, (op, pos) => {
    const cell = pickCell(pos, size, gap, props.cells)
    if (!cell) return

    let finalOp = op
    if (op === 'reveal' && cell.view === 'revealed') {
      finalOp = 'chord-reveal'
    } else if (op === 'reveal' && clickToFlag && !props.isReady) {
      finalOp = 'toggle-flag'
    }
    props.onOperate(cell, finalOp)
  })

  const hoveredCell = pointerPosition
    ? pickCell(pointerPosition, size, gap, props.cells)
    : undefined
  const hoveredCellRef = useRef(hoveredCell)
  hoveredCellRef.current = hoveredCell

  const highlightedIndices = useMemo(() => {
    if (!enableHighlight) return

    const cell = hoveredCellRef.current
    if (!cell) return

    if (cell.view === 'flagged' || (clickToFlag && cell.view === 'covered'))
      return

    if (cell.view === 'covered') return [cell.index]

    return props
      .getAdjacentCells(cell)
      .filter(c => c.view === 'covered')
      .map(c => c.index)
  }, [enableHighlight, hoveredCell, clickToFlag])

  return (
    <div
      data-palette={props.settings.palette}
      style={cssVars}
      className="mx-auto w-fit max-w-full overflow-auto p-0.5 select-none"
    >
      <div
        ref={boardRef}
        className="grid grid-cols-[repeat(var(--col),1fr)] gap-(--gap) text-(length:--cell-fontsize)"
      >
        {props.cells.map(row => {
          return row.map(cell => (
            <CellItem
              key={cell.index}
              {...cell}
              highlight={highlightedIndices?.includes(cell.index)}
            />
          ))
        })}
      </div>
    </div>
  )
}
