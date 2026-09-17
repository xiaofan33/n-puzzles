import { useRef } from 'react'
import { cn } from 'cn'
import { useMoveControls, usePrevious } from '@shared/hooks'
import { useFlip } from './use'
import type { TileState } from '../model'
import styles from '../assets/main.module.css'

function TileInner(props: { value: number; className?: string }) {
  return (
    <div
      data-value={props.value}
      className={cn(
        styles['tile'],
        'absolute inset-0 flex items-center justify-center rounded-md',
        props.className,
      )}
    >
      {props.value}
    </div>
  )
}

function Tile(props: TileState) {
  const { value, isInitial } = props

  const prevValue = usePrevious(value)
  const isMerged = prevValue !== null && value > prevValue

  const flipRef = useRef<HTMLDivElement | null>(null)
  useFlip(flipRef, props)

  return (
    <div
      ref={flipRef}
      className="absolute size-(--tile-size) transition-transform ease-in-out duration-(--duration-slide)"
    >
      {isMerged ? (
        <>
          <TileInner
            key={prevValue}
            value={prevValue}
            className={styles['tile-exit']}
          />
          <TileInner
            key={value}
            value={value}
            className={styles['tile-merge']}
          />
        </>
      ) : (
        <TileInner
          key={value}
          value={value}
          className={cn(
            styles['tile-spawn'],
            isInitial && styles['tile-spawn-now'],
          )}
        />
      )}
    </div>
  )
}

export function Board(props: {
  boardSize: { w: number; h: number }
  tiles: TileState[]
  onMove: (d: Direction) => void
}) {
  const { w, h } = props.boardSize
  const boardRef = useRef<HTMLDivElement | null>(null)
  useMoveControls(boardRef, { onMove: props.onMove })

  return (
    <div
      ref={boardRef}
      data-tile-theme="classic"
      style={{ '--col': w }}
      className={cn(
        styles['board-2048'],
        'relative w-fit touch-none rounded-xl bg-(--color-board) p-(--tile-gap) font-bold select-none',
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
        {props.tiles.map(t => (
          <Tile key={t.id} {...t} />
        ))}
      </div>
    </div>
  )
}
