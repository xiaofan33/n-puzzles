import { useEffect, useLayoutEffect, useState } from 'react'
import { Lucide } from '@shared/components/icons'
import { Shadcn } from '@shared/components/ui'
import { useLocalStorage } from '@shared/hooks'
import {
  clearShareParam,
  decodeShareData,
  formatTime,
  readShareParam,
} from '../utils'
import { GLYPHS, DEFAULT_SETTINGS, type Settings } from '../preset'
import { celebrateWin } from '../confetti'
import type { GamePhase, GameProps } from '../model'
import { useModel } from './use'
import { Share, type ShareData } from './share'
import { CellContainer } from './cell-container'
import { CustomDialog } from './custom'
import {
  SelectCellSize,
  SelectDifficulty,
  SwitchPalette,
  ToggleFlagMode,
} from './settings'

function Hud({
  phase,
  flagCount,
  totalMine,
  getElapsedSeconds,
  onNewGame,
}: {
  phase: GamePhase
  flagCount: number
  totalMine: number
  getElapsedSeconds: () => number
  onNewGame: () => void
}) {
  const [seconds, setSeconds] = useState(getElapsedSeconds)

  useEffect(() => {
    setSeconds(getElapsedSeconds())
    if (phase !== 'playing') return

    const intervalId = setInterval(() => setSeconds(getElapsedSeconds()), 1000)
    return () => clearInterval(intervalId)
  }, [phase, getElapsedSeconds])

  return (
    <div className="flex items-center justify-between">
      <div className="flex w-24 items-center justify-center gap-2 p-1 font-mono">
        {GLYPHS['flag']}
        <div className="flex items-center gap-1">
          <span className="font-bold text-red-600">
            {phase === 'ready' ? '-' : flagCount}
          </span>
          <span>/</span>
          <span>{totalMine}</span>
        </div>
      </div>
      <Shadcn.Button
        variant="ghost"
        className="size-12 text-xl"
        aria-label="新游戏"
        onClick={() => onNewGame()}
      >
        {GLYPHS[phase]}
      </Shadcn.Button>
      <div className="flex w-24 items-center justify-center gap-2 p-1 font-mono">
        {GLYPHS['timer']}
        <div className="font-bold tracking-wider text-red-600">
          {phase === 'ready' ? '--:--' : formatTime(seconds)}
        </div>
      </div>
    </div>
  )
}

const SETTINGS_KEY = 'minesweeper:settings'

export default function () {
  const [customDialogOpen, setCustomDialogOpen] = useState(false)

  // Capture the snapshot before any effect can strip it from the URL. StrictMode
  // runs the restore effect twice in development; if it re-read the route hash,
  // the second run would see no share param and overwrite the restored game.
  const [shared] = useState(readShareParam)

  const [settings, setSettings] = useLocalStorage(
    SETTINGS_KEY,
    DEFAULT_SETTINGS,
  )
  const model = useModel()
  const { w, h, m, phase, flagCount, cells, getElapsedSeconds } = model
  const isReady = phase === 'ready'

  // Restore a shared game from the route hash once, then drop the parameter
  // so a reload does not replay the same snapshot.
  useLayoutEffect(() => {
    if (shared) {
      try {
        const data = decodeShareData(shared)
        model.restore(data)
        setSettings(prev => ({
          ...prev,
          boardConfig: { w: data.w, h: data.h, m: data.m },
        }))
        return
      } catch (error) {
        console.warn('minesweeper: failed to restore shared game', error)
      } finally {
        clearShareParam()
      }
    }
    handleNewGame()
  }, [])

  useEffect(() => {
    if (phase === 'won') celebrateWin()
  }, [phase])

  function handleNewGame(data?: GameProps) {
    model.restore(data || settings.boardConfig)
  }

  function handleSettingsChange(patch: Partial<Settings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    if (patch.boardConfig) {
      handleNewGame(patch.boardConfig)
    }
  }

  function getSnapshot(): ShareData {
    return {
      w,
      h,
      m,
      f: flagCount,
      cellMasks: model.getCellMasks(),
      elapsedMs: model.elapsedMs,
    }
  }

  return (
    <>
      <div className="flex justify-center select-none">
        <div className="w-fit max-w-full space-y-3 p-4">
          <div className="flex items-center justify-between">
            <SelectDifficulty
              board={settings.boardConfig}
              onChange={v => handleSettingsChange({ boardConfig: v })}
              onSelectCustom={() => setCustomDialogOpen(true)}
            />
            <Shadcn.ButtonGroup>
              <SelectCellSize
                size={settings.size}
                onChange={v => handleSettingsChange({ size: v })}
              />
              <SwitchPalette
                palette={settings.palette}
                onChange={v => handleSettingsChange({ palette: v })}
              />
            </Shadcn.ButtonGroup>
          </div>
          <Hud
            phase={phase}
            flagCount={flagCount}
            totalMine={m}
            getElapsedSeconds={getElapsedSeconds}
            onNewGame={handleNewGame}
          />
          <CellContainer
            isReady={isReady}
            settings={settings}
            cells={cells}
            getAdjacentCells={model.getAdjacentCells}
            onOperate={model.operate}
          />
          {phase === 'playing' && (
            <>
              <div className="flex items-center justify-end">
                <ToggleFlagMode
                  checked={settings.clickToFlag}
                  onChange={b => handleSettingsChange({ clickToFlag: b })}
                />
                <Share onSnapshot={getSnapshot} />
              </div>
            </>
          )}
          {phase === 'lost' && (
            <>
              <div className="flex items-center justify-center">
                <Shadcn.Button variant="ghost" onClick={model.restart}>
                  <Lucide.Repeat1 />
                  重玩
                </Shadcn.Button>
              </div>
            </>
          )}
        </div>
      </div>
      <CustomDialog
        isOpen={customDialogOpen}
        defaultValue={settings}
        onOpenChange={setCustomDialogOpen}
        onConfirm={handleSettingsChange}
      />
    </>
  )
}
