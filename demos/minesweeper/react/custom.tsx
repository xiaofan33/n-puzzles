import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Lucide } from '@shared/components/icons'
import { Shadcn } from '@shared/components/ui'
import {
  mineCountBounds,
  randomBoardConfig,
  SETTINGS_LIMITS,
  type Settings,
} from '../preset'

function SliderField(props: {
  label: string
  value: number
  displayValue?: number
  min: number
  max: number
  onChange: (v: number) => void
  step?: number
  suffix?: ReactNode
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
  const labelId = useId()

  return (
    <Shadcn.Field>
      <div className="flex items-center gap-2">
        <span id={labelId}>{label}</span>
        <span className="text-right tabular-nums">{displayValue ?? value}</span>
        {suffix}
      </div>
      <div className="flex items-center gap-3 select-none">
        <Shadcn.Slider
          aria-labelledby={labelId}
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={v => {
            const next = Array.isArray(v) ? v[0] : v
            if (typeof next === 'number') onChange(next)
          }}
        />
        <Shadcn.ButtonGroup>
          <Shadcn.Button
            aria-label={`${label}减一`}
            disabled={value <= min}
            variant="outline"
            size="sm"
            onClick={() => onChange(value - step)}
          >
            <Lucide.Minus />
          </Shadcn.Button>
          <Shadcn.Button
            aria-label={`${label}加一`}
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

  const lockDensityId = useId()
  const [boardConfig, setBoardConfig] = useState(defaultValue.boardConfig)
  const [lockDensity, setLockDensity] = useState(defaultValue.lockDensity)
  const [pinnedDensity, setPinnedDensity] = useState(0)

  // Seed the draft from the latest props only when the dialog opens, so a
  // settings change while it is open cannot discard unsaved edits.
  const draftSeededRef = useRef(false)
  useLayoutEffect(() => {
    if (!isOpen) {
      draftSeededRef.current = false
      return
    }
    if (draftSeededRef.current) return
    draftSeededRef.current = true

    const { w, h, m } = defaultValue.boardConfig
    setBoardConfig(defaultValue.boardConfig)
    setLockDensity(defaultValue.lockDensity)
    setPinnedDensity(defaultValue.lockDensity ? m / (w * h) : 0)
  }, [isOpen, defaultValue])

  const total = boardConfig.w * boardConfig.h
  const bounds = mineCountBounds(total)
  const minDensity = bounds.min / total
  const maxDensity = bounds.max / total
  const mineDensity = lockDensity ? pinnedDensity : boardConfig.m / total

  const mineSliderMin = lockDensity
    ? SETTINGS_LIMITS.density.min / 100
    : minDensity
  const mineSliderMax = lockDensity
    ? SETTINGS_LIMITS.density.max / 100
    : maxDensity
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

  function handleRandom() {
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
          <Shadcn.DialogDescription>
            调整棋盘宽高、雷数与密度
          </Shadcn.DialogDescription>
        </Shadcn.DialogHeader>
        <Shadcn.Separator />
        <Shadcn.FieldGroup className="gap-4">
          <SliderField
            label="宽"
            value={boardConfig.w}
            min={SETTINGS_LIMITS.w.min}
            max={SETTINGS_LIMITS.w.max}
            onChange={v => handleSizeChange('w', v)}
          />
          <SliderField
            label="高"
            value={boardConfig.h}
            min={SETTINGS_LIMITS.h.min}
            max={SETTINGS_LIMITS.h.max}
            onChange={v => handleSizeChange('h', v)}
          />
          <SliderField
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
              id={lockDensityId}
              checked={lockDensity}
              onCheckedChange={handleLockDensityChange}
            />
            <Shadcn.Label htmlFor={lockDensityId}>锁定密度</Shadcn.Label>
          </Shadcn.Field>
        </Shadcn.FieldGroup>
        <Shadcn.DialogFooter>
          <Shadcn.Button variant="outline" onClick={handleRandom}>
            手气不错
          </Shadcn.Button>
          <Shadcn.Button onClick={handleSubmit}>确定</Shadcn.Button>
        </Shadcn.DialogFooter>
      </Shadcn.DialogContent>
    </Shadcn.Dialog>
  )
}
