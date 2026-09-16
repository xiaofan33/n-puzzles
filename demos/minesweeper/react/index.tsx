import { useEffect, useLayoutEffect, useState } from 'react'
import { Lucide } from '@shared/components/icons'
import { Shadcn } from '@shared/components/ui'
import { useLocalStorage } from '@shared/hooks'
import { celebrateWin } from '../confetti'
import { defaultSettings, glyphs, type Settings } from '../config'
import { decodeShareData, formatTime } from '../utils'
import type { GamePhase, ModelProps } from '../model'
import { useModel } from './use'
import { Share, type ShareData } from './Share'
import {
  SelectCellSize,
  SelectDifficulty,
  SwitchPalette,
  ToggleFlagMode,
} from './Settings'
import { Board } from './Board'
import { CustomDialog } from './Custom'

function Hud(props: {
  phase: GamePhase
  flagCount: number
  totalMine: number
  getElapsedMs: () => number
  onNewGame: () => void
}) {
  const { phase } = props
  const toSeconds = () => Math.floor(props.getElapsedMs() / 1000)
  const [seconds, setSeconds] = useState(toSeconds)

  useEffect(() => {
    setSeconds(toSeconds)
    if (phase === 'playing') {
      const intervalId = setInterval(() => setSeconds(toSeconds), 1000)
      return () => clearInterval(intervalId)
    }
  }, [phase])

  return (
    <div className="flex items-center justify-between">
      <div className="flex w-24 items-center justify-center gap-2 p-1 font-mono">
        {glyphs['flag']}
        <div className="flex items-center gap-1">
          <span className="font-bold text-red-600">
            {phase === 'ready' ? '-' : props.flagCount}
          </span>
          <span>/</span>
          <span>{props.totalMine}</span>
        </div>
      </div>
      <Shadcn.Button
        variant="ghost"
        className="size-12 text-xl"
        onClick={() => props.onNewGame()}
      >
        {glyphs[phase]}
      </Shadcn.Button>
      <div className="flex w-24 items-center justify-center gap-2 p-1 font-mono">
        {glyphs['timer']}
        <div className="font-bold tracking-wider text-red-600">
          {phase === 'ready' ? '--:--' : formatTime(seconds)}
        </div>
      </div>
    </div>
  )
}

const SETTINGS_KEY = 'minesweeper-settings'

export default function () {
  const [customDialogOpen, setCustomDialogOpen] = useState(false)

  const [settings, setSettings] = useLocalStorage(SETTINGS_KEY, defaultSettings)
  const model = useModel()
  const { boardConfig, phase, flagCount, cells } = model
  const isReady = phase === 'ready'

  useLayoutEffect(() => {
    const hash = location.hash?.slice(1)
    if (hash) {
      try {
        const data = decodeShareData(hash)
        handleNewGame(data)
        return
      } catch {}
    }
    handleNewGame()
  }, [])

  useEffect(() => {
    if (phase === 'won') celebrateWin()
  }, [phase])

  function handleNewGame(data?: ModelProps) {
    model.restore(data || settings.boardConfig)
  }

  function handleSettingsChange(patch: Partial<Settings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    if (patch.boardConfig) {
      handleNewGame(patch.boardConfig)
    }
  }

  function snapshot(): ShareData {
    return {
      ...boardConfig,
      elapsedMs: model.getElapsedMs(),
      cellMasks: model.getCellMasks(),
      f: flagCount,
    }
  }

  return (
    <>
      <div className="flex min-h-svh justify-center select-none">
        <div className="w-fit max-w-full space-y-3 p-4">
          <div className="flex items-center justify-between">
            <SelectDifficulty
              boardConfig={settings.boardConfig}
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
            totalMine={boardConfig.m}
            getElapsedMs={model.getElapsedMs}
            onNewGame={handleNewGame}
          />
          <Board
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
                <Share onSnapshot={snapshot} />
              </div>
            </>
          )}
          {phase === 'lost' && (
            <>
              <div className="flex items-center justify-center">
                <Shadcn.Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={model.restart}
                >
                  <Lucide.Repeat1 />
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
