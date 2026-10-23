import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useForceRerender } from '@shared/hooks'
import { createModel } from '../model'
import type { Position } from '@shared/utils'

export function useModel() {
  const [m] = useState(() => createModel())
  const rerender = useForceRerender()
  return {
    props: m.props,
    state: m.state,
    init: rerender(m.init),
    move: rerender(m.move),
    undo: rerender(m.undo),
    canMove: m.canMove,
    canUndo: m.canUndo,
    snapshot: m.snapshot,
  }
}

export function useFlip(target: RefObject<HTMLElement | null>, pos: Position) {
  const prevPos = useRef<Position | null>(null)

  useLayoutEffect(() => {
    const el = target.current
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
