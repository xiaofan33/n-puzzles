import type { ModelProps } from './model'

/**
 * Format seconds into MM:SS.
 *
 * - minutes are capped at 99 so the display never exceeds two digits
 * - when minutes are capped at 99, seconds are limited to 59
 */
export function formatTime(seconds: number) {
  const totalSeconds = Math.max(0, seconds)
  const rawMinutes = Math.floor(totalSeconds / 60)
  const minutes = Math.min(rawMinutes, 99)
  const secondsInMinute = totalSeconds % 60
  const s = minutes === 99 ? Math.min(secondsInMinute, 59) : secondsInMinute

  return `${minutes.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Format seconds into a compact duration string.
 * Omits any unit whose value is zero (e.g. 3600 → "1h", 60 → "1m").
 */
export function formatDuration(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secondsInMinute = totalSeconds % 60

  if (hours > 0) {
    let result = `${hours}h`
    if (minutes > 0) {
      result += `${minutes.toString().padStart(2, '0')}m`
    }
    if (secondsInMinute > 0) {
      result += `${secondsInMinute.toString().padStart(2, '0')}s`
    }
    return result
  }

  if (minutes > 0) {
    return secondsInMinute > 0
      ? `${minutes}m${secondsInMinute.toString().padStart(2, '0')}s`
      : `${minutes}m`
  }

  return `${secondsInMinute}s`
}

/**
 * Hit-test a pixel position against a 2D grid.
 * Returns the cell at that position, or `undefined` if the position
 * falls in a gap or outside the grid bounds.
 */
export function pickCell<T>(
  pos: { x: number; y: number },
  size: number,
  gap: number,
  grid: T[][],
) {
  const stride = size + gap
  const col = Math.floor(pos.x / stride)
  const row = Math.floor(pos.y / stride)

  // position lands in the gap area between cells
  if (pos.x - col * stride >= size || pos.y - row * stride >= size) return

  // position lands outside the grid bounds
  if (row >= grid.length || col >= (grid[0]?.length ?? 0)) return

  return grid[row][col]
}

export function encodeShareData(data: ModelProps) {
  const { w, h, m, elapsedMs = 0, cellMasks = [] } = data

  // Header: w(u8) + h(u8) + m(u16BE) + elapsedMs(u32BE) = 8 bytes
  const header = new Uint8Array(8)
  header[0] = w
  header[1] = h
  header[2] = (m >> 8) & 0xff
  header[3] = m & 0xff
  header[4] = (elapsedMs >> 24) & 0xff
  header[5] = (elapsedMs >> 16) & 0xff
  header[6] = (elapsedMs >> 8) & 0xff
  header[7] = elapsedMs & 0xff

  // Build index→mask lookup from sparse bitmask pairs
  const maskMap = new Map<number, number>()
  for (let i = 0; i < cellMasks.length; i += 2) {
    maskMap.set(cellMasks[i], cellMasks[i + 1])
  }

  // Pack 3 bits per cell into bytes
  const totalCells = w * h
  const cellBytes = new Uint8Array(Math.ceil((totalCells * 3) / 8))
  for (let i = 0; i < totalCells; i++) {
    const mask = maskMap.get(i) || 0
    const base = i * 3
    for (let b = 0; b < 3; b++) {
      if (mask & (1 << b)) {
        const bitPos = base + b
        cellBytes[bitPos >> 3] |= 1 << (bitPos & 7)
      }
    }
  }

  function bytesToBase64Url(bytes: Uint8Array) {
    let bin = ''
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i])
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  return `v1:${bytesToBase64Url(header)}.${bytesToBase64Url(cellBytes)}`
}

export function decodeShareData(data: string): ModelProps {
  if (!data.startsWith('v1:')) {
    throw new Error('Unsupported share format')
  }
  const body = data.slice(3)
  const dotIndex = body.indexOf('.')
  if (dotIndex === -1) {
    throw new Error('Invalid share format')
  }

  const header = base64UrlToBytes(body.slice(0, dotIndex))
  const w = header[0]
  const h = header[1]
  const m = (header[2] << 8) | header[3]
  const elapsedMs =
    ((header[4] << 24) | (header[5] << 16) | (header[6] << 8) | header[7]) >>> 0

  const cellBytes = base64UrlToBytes(body.slice(dotIndex + 1))
  const cellMasks: number[] = []
  const totalCells = w * h
  for (let i = 0; i < totalCells; i++) {
    let mask = 0
    const base = i * 3
    for (let b = 0; b < 3; b++) {
      const bitPos = base + b
      if (cellBytes[bitPos >> 3] & (1 << (bitPos & 7))) {
        mask |= 1 << b
      }
    }
    if (mask > 0) {
      cellMasks.push(i, mask)
    }
  }

  function base64UrlToBytes(str: string) {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
    const pad = (4 - (b64.length % 4)) % 4
    const raw = atob(b64 + '='.repeat(pad))
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i)
    }
    return bytes
  }

  return { w, h, m, elapsedMs, cellMasks }
}

export function isTouchDevice() {
  if (typeof window === 'undefined') return false

  const mediaQuery = '(hover: none) and (pointer: coarse)'
  return window.matchMedia(mediaQuery).matches
}
