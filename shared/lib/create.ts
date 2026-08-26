export function createTimer(initialElapsed = 0) {
  let elapsed = initialElapsed
  let startAt: number | undefined
  return {
    start() {
      startAt = performance.now()
    },
    stop() {
      if (startAt) {
        elapsed += performance.now() - startAt
        startAt = undefined
      }
    },
    reset(v = 0) {
      elapsed = v
      startAt = undefined
    },
    get value() {
      return startAt ? elapsed + performance.now() - startAt : elapsed
    },
  }
}

export function createUndoStack<T>(capacity = 1) {
  const stack: T[] = []
  let index = 0
  let size = 0

  function stepIndex(delta: 1 | -1) {
    index = (index + delta + capacity) % capacity
  }

  return {
    push(state: T) {
      if (capacity <= 0) return

      stack[index] = state
      stepIndex(1)
      size = Math.min(size + 1, capacity)
    },

    pop() {
      if (size === 0) return

      stepIndex(-1)
      size--
      return stack[index]
    },

    isEmpty() {
      return size === 0
    },

    reset(newCapacity = capacity) {
      capacity = newCapacity
      stack.length = 0
      index = 0
      size = 0
    },
  }
}
