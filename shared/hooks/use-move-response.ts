import { useEffect, useRef, type RefObject } from 'react'
import { usePointerSwipe } from '.'
import type { Direction } from '../utils'

export type KeyBindings = Partial<Record<string, Direction>>

export const DEFAULT_KEY_BINDINGS: Readonly<KeyBindings> = Object.freeze({
  ArrowUp: 'up',
  ArrowLeft: 'left',
  ArrowDown: 'down',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
})

export interface UseMoveResponseConfig {
  /**
   * Key-to-direction mapping. Matched by `KeyboardEvent.code` first, then
   * by `KeyboardEvent.key` with single characters compared case-insensitively,
   * so both `{ KeyW: 'up' }` and `{ w: 'up' }` work.
   */
  keyBindings?: KeyBindings
  /**
   * Minimum swipe distance in pixels before a move is recognized.
   */
  threshold?: number
  /**
   * Fires when a move direction is recognized from keyboard or swipe.
   */
  onMove?: (direction: Direction) => void
}

export function useMoveResponse(
  target: RefObject<HTMLElement | null>,
  config: UseMoveResponseConfig = {},
) {
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { keyBindings = DEFAULT_KEY_BINDINGS, onMove } = configRef.current
      const fallbackKey = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const direction = keyBindings[fallbackKey]
      if (!direction || !onMove) return
      onMove(direction)
      e.preventDefault()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  usePointerSwipe(target, {
    threshold: config.threshold,
    onSwipeEnd: (_, direction) => {
      if (direction !== 'none') {
        config.onMove?.(direction)
      }
    },
  })
}
