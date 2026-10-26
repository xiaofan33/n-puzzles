import { useEffect, useLayoutEffect } from 'react'
import { cn } from 'cn'
import { Lucide } from '@shared/components/icons'
import { Shadcn } from '@shared/components/ui'
import { useLocalStorage, usePrevious } from '@shared/hooks'
import { PRESET_LIST, type Preset } from '../preset'
import { useModel } from './use'
import { TileContainer } from './tile-container'
import styles from '../assets/main.module.css'

function toPresetLabel({ boardSize }: Preset) {
  return `${boardSize.w}x${boardSize.h}`
}

const presetLabels = PRESET_LIST.map(toPresetLabel)

function RollingNumber({ value }: { value: number }) {
  const previous = usePrevious(value)

  if (previous === null || previous === value) {
    return (
      <span className="inline-block h-[1em] font-bold leading-none tabular-nums">
        {value}
      </span>
    )
  }

  const increasing = value > previous
  const rows = increasing ? [previous, value] : [value, previous]

  return (
    <span className="inline-block h-[1em] overflow-hidden font-bold leading-none tabular-nums">
      <span
        key={value}
        className={cn(
          'flex flex-col',
          increasing ? styles['score-roll'] : styles['score-roll-reverse'],
        )}
      >
        {rows.map((n, i) => (
          <span
            key={i}
            className="h-[1em] whitespace-nowrap text-right leading-none"
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  )
}

export default function () {
  const model = useModel()
  const { score, tiles, isEnded } = model.state

  const [presetIndex, setPresetIndex] = useLocalStorage(
    'game-2048:preset',
    0,
    (stored, fallback) =>
      typeof stored === 'number' &&
      Number.isInteger(stored) &&
      stored >= 0 &&
      stored < PRESET_LIST.length
        ? stored
        : fallback,
  )
  const preset = PRESET_LIST[presetIndex]

  const [bestScore, setBestScore] = useLocalStorage(
    `game-2048:${presetLabels[presetIndex]}-best`,
    0,
    (stored, fallback) =>
      typeof stored === 'number' && Number.isInteger(stored) && stored >= 0
        ? stored
        : fallback,
  )

  const isNewRecord = score >= bestScore && bestScore > 0
  useEffect(() => {
    if (score > bestScore) setBestScore(score)
  }, [score, bestScore, setBestScore])

  useLayoutEffect(() => {
    handleNewGame()
  }, [])

  function handleNewGame() {
    model.init(preset)
  }

  function handlePresetChange(index: number | null) {
    if (index === null || index === presetIndex) return

    setPresetIndex(index)
    model.init(PRESET_LIST[index])
  }

  return (
    <div className="flex max-sm:justify-center overflow-x-clip">
      <div className="flex shrink-0 flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center justify-between gap-3 rounded-xl bg-muted px-3 py-1.5">
            <span className="text-xs tracking-[0.18em] text-muted-foreground">
              得分
            </span>
            <RollingNumber value={score} />
          </div>
          <div className="flex flex-1 items-center justify-between gap-3 rounded-xl bg-muted px-3 py-1.5">
            <span className="w-11 whitespace-nowrap text-xs tracking-[0.18em] text-muted-foreground">
              {isNewRecord ? '新纪录' : '最佳'}
            </span>
            <RollingNumber key={presetLabels[presetIndex]} value={bestScore} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Shadcn.Select value={presetIndex} onValueChange={handlePresetChange}>
            <Shadcn.SelectTrigger className="w-24 rounded-xl tracking-widest">
              {presetLabels[presetIndex]}
            </Shadcn.SelectTrigger>
            <Shadcn.SelectContent className="rounded-xl">
              <Shadcn.SelectGroup>
                {presetLabels.map((l, i) => (
                  <Shadcn.SelectItem
                    key={i}
                    value={i}
                    className="tracking-widest"
                  >
                    {l}
                  </Shadcn.SelectItem>
                ))}
              </Shadcn.SelectGroup>
            </Shadcn.SelectContent>
          </Shadcn.Select>
          <Shadcn.Button className="rounded-xl" onClick={handleNewGame}>
            新游戏
          </Shadcn.Button>
        </div>
        <div className="relative">
          <TileContainer
            {...preset.boardSize}
            tiles={tiles}
            onMove={model.move}
          />
          {isEnded && (
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-background/40 p-4 backdrop-blur-[3px]',
                styles['gameover-overlay'],
              )}
            >
              <h2
                className={cn(
                  'text-center text-3xl font-bold tracking-tight',
                  styles['gameover-title'],
                )}
              >
                GAME OVER
              </h2>
              <Shadcn.Button className="rounded-xl" onClick={handleNewGame}>
                再来一局
              </Shadcn.Button>
            </div>
          )}
        </div>
        <Shadcn.Button
          variant="ghost"
          disabled={!model.canUndo()}
          onClick={model.undo}
          aria-label="撤销"
          className="size-9 self-center rounded-xl"
        >
          <Lucide.Undo2 />
        </Shadcn.Button>
      </div>
    </div>
  )
}
