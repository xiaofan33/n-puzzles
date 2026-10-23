import type { GameProps } from './model'

/**
 * Format seconds into MM:SS.
 *
 * - fractional seconds are truncated
 * - non-finite input is treated as 0
 * - minutes are capped at 99 so the display never exceeds two digits
 */
export function formatTime(seconds: number) {
  const totalSeconds = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 0
  const minutes = Math.min(Math.floor(totalSeconds / 60), 99)
  const s = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Format seconds into a compact duration string.
 * Omits any unit whose value is zero (e.g. 3600 → "1h", 60 → "1m").
 *
 * - fractional seconds are truncated
 * - non-finite input is treated as 0
 */
export function formatDuration(seconds: number) {
  const totalSeconds = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 0
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
 *
 * `size` and `gap` are truncated toward zero.
 * @throws {RangeError} if `size` is not positive or `gap` is negative
 */
export function pickCell<T>(
  pos: { x: number; y: number },
  size: number,
  gap: number,
  grid: T[][],
) {
  const cellSize = Math.trunc(size)
  const cellGap = Math.trunc(gap)
  if (cellSize <= 0 || cellGap < 0) {
    throw new RangeError(
      `pickCell: size (${size}) must be positive and gap (${gap}) must not be negative`,
    )
  }

  const stride = cellSize + cellGap
  const col = Math.floor(pos.x / stride)
  const row = Math.floor(pos.y / stride)

  // position lands in the gap area between cells
  if (pos.x - col * stride >= cellSize || pos.y - row * stride >= cellSize) {
    return
  }

  // position lands outside the grid bounds
  if (
    row < 0 ||
    col < 0 ||
    row >= grid.length ||
    col >= (grid[0]?.length ?? 0)
  ) {
    return
  }

  return grid[row][col]
}

/**
 * Validates that `value` is an integer in [0, max].
 */
function assertUint(name: string, value: number, max: number) {
  if (!Number.isInteger(value) || value < 0 || value > max) {
    throw new RangeError(
      `encodeShareData: ${name} (${value}) must be an integer in [0, ${max}]`,
    )
  }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i])
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(str: string) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (b64.length % 4)) % 4
  let raw = ''
  try {
    raw = atob(b64 + '='.repeat(pad))
  } catch {
    throw new Error('decodeShareData: invalid base64url payload')
  }
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i)
  }
  return bytes
}

/**
 * Encodes a game snapshot into a compact, URL-safe share string.
 *
 * `elapsedMs` is truncated toward zero.
 * @throws {RangeError} if `w`/`h` exceed u8, `m` exceeds u16, `elapsedMs`
 * exceeds u32, or `cellMasks` contains an invalid index/mask pair
 */
export function encodeShareData(data: GameProps) {
  const { w, h, m, elapsedMs = 0, cellMasks = [] } = data

  assertUint('w', w, 0xff)
  assertUint('h', h, 0xff)
  assertUint('m', m, 0xffff)
  const elapsed = Math.trunc(elapsedMs)
  assertUint('elapsedMs', elapsed, 0xffffffff)

  // Header: w(u8) + h(u8) + m(u16BE) + elapsedMs(u32BE) = 8 bytes
  const header = new Uint8Array(8)
  header[0] = w
  header[1] = h
  header[2] = (m >> 8) & 0xff
  header[3] = m & 0xff
  header[4] = (elapsed >>> 24) & 0xff
  header[5] = (elapsed >>> 16) & 0xff
  header[6] = (elapsed >>> 8) & 0xff
  header[7] = elapsed & 0xff

  // Build index→mask lookup from sparse bitmask pairs
  const totalCells = w * h
  const maskMap = new Map<number, number>()
  for (let i = 0; i < cellMasks.length; i += 2) {
    const index = cellMasks[i]
    const mask = cellMasks[i + 1]
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= totalCells ||
      !Number.isInteger(mask) ||
      mask < 0 ||
      mask > 0b111
    ) {
      throw new RangeError(
        `encodeShareData: invalid cell mask pair (${index}, ${mask})`,
      )
    }
    maskMap.set(index, mask)
  }

  // Pack 3 bits per cell into bytes
  const cellBytes = new Uint8Array(Math.ceil((totalCells * 3) / 8))
  for (let i = 0; i < totalCells; i++) {
    const mask = maskMap.get(i) ?? 0
    const base = i * 3
    for (let b = 0; b < 3; b++) {
      if (mask & (1 << b)) {
        const bitPos = base + b
        cellBytes[bitPos >> 3] |= 1 << (bitPos & 7)
      }
    }
  }

  return `v1:${bytesToBase64Url(header)}.${bytesToBase64Url(cellBytes)}`
}

/**
 * Decodes a share string produced by `encodeShareData`.
 * @throws {Error} if the format, header or cell payload is invalid
 */
export function decodeShareData(data: string): GameProps {
  if (!data.startsWith('v1:')) {
    throw new Error('Unsupported share format')
  }
  const body = data.slice(3)
  const dotIndex = body.indexOf('.')
  if (dotIndex === -1) {
    throw new Error('Invalid share format')
  }

  const header = base64UrlToBytes(body.slice(0, dotIndex))
  if (header.length !== 8) {
    throw new Error('Invalid share header')
  }
  const w = header[0]
  const h = header[1]
  if (w === 0 || h === 0) {
    throw new Error(`Invalid share board size (${w}x${h})`)
  }
  const m = (header[2] << 8) | header[3]
  const elapsedMs =
    ((header[4] << 24) | (header[5] << 16) | (header[6] << 8) | header[7]) >>> 0

  const cellBytes = base64UrlToBytes(body.slice(dotIndex + 1))
  const totalCells = w * h
  if (cellBytes.length !== Math.ceil((totalCells * 3) / 8)) {
    throw new Error('Invalid share cell data')
  }
  const cellMasks: number[] = []
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

  return { w, h, m, elapsedMs, cellMasks }
}

let cachedIsTouch: boolean | undefined

/**
 * Detects a coarse-pointer (touch-first) primary input.
 * The result is cached and kept in sync with the media query.
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false

  if (cachedIsTouch === undefined) {
    const query = window.matchMedia('(hover: none) and (pointer: coarse)')
    cachedIsTouch = query.matches
    query.addEventListener('change', ({ matches }) => (cachedIsTouch = matches))
  }

  return cachedIsTouch
}
