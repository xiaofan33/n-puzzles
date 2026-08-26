import { useEffect, useRef, type RefObject } from 'react'

type SwipeDirection = Direction | 'none'
type PointerType = 'mouse' | 'touch' | 'pen'

export interface UsePointerSwipeConfig {
  /**
   * Minimum distance in pixels before a swipe is recognized.
   * Default: 30
   */
  threshold?: number

  /**
   * Fires on pointer down.  
   */
  onSwipeStart?: (e: PointerEvent) => void

  /**
   * Fires continuously while swiping past threshold.
   */
  onSwipe?: (e: PointerEvent) => void

  /**
   * Fires when swipe ends (pointerup / pointercancel).
   * Direction is 'none' when displacement never reached the threshold.
   */
  onSwipeEnd?: (e: PointerEvent, direction: SwipeDirection) => void

  /**
   * Pointer types to listen to.
   * Default: ['mouse', 'touch', 'pen']
   */
  pointerTypes?: PointerType[]

  /**
   * Disable text selection on the target during swipe.
   * Default: false
   */
  disableTextSelect?: boolean
}

const DEFAULT_POINTER_TYPES: PointerType[] = ['mouse', 'touch', 'pen']
const DEFAULT_THRESHOLD = 30

const { abs, max } = Math

function resolveDirection(dx: number, dy: number): SwipeDirection {
  if (abs(dx) > abs(dy)) {
    return dx > 0 ? 'right' : 'left'
  }
  return dy > 0 ? 'down' : 'up'
}

/**
 * Reactive pointer-event-based swipe detection, inspired by VueUse.
 * Attaches listeners to the target element and invokes callbacks
 * through the swipe lifecycle.
 *
 * Note: The target element must be present at mount time. For touch
 * devices, set `touch-action: none` on the target via CSS to prevent
 * the browser from intercepting the gesture.
 */
export function usePointerSwipe(
  target: RefObject<HTMLElement | null>,
  config: UsePointerSwipeConfig,
): void {
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    const el = target.current
    if (!el || !config.disableTextSelect) return

    const prevUserSelect = el.style.getPropertyValue('user-select')
    const prevWebkit = el.style.getPropertyValue('-webkit-user-select')
    el.style.setProperty('user-select', 'none')
    el.style.setProperty('-webkit-user-select', 'none')

    return () => {
      el.style.setProperty('user-select', prevUserSelect)
      el.style.setProperty('-webkit-user-select', prevWebkit)
    }
  }, [target, config.disableTextSelect])

  useEffect(() => {
    const el = target.current
    if (!el) return

    let startX = 0
    let startY = 0
    let endX = 0
    let endY = 0
    let isPointerDown = false
    let isSwiping = false

    const eventIsAllowed = (e: PointerEvent): boolean => {
      const { pointerTypes = DEFAULT_POINTER_TYPES } = configRef.current
      if (!pointerTypes.includes(e.pointerType as PointerType)) return false

      const isReleasingButton = e.buttons === 0
      const isPrimaryButton = e.buttons === 1
      return isReleasingButton || isPrimaryButton
    }

    const handleDown = (e: PointerEvent) => {
      if (!eventIsAllowed(e)) return

      isPointerDown = true
      startX = e.clientX
      startY = e.clientY
      endX = startX
      endY = startY
      el.setPointerCapture(e.pointerId)
      configRef.current.onSwipeStart?.(e)
    }

    const handleMove = (e: PointerEvent) => {
      if (!eventIsAllowed(e) || !isPointerDown) return

      endX = e.clientX
      endY = e.clientY
      const distX = abs(endX - startX)
      const distY = abs(endY - startY)
      const { threshold = DEFAULT_THRESHOLD } = configRef.current
      if (!isSwiping && max(distX, distY) >= threshold) {
        isSwiping = true
      }
      if (isSwiping) {
        configRef.current.onSwipe?.(e)
      }
    }

    const handleEnd = (e: PointerEvent) => {
      if (!eventIsAllowed(e)) return

      if (isPointerDown) {
        endX = e.clientX
        endY = e.clientY
        const dx = endX - startX
        const dy = endY - startY
        const direction = isSwiping ? resolveDirection(dx, dy) : 'none'
        configRef.current.onSwipeEnd?.(e, direction)
      }
      isPointerDown = false
      isSwiping = false
    }

    el.addEventListener('pointerdown', handleDown, { passive: true })
    el.addEventListener('pointermove', handleMove, { passive: true })
    el.addEventListener('pointerup', handleEnd, { passive: true })
    el.addEventListener('pointercancel', handleEnd, { passive: true })

    return () => {
      el.removeEventListener('pointerdown', handleDown)
      el.removeEventListener('pointermove', handleMove)
      el.removeEventListener('pointerup', handleEnd)
      el.removeEventListener('pointercancel', handleEnd)
    }
  }, [target])
}
