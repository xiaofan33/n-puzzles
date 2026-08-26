import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clamp(value: number, min: number, max: number) {
  if (min > max) {
    throw new RangeError('clamp: min must not exceed max')
  }
  return Math.min(Math.max(value, min), max)
}
