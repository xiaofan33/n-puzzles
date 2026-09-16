import { useEffect, useMemo, useRef, useState } from 'react'
import { useForceRerender } from '@shared/hooks'
import { createModel, type Operation } from '../model'

export function useModel() {
  const [m] = useState(() => createModel())
  const rerender = useForceRerender()

  const boardConfig = m.boardConfig
  const cells = useMemo(() => m.toCells2D(), [boardConfig.w, boardConfig.h])

  return {
    boardConfig,
    cells,
    phase: m.phase,
    flagCount: m.flagCount,
    restore: rerender(m.restore),
    restart: rerender(m.restart),
    operate: rerender(m.operate),
    getElapsedMs: m.getElapsedMs,
    getCellMasks: m.getCellMasks,
    getAdjacentCells: m.getAdjacentCells,
  }
}

export function useBoard(
  element: React.RefObject<HTMLElement | null>,
  handler: (op: Operation, pos: Position) => void,
) {
  const [enableHighlight, setEnableHighlight] = useState(false)
  const [pointerPosition, setPointerPosition] = useState<Position | null>(null)

  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const dragRef = useRef<{
    pointerId: number
    button: number
    rafId: number
    nextPos: Position | null
  } | null>(null)

  useEffect(() => {
    const el = element.current
    if (!el) return

    const toBoardPos = (e: MouseEvent) => {
      const { left, top } = el.getBoundingClientRect()
      const { scrollWidth, scrollHeight, scrollLeft, scrollTop } = el
      const x = e.clientX - left + scrollLeft
      const y = e.clientY - top + scrollTop
      return {
        pos: { x, y },
        isValid: x >= 0 && x < scrollWidth && y >= 0 && y < scrollHeight,
      }
    }

    const reset = () => {
      const drag = dragRef.current
      if (!drag) return

      if (drag.rafId) {
        cancelAnimationFrame(drag.rafId)
      }
      dragRef.current = null
      setPointerPosition(null)
      setEnableHighlight(false)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (dragRef.current) return

      const { pos } = toBoardPos(e)
      dragRef.current = {
        pointerId: e.pointerId,
        button: e.button,
        rafId: 0,
        nextPos: pos,
      }
      setEnableHighlight(e.button === 0)
      setPointerPosition(pos)
    }

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || e.pointerId !== drag.pointerId) return

      const { pos, isValid } = toBoardPos(e)
      if (isValid) {
        drag.nextPos = pos
        if (!drag.rafId) {
          drag.rafId = requestAnimationFrame(() => {
            drag.rafId = 0
            if (drag.nextPos) {
              setPointerPosition(drag.nextPos)
              drag.nextPos = null
            }
          })
        }
        setEnableHighlight(drag.button === 0)
      } else {
        reset()
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || e.pointerId !== drag.pointerId) return

      const { pos, isValid } = toBoardPos(e)
      if (isValid) {
        if (drag.button === 0) {
          handlerRef.current('reveal', pos)
        } else if (drag.button === 2) {
          handlerRef.current('toggle-flag', pos)
        }
      }
      reset()
    }

    const ac = new AbortController()
    const { signal } = ac
    el.addEventListener('contextmenu', e => e.preventDefault(), { signal })
    el.addEventListener('pointerdown', onPointerDown, { signal })
    document.addEventListener('pointermove', onPointerMove, { signal })
    document.addEventListener('pointerup', onPointerUp, { signal })
    document.addEventListener('pointercancel', onPointerUp, { signal })
    return () => {
      ac.abort()
      reset()
    }
  }, [element])

  return {
    enableHighlight,
    pointerPosition,
  }
}
