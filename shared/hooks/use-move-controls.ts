import { useEffect, useRef, type RefObject } from 'react'
import { usePointerSwipe } from '.'

const defaultKeyMap: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowLeft: 'left',
  ArrowDown: 'down',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  a: 'left',
  A: 'left',
  s: 'down',
  S: 'down',
  d: 'right',
  D: 'right',
}

export interface UseMoveControlsConfig {
  /**
   * Keyboard key (KeyboardEvent.key) to direction mapping.
   * Default: WASD + Arrow keys.
   */
  keyMap?: Record<string, Direction>

  /**
   * Minimum swipe distance in pixels before a move is recognized.
   * Default: 30
   */
  threshold?: number

  /**
   * Fires when a move direction is recognized from keyboard or swipe.
   */
  onMove?: (direction: Direction) => void
}

/**
 * Unified move controls that translate keyboard keys and pointer swipes
 * into a single Direction stream.
 *
 * Keyboard events are listened on the window so they work without focus
 * on the target. Swipes are detected on the target element via
 * usePointerSwipe; swipes that don't reach the threshold are ignored.
 */
export function useMoveControls(
  target: RefObject<HTMLElement | null>,
  config: UseMoveControlsConfig = {},
) {
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { keyMap = defaultKeyMap, onMove } = configRef.current
      const direction = keyMap[e.key]
      if (!direction || !onMove) return

      // preventDefault blocks default browser behavior (e.g. arrow-key scrolling)
      // for mapped keys, which is intentional for game controls.
      e.preventDefault()
      onMove(direction)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  usePointerSwipe(target, {
    threshold: config.threshold,
    onSwipeEnd: (_e, direction) => {
      if (direction === 'none') return

      config.onMove?.(direction)
    },
  })
}
