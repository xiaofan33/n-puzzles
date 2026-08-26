import { useState } from 'react'

export function usePrevious<T>(value: T): T | null {
  const [curr, setCurr] = useState(value)
  const [prev, setPrev] = useState<T | null>(null)

  if (value !== curr) {
    setPrev(curr)
    setCurr(value)
  }

  return prev
}
