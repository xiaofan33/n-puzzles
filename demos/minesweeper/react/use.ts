import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useForceRerender } from '@shared/hooks'
import type { Position } from '@shared/utils'
import { createModel, type Operation } from '../model'

export function useModel() {
  const [model] = useState(() => createModel())
  const { w, h, m } = model.boardConfig
  const cells = useMemo(() => model.toCells2D(), [w, h])
  const rerender = useForceRerender()
  const getElapsedMs = useCallback(() => model.elapsedMs, [model])

  return {
    w,
    h,
    m,
    cells,
    phase: model.phase,
    flagCount: model.flagCount,
    restore: rerender(model.restore),
    restart: rerender(model.restart),
    operate: rerender(model.operate),
    getAdjacentCells: model.getAdjacentCells,
    getCellMasks: model.getCellMasks,
    getElapsedMs,
  }
}

export function useBoard(
  element: RefObject<HTMLDivElement | null>,
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
      const x = e.clientX - left + el.scrollLeft
      const y = e.clientY - top + el.scrollTop
      return {
        pos: { x, y },
        isValid: x >= 0 && x < el.scrollWidth && y >= 0 && y < el.scrollHeight,
      }
    }

    const reset = () => {
      const drag = dragRef.current
      if (!drag) return

      if (drag.rafId) {
        cancelAnimationFrame(drag.rafId)
      }
      if (el.hasPointerCapture(drag.pointerId)) {
        el.releasePointerCapture(drag.pointerId)
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
      el.setPointerCapture(e.pointerId)
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
      } else {
        reset()
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || e.pointerId !== drag.pointerId) return

      try {
        const { pos, isValid } = toBoardPos(e)
        if (isValid) {
          if (drag.button === 0) {
            handlerRef.current('reveal', pos)
          } else if (drag.button === 2) {
            handlerRef.current('toggle-flag', pos)
          }
        }
      } finally {
        reset()
      }
    }

    // pointercancel must not commit an operation: its coordinates/button are
    // unreliable, and it usually means a browser gesture took over the pointer.
    const onPointerCancel = (e: PointerEvent) => {
      if (dragRef.current?.pointerId === e.pointerId) {
        reset()
      }
    }

    const ac = new AbortController()
    const { signal } = ac
    el.addEventListener('contextmenu', e => e.preventDefault(), { signal })
    el.addEventListener('pointerdown', onPointerDown, { signal })
    document.addEventListener('pointermove', onPointerMove, { signal })
    document.addEventListener('pointerup', onPointerUp, { signal })
    document.addEventListener('pointercancel', onPointerCancel, { signal })
    // A pointer released outside the window never fires pointerup, so fall back
    // to reset on window blur to avoid a permanently stuck drag state.
    window.addEventListener('blur', reset, { signal })
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
