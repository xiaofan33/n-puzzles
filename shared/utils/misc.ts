export function createTimer(initialElapsedMs = 0) {
  let elapsedMs = initialElapsedMs
  let startAtMs: number | undefined
  return {
    start() {
      startAtMs ??= performance.now()
    },
    stop() {
      if (startAtMs !== undefined) {
        elapsedMs += performance.now() - startAtMs
        startAtMs = undefined
      }
    },
    reset(ms = 0) {
      elapsedMs = ms
      startAtMs = undefined
    },
    get value() {
      return startAtMs !== undefined
        ? elapsedMs + performance.now() - startAtMs
        : elapsedMs
    },
  }
}

export function createUndoStack<T>(capacity = 1) {
  const stack: (T | undefined)[] = []
  let index = 0
  let count = 0

  function stepIndex(delta: 1 | -1) {
    index = (index + delta + capacity) % capacity
  }

  return {
    push(state: T) {
      if (capacity <= 0) return

      stack[index] = state
      stepIndex(1)
      count = Math.min(count + 1, capacity)
    },

    pop() {
      if (count === 0) return

      stepIndex(-1)
      count--
      const state = stack[index]
      stack[index] = undefined
      return state
    },

    isEmpty() {
      return count === 0
    },

    reset(newCapacity = capacity) {
      capacity = newCapacity
      stack.length = 0
      index = 0
      count = 0
    },
  }
}

export function clamp(value: number, min: number, max: number) {
  if (min > max) {
    throw new RangeError('clamp: min must not exceed max')
  }
  return Math.min(Math.max(value, min), max)
}
