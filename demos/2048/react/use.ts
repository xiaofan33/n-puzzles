import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useForceRerender } from '@shared/hooks'
import { createModel } from '../model'

export function useModel() {
  const [m] = useState(() => createModel())
  const rerender = useForceRerender()

  return {
    props: m.props,
    state: m.state,
    restore: rerender(m.restore),
    move: rerender(m.move),
    undo: rerender(m.undo),
    dump: m.dump,
    canMove: m.canMove,
    canUndo: m.canUndo,
  }
}

export function useFlip(element: RefObject<HTMLElement | null>, pos: Position) {
  const prevPos = useRef<Position | null>(null)

  useLayoutEffect(() => {
    const el = element.current
    if (!el) return

    const prev = prevPos.current
    if (prev !== null && (prev.x !== pos.x || prev.y !== pos.y)) {
      el.style.transition = 'none'
      el.style.transform = transform(prev)
      void el.offsetWidth // force reflow before re-enabling the transition
      el.style.transition = ''
      el.style.transform = transform(pos)
    } else if (prev === null) {
      el.style.transform = transform(pos)
    }
    prevPos.current = pos
  }, [pos.x, pos.y])
}

function transform({ x, y }: Position) {
  return `translate(calc(${x} * var(--tile-step)), calc(${y} * var(--tile-step)))`
}
