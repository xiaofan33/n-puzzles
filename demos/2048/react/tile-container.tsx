import { useRef, useState } from 'react'
import { cn } from 'cn'
import { useMoveResponse, usePrevious } from '@shared/hooks'
import { useFlip } from './use'
import type { TileState } from '../model'
import type { Direction, GridSize } from '@shared/utils'
import styles from '../assets/main.module.css'

function Tile({
  value,
  className,
  onAnimationEnd,
}: {
  value: number
  className?: string
  onAnimationEnd?: () => void
}) {
  return (
    <div
      data-value={value}
      className={cn(
        styles.tile,
        'flex items-center justify-center rounded-md',
        className,
      )}
      onAnimationEnd={onAnimationEnd}
    >
      {value}
    </div>
  )
}

function ExitingTile({ value }: { value: number }) {
  const [done, setDone] = useState(false)

  return done ? null : (
    <Tile
      value={value}
      className={styles['tile-exit']}
      onAnimationEnd={() => setDone(true)}
    />
  )
}

function TileSlot({ value, spawnedAtInit, ...pos }: TileState) {
  const previous = usePrevious(value)
  const isMerged = previous !== null && value > previous

  const flipRef = useRef<HTMLDivElement | null>(null)
  useFlip(flipRef, pos)

  return (
    <div
      ref={flipRef}
      className="absolute size-(--tile-size) transition-transform ease-in-out duration-(--duration-slide)"
    >
      {isMerged ? (
        <>
          <ExitingTile key={previous} value={previous} />
          <Tile key={value} value={value} className={styles['tile-merge']} />
        </>
      ) : (
        <Tile
          key={value}
          value={value}
          className={cn(styles['tile-spawn'], spawnedAtInit && 'delay-0')}
        />
      )}
    </div>
  )
}

export function TileContainer({
  w,
  h,
  tiles,
  onMove,
}: GridSize & {
  tiles: TileState[]
  onMove: (d: Direction) => void
}) {
  const boardRef = useRef<HTMLDivElement | null>(null)
  useMoveResponse(boardRef, { onMove })

  return (
    <div
      ref={boardRef}
      style={{ '--col': w }}
      className={cn(
        styles.board,
        'relative w-fit touch-none rounded-xl bg-(--color-board) p-(--tile-gap) select-none',
      )}
    >
      <div className="grid grid-cols-[repeat(var(--col),1fr)] gap-(--tile-gap)">
        {Array.from({ length: w * h }, (_, i) => (
          <div
            key={i}
            className="size-(--tile-size) rounded-md bg-(--color-blank)"
          />
        ))}
      </div>
      <div className="absolute inset-(--tile-gap)">
        {tiles.map(tile => (
          <TileSlot key={tile.id} {...tile} />
        ))}
      </div>
    </div>
  )
}
