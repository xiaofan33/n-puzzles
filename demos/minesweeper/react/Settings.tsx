import { useState } from 'react'
import { Lucide } from '@shared/components/icons'
import { Shadcn } from '@shared/components/ui'
import {
  findPreset,
  randomPalette,
  presetList,
  limits,
  type Palette,
} from '../config'
import { isTouchDevice } from '../utils'
import type { BoardConfig } from '../model'

const CUSTOM_ITEM = { id: 'custom', label: '自定义' }

export function SelectDifficulty(props: {
  boardConfig: BoardConfig
  onChange: (value: BoardConfig) => void
  onSelectCustom?: () => void
}) {
  const { boardConfig, onChange, onSelectCustom } = props

  const currentItem = findPreset(boardConfig) || CUSTOM_ITEM

  function handleSelectChange(id: string | null) {
    if (!id) return

    if (id === 'custom') {
      onSelectCustom?.()
      return
    }

    if (id === currentItem.id) return

    const preset = findPreset(id)
    if (!preset) return

    onChange({ ...preset.boardConfig })
  }

  return (
    <Shadcn.Select value={currentItem.id} onValueChange={handleSelectChange}>
      <Shadcn.SelectTrigger className="w-24">
        {currentItem.label}
      </Shadcn.SelectTrigger>
      <Shadcn.SelectContent>
        <Shadcn.SelectGroup>
          {presetList.map(item => (
            <Shadcn.SelectItem key={item.id} value={item.id} className="h-8">
              <span className="w-10">{item.label}</span>
              <span className="text-muted-foreground font-mono tracking-wider">
                {item.boardConfig.w}x{item.boardConfig.h}
              </span>
            </Shadcn.SelectItem>
          ))}
          {props.onSelectCustom && (
            <Shadcn.SelectItem value={CUSTOM_ITEM.id} className="h-8">
              <span className="w-10">{CUSTOM_ITEM.label}</span>
              {currentItem.id === 'custom' && (
                <span className="text-muted-foreground font-mono tracking-wider">
                  {boardConfig.w}x{boardConfig.h}
                </span>
              )}
            </Shadcn.SelectItem>
          )}
        </Shadcn.SelectGroup>
      </Shadcn.SelectContent>
    </Shadcn.Select>
  )
}

export function ToggleFlagMode(props: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  if (!isTouchDevice()) return

  return (
    <Shadcn.Field orientation="horizontal">
      <Shadcn.Checkbox
        id="flag-mode"
        className="border-foreground/20"
        checked={props.checked}
        onCheckedChange={v => props.onChange(v)}
      />
      <Shadcn.Label htmlFor="flag-mode" className="py-2">
        插旗优先
      </Shadcn.Label>
    </Shadcn.Field>
  )
}

export function SwitchPalette(props: {
  palette: Palette
  onChange: (v: Palette) => void
}) {
  return (
    <Shadcn.Button
      variant="outline"
      size="icon-lg"
      style={{ color: 'var(--accent-deep)' }}
      onClick={() => props.onChange(randomPalette(props.palette))}
    >
      <Lucide.Paintbrush />
    </Shadcn.Button>
  )
}

const CELL_SIZE_ITEMS = Array.from(
  { length: limits.size.max - limits.size.min + 1 },
  (_, i) => i + limits.size.min,
)

export function SelectCellSize(props: {
  size: number
  onChange: (v: number) => void
}) {
  const [open, setOpen] = useState(false)

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (value) {
      requestAnimationFrame(() => {
        const popup = document.querySelector<HTMLElement>(
          '[data-slot="dropdown-menu-content"]',
        )
        const checked = popup?.querySelector<HTMLElement>('[data-checked]')
        if (checked) {
          checked.scrollIntoView({ block: 'nearest' })
        }
      })
    }
  }

  return (
    <Shadcn.DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <Shadcn.DropdownMenuTrigger
        render={
          <Shadcn.Button size="icon-lg" variant="outline">
            <Lucide.Ruler />
          </Shadcn.Button>
        }
      />
      <Shadcn.DropdownMenuContent className="max-h-48 min-w-20">
        <Shadcn.DropdownMenuRadioGroup
          value={String(props.size)}
          onValueChange={v => {
            if (v) {
              props.onChange(Number(v))
              setOpen(false)
            }
          }}
        >
          {CELL_SIZE_ITEMS.map(item => (
            <Shadcn.DropdownMenuRadioItem
              key={item}
              value={String(item)}
              className="font-mono"
            >
              {item}
            </Shadcn.DropdownMenuRadioItem>
          ))}
        </Shadcn.DropdownMenuRadioGroup>
      </Shadcn.DropdownMenuContent>
    </Shadcn.DropdownMenu>
  )
}
