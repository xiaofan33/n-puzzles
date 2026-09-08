declare global {
  type GridSize = { w: number; h: number }
  type Position = { x: number; y: number }
  type Direction = 'up' | 'down' | 'left' | 'right'
  type Orientation = 'horizontal' | 'vertical'
}

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}

export {}
