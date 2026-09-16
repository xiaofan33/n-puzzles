import { useState } from 'react'
import { Lucide } from '@shared/components/icons'
import { Shadcn } from '@shared/components/ui'
import {
  limits,
  mineCountBounds,
  randomBoardConfig,
  type Settings,
} from '../config'

function FieldItem(props: {
  label: string
  value: number
  displayValue?: number
  min: number
  max: number
  onChange: (v: number) => void
  step?: number
  suffix?: React.ReactNode
}) {
  const {
    label,
    value,
    displayValue,
    min,
    max,
    onChange,
    step = 1,
    suffix,
  } = props

  return (
    <Shadcn.Field>
      <div className="flex items-center gap-2">
        <span className="">{label}</span>
        <span className="text-right tabular-nums">{displayValue ?? value}</span>
        {suffix}
      </div>
      <div className="flex items-center gap-3 select-none">
        <Shadcn.Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={v => onChange(Array.isArray(v) ? v[0] : v)}
        />
        <Shadcn.ButtonGroup>
          <Shadcn.Button
            disabled={value <= min}
            variant="outline"
            size="sm"
            onClick={() => onChange(value - step)}
          >
            <Lucide.Minus />
          </Shadcn.Button>
          <Shadcn.Button
            disabled={value >= max}
            variant="outline"
            size="sm"
            onClick={() => onChange(value + step)}
          >
            <Lucide.Plus />
          </Shadcn.Button>
        </Shadcn.ButtonGroup>
      </div>
    </Shadcn.Field>
  )
}

function clampMine(value: number, total: number) {
  const { min, max } = mineCountBounds(total)
  return Math.max(min, Math.min(max, value))
}

export function CustomDialog(props: {
  isOpen: boolean
  defaultValue: Settings
  onOpenChange: (v: boolean) => void
  onConfirm: (p: Partial<Settings>) => void
}) {
  const { isOpen, defaultValue, onOpenChange, onConfirm } = props

  const { w, h, m } = defaultValue.boardConfig
  const [pinnedDensity, setPinnedDensity] = useState(
    defaultValue.lockDensity ? m / (w * h) : 0,
  )

  const [boardConfig, setBoardConfig] = useState(defaultValue.boardConfig)
  const [lockDensity, setLockDensity] = useState(defaultValue.lockDensity)

  const total = boardConfig.w * boardConfig.h
  const bounds = mineCountBounds(total)
  const minDensity = bounds.min / total
  const maxDensity = bounds.max / total
  const mineDensity = lockDensity ? pinnedDensity : boardConfig.m / total

  const mineSliderMin = lockDensity ? limits.density.min / 100 : minDensity
  const mineSliderMax = lockDensity ? limits.density.max / 100 : maxDensity
  const mineSliderStep = lockDensity ? 0.001 : 1 / total

  function handleLockDensityChange(checked: boolean) {
    setLockDensity(checked)
    if (checked) setPinnedDensity(boardConfig.m / total)
  }

  function handleSizeChange(key: 'w' | 'h', value: number) {
    const next = { ...boardConfig, [key]: value }
    const nextTotal = next.w * next.h
    const density = lockDensity ? pinnedDensity : next.m / nextTotal
    const m = clampMine(Math.round(density * nextTotal), nextTotal)
    setBoardConfig({ ...next, m })
  }

  function handleMineChange(density: number) {
    const m = clampMine(Math.round(density * total), total)
    setBoardConfig({ ...boardConfig, m })
    if (lockDensity) setPinnedDensity(density)
  }

  function handleGoodLuck() {
    const next = randomBoardConfig()
    setBoardConfig(next)
    if (lockDensity) setPinnedDensity(next.m / (next.w * next.h))
  }

  function handleSubmit() {
    onConfirm({ boardConfig, lockDensity })
    onOpenChange(false)
  }

  return (
    <Shadcn.Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Shadcn.DialogContent className="max-w-xs">
        <Shadcn.DialogHeader>
          <Shadcn.DialogTitle>自定义</Shadcn.DialogTitle>
        </Shadcn.DialogHeader>
        <Shadcn.Separator />
        <Shadcn.FieldGroup className="gap-4">
          <FieldItem
            label="宽"
            value={boardConfig.w}
            min={limits.w.min}
            max={limits.w.max}
            onChange={v => handleSizeChange('w', v)}
          />
          <FieldItem
            label="高"
            value={boardConfig.h}
            min={limits.h.min}
            max={limits.h.max}
            onChange={v => handleSizeChange('h', v)}
          />
          <FieldItem
            label="雷"
            value={mineDensity}
            displayValue={boardConfig.m}
            min={mineSliderMin}
            max={mineSliderMax}
            onChange={handleMineChange}
            step={mineSliderStep}
            suffix={
              <span className="text-muted-foreground flex items-center gap-1 pl-1">
                {lockDensity && <Lucide.Lock className="size-4" />}
                <span>{(mineDensity * 100).toFixed(2)}%</span>
              </span>
            }
          />
          <Shadcn.Field orientation="horizontal">
            <Shadcn.Switch
              id="lock-density"
              checked={lockDensity}
              onCheckedChange={handleLockDensityChange}
            />
            <Shadcn.Label htmlFor="lock-density">锁定密度</Shadcn.Label>
          </Shadcn.Field>
        </Shadcn.FieldGroup>
        <Shadcn.DialogFooter>
          <Shadcn.Button variant="outline" onClick={handleGoodLuck}>
            手气不错
          </Shadcn.Button>
          <Shadcn.Button onClick={handleSubmit}>确定</Shadcn.Button>
        </Shadcn.DialogFooter>
      </Shadcn.DialogContent>
    </Shadcn.Dialog>
  )
}
