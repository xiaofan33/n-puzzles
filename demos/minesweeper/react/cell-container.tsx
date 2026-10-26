import { memo, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from 'cn'
import { GLYPHS, type Settings } from '../preset'
import { pickCell } from '../utils'
import type { Cell, Operation } from '../model'
import { useBoard } from './use'
import styles from '../assets/main.module.css'

const BASE_GRADIENT = 'bg-linear-to-br border-(--cell-border)'
const GRADIENT = cn(BASE_GRADIENT, 'from-(--cell-from) to-(--cell-to)')
const HI_GRADIENT = cn(BASE_GRADIENT, 'from-(--cell-hi-from) to-(--cell-hi-to)')

const CellItem = memo(function CellItem({
  index,
  mine,
  view,
  adjacentMineCount,
  columns,
  idPrefix,
  highlight = false,
  focused = false,
}: Cell & {
  columns: number
  idPrefix: string
  highlight?: boolean
  focused?: boolean
}) {
  const glyphKey =
    view === 'exploded'
      ? 'boom'
      : view === 'flagged' || view === 'misflagged'
        ? 'flag'
        : view === 'revealed'
          ? mine
            ? 'mine'
            : String(adjacentMineCount)
          : 'blank'

  const glyph = GLYPHS[glyphKey as keyof typeof GLYPHS] ?? ''

  const stateLabel =
    view === 'flagged'
      ? '已插旗'
      : view === 'misflagged'
        ? '插旗错误'
        : view === 'exploded'
          ? '踩到雷'
          : view === 'revealed'
            ? mine
              ? '地雷'
              : `已翻开，周围 ${adjacentMineCount} 颗雷`
            : '未翻开'

  const cls =
    view === 'exploded'
      ? `${styles['boom-shake']} border-transparent bg-red-600`
      : view === 'misflagged'
        ? 'border-transparent bg-red-300'
        : view === 'revealed' || highlight
          ? HI_GRADIENT
          : `${GRADIENT} hover:from-(--accent-soft) hover:to-(--accent-deep)`

  return (
    <div
      id={`${idPrefix}-${index}`}
      role="gridcell"
      aria-label={`第 ${Math.floor(index / columns) + 1} 行第 ${(index % columns) + 1} 列，${stateLabel}`}
      data-num={glyphKey}
      className={cn(
        'flex size-(--cell-size) items-center justify-center rounded-(--cell-radius) border font-mono font-bold',
        cls,
        focused && 'ring-2 ring-inset ring-(--accent-deep)',
      )}
    >
      {glyph}
    </div>
  )
})

export function CellContainer({
  isReady,
  settings,
  cells,
  getAdjacentCells,
  onOperate,
}: {
  isReady: boolean
  settings: Settings
  cells: Cell[][]
  getAdjacentCells: (c: Cell) => Cell[]
  onOperate: (c: Cell, op: Operation) => void
}) {
  const { radius, size, clickToFlag } = settings
  const columns = cells[0]?.length ?? 0
  const gap = Math.round(size * 0.05)
  const cssVars = {
    '--col': `${columns}`,
    '--gap': `${gap}px`,
    '--cell-fontsize': `${size * 0.65}px`,
    '--cell-radius': `${radius}px`,
    '--cell-size': `${size}px`,
  }

  const boardRef = useRef<HTMLDivElement | null>(null)
  const { enableHighlight, pointerPosition } = useBoard(boardRef, (op, pos) => {
    const cell = pickCell(pos, size, gap, cells)
    if (!cell) return

    let effectiveOp = op
    if (op === 'reveal' && cell.view === 'revealed') {
      effectiveOp = 'chord-reveal'
    } else if (op === 'reveal' && clickToFlag && !isReady) {
      effectiveOp = 'toggle-flag'
    }
    onOperate(cell, effectiveOp)
  })

  const gridId = useId()
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [keyboardActive, setKeyboardActive] = useState(false)
  const focusedCellIndex = Math.min(
    focusedIndex,
    Math.max(0, cells.length * columns - 1),
  )

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!columns) return

    const row = Math.floor(focusedCellIndex / columns)
    const col = focusedCellIndex % columns
    const moveTo = (nextRow: number, nextCol: number) => {
      e.preventDefault()
      const r = Math.min(Math.max(nextRow, 0), cells.length - 1)
      const c = Math.min(Math.max(nextCol, 0), columns - 1)
      setFocusedIndex(r * columns + c)
      setKeyboardActive(true)
    }
    const operateFocused = (op: Operation) => {
      const cell = cells[row]?.[col]
      if (!cell) return
      e.preventDefault()
      setKeyboardActive(true)
      onOperate(cell, op)
    }

    switch (e.key) {
      case 'ArrowUp':
        moveTo(row - 1, col)
        break
      case 'ArrowDown':
        moveTo(row + 1, col)
        break
      case 'ArrowLeft':
        moveTo(row, col - 1)
        break
      case 'ArrowRight':
        moveTo(row, col + 1)
        break
      case 'Home':
        moveTo(row, 0)
        break
      case 'End':
        moveTo(row, columns - 1)
        break
      case 'Enter':
      case ' ':
        operateFocused(
          cells[row]?.[col]?.view === 'revealed' ? 'chord-reveal' : 'reveal',
        )
        break
      case 'f':
      case 'F':
        operateFocused('toggle-flag')
        break
    }
  }

  const hoveredCell = pointerPosition
    ? pickCell(pointerPosition, size, gap, cells)
    : undefined

  const highlightedIndices =
    !enableHighlight || !hoveredCell || hoveredCell.view === 'flagged'
      ? undefined
      : hoveredCell.view === 'covered'
        ? clickToFlag
          ? undefined
          : [hoveredCell.index]
        : getAdjacentCells(hoveredCell)
            .filter(c => c.view === 'covered')
            .map(c => c.index)

  const highlighted = highlightedIndices && new Set(highlightedIndices)

  return (
    <div
      data-palette={settings.palette}
      style={cssVars}
      className="mx-auto w-fit max-w-full overflow-auto p-0.5 select-none"
    >
      <div
        ref={boardRef}
        role="grid"
        aria-label="扫雷棋盘"
        aria-rowcount={cells.length}
        aria-colcount={columns}
        aria-activedescendant={`${gridId}-${focusedCellIndex}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onBlur={() => setKeyboardActive(false)}
        className="grid grid-cols-[repeat(var(--col),1fr)] gap-(--gap) text-(length:--cell-fontsize) outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--accent-deep)"
      >
        {cells.map(row => (
          <div key={row[0]?.index} role="row" className="contents">
            {row.map(cell => (
              <CellItem
                key={cell.index}
                {...cell}
                columns={columns}
                idPrefix={gridId}
                highlight={highlighted?.has(cell.index) ?? false}
                focused={keyboardActive && cell.index === focusedCellIndex}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
