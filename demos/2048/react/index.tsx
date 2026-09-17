import { useEffect, useLayoutEffect } from 'react'
import { Lucide } from '@shared/components/icons'
import { Shadcn } from '@shared/components/ui'
import { useLocalStorage, usePrevious } from '@shared/hooks'
import { presetList, type Preset } from '../config'
import { useModel } from './use'
import { Board } from './Board'
import styles from '../assets/main.module.css'

function presetLabel({ boardSize }: Preset) {
  return `${boardSize.w}x${boardSize.h}`
}

const presetLabels = presetList.map(presetLabel)

function RollingNumber({ value }: { value: number }) {
  const prevValue = usePrevious(value)

  if (prevValue === null || prevValue === value) {
    return (
      <span className="inline-block h-[1em] font-bold leading-none tabular-nums">
        {value}
      </span>
    )
  }

  const increasing = value > prevValue
  const rows = increasing ? [prevValue, value] : [value, prevValue]

  return (
    <span className="inline-block h-[1em] overflow-hidden font-bold leading-none tabular-nums">
      <span
        key={value}
        className="flex flex-col"
        style={{
          animation: `${styles['score-roll']} 0.3s ease-out forwards`,
          animationDirection: increasing ? 'normal' : 'reverse',
        }}
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
  const [presetIndex, setPresetIndex] = useLocalStorage('game-2048-preset', 0)
  const currentPreset = presetList[presetIndex]

  const model = useModel()
  const { score, tiles, gg } = model.state

  const [bestScore, setBestScore] = useLocalStorage(
    `game-2048-best-${presetLabels[presetIndex]}`,
    0,
  )
  const isNewRecord = score >= bestScore && bestScore > 0
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
    }
  }, [score])

  useLayoutEffect(() => {
    handleNewGame()
  }, [])

  function handleNewGame() {
    model.restore(currentPreset)
  }

  function handlePresetChange(index: number | null) {
    if (index === null || index === presetIndex) return

    setPresetIndex(index)
    model.restore(presetList[index])
  }

  return (
    <div className="select-none">
      <div className="mx-auto flex h-dvh w-fit flex-col gap-4 p-4">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center justify-between gap-3 rounded-lg bg-muted px-3 py-1.5">
            <div className="text-xs text-muted-foreground uppercase">Score</div>
            <RollingNumber value={score} />
          </div>
          <div className="flex flex-1 items-center justify-between gap-3 rounded-lg bg-muted px-3 py-1.5">
            <div className="text-xs text-muted-foreground uppercase">
              {isNewRecord ? 'New Record' : 'Best'}
            </div>
            <div className="font-bold tabular-nums">{bestScore}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Shadcn.Select value={presetIndex} onValueChange={handlePresetChange}>
            <Shadcn.SelectTrigger className="w-24">
              {presetLabels[presetIndex]}
            </Shadcn.SelectTrigger>
            <Shadcn.SelectContent>
              <Shadcn.SelectGroup>
                {presetLabels.map((label, i) => (
                  <Shadcn.SelectItem key={i} value={i}>
                    {label}
                  </Shadcn.SelectItem>
                ))}
              </Shadcn.SelectGroup>
            </Shadcn.SelectContent>
          </Shadcn.Select>
          <Shadcn.Button onClick={handleNewGame}>New Game</Shadcn.Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-24 sm:pb-32">
          <div className="relative">
            <Board
              boardSize={currentPreset.boardSize}
              tiles={tiles}
              onMove={model.move}
            />
            {gg ? (
              <>
                <h2
                  className="absolute inset-x-0 bottom-full mb-8 text-center text-3xl font-bold tracking-tight text-foreground"
                  style={{
                    animation: `${styles['gg-title-in']} 0.4s ease-out 0.5s backwards`,
                  }}
                >
                  GAME OVER
                </h2>
                <div
                  className="absolute inset-x-0 top-full mt-8 flex flex-col items-stretch gap-3"
                  style={{
                    animation: `${styles['gg-buttons-in']} 0.4s ease-out 0.5s backwards`,
                  }}
                >
                  <Shadcn.Button onClick={handleNewGame}>
                    Play Again
                  </Shadcn.Button>
                  <Shadcn.Button
                    variant="outline"
                    disabled={!model.canUndo()}
                    onClick={model.undo}
                  >
                    Undo
                  </Shadcn.Button>
                </div>
              </>
            ) : (
              <Shadcn.Button
                variant="ghost"
                className="absolute inset-x-0 top-full mt-8 mx-auto size-12"
                disabled={!model.canUndo()}
                onClick={model.undo}
              >
                <Lucide.Undo2 />
              </Shadcn.Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
