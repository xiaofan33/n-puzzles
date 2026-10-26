import { useEffect, useRef, useState } from 'react'
import { Lucide } from '@shared/components/icons'
import { Shadcn } from '@shared/components/ui'
import { buildShareUrl, copyText, formatDuration } from '../utils'
import type { GameProps } from '../model'

export interface ShareData extends GameProps {
  f: number /**number of flags */
}

type CopyState = 'idle' | 'copied' | 'failed'

const ITEMS = [
  {
    icon: Lucide.Grid2X2,
    text: '宽ｘ高',
    getValue: (d: ShareData) => `${d.w} x ${d.h}`,
  },
  {
    icon: Lucide.Bomb,
    text: '雷密度',
    getValue: (d: ShareData) => `${((d.m / (d.w * d.h)) * 100).toFixed(2)}%`,
  },
  {
    icon: Lucide.Flag,
    text: '已插旗',
    getValue: (d: ShareData) => `${d.f} / ${d.m}`,
  },
  {
    icon: Lucide.Timer,
    text: '已用时',
    getValue: (d: ShareData) =>
      d.elapsedMs !== undefined
        ? formatDuration(Math.floor(d.elapsedMs / 1000))
        : 'N/A',
  },
]

export function Share({ onSnapshot }: { onSnapshot: () => ShareData }) {
  const [data, setData] = useState<ShareData | null>(null)
  const [open, setOpen] = useState(false)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const timerRef = useRef<number | null>(null)

  function clearCopyTimer() {
    if (timerRef.current === null) return
    clearTimeout(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => clearCopyTimer, [])

  function handleOpenChange(next: boolean) {
    if (next) {
      setData(onSnapshot())
    } else {
      clearCopyTimer()
      setCopyState('idle')
    }
    setOpen(next)
  }

  async function handleCopy() {
    if (!data) return

    const succeeded = await copyText(buildShareUrl(data))

    setCopyState(succeeded ? 'copied' : 'failed')
    if (!succeeded) return

    clearCopyTimer()
    timerRef.current = setTimeout(() => {
      setCopyState('idle')
      timerRef.current = null
    }, 2000)
  }

  function handleLink() {
    if (!data) return
    window.open(buildShareUrl(data), '_blank', 'noopener')
  }

  return (
    <Shadcn.Popover open={open} onOpenChange={handleOpenChange}>
      <Shadcn.PopoverTrigger
        render={
          <Shadcn.Button variant="ghost" size="icon-lg" aria-label="分享" />
        }
      >
        <Lucide.Share2 />
      </Shadcn.PopoverTrigger>
      <Shadcn.PopoverContent>
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">
            已生成当前局面的分享链接
          </div>
          <Shadcn.Separator />
          <div className="mb-2 space-y-2">
            {ITEMS.map(item => (
              <div key={item.text} className="flex items-center gap-2">
                <item.icon className="size-5" />
                <span className="text-muted-foreground w-28 text-sm">
                  {item.text}
                </span>
                <span className="mr-auto font-mono text-sm tracking-wider">
                  {data && item.getValue(data)}
                </span>
              </div>
            ))}
          </div>
          <Shadcn.Button variant="default" onClick={handleCopy}>
            {copyState === 'copied' ? (
              <>
                <Lucide.Check />
                已复制
              </>
            ) : copyState === 'failed' ? (
              '复制失败'
            ) : (
              <>
                <Lucide.Copy />
                复制链接
              </>
            )}
          </Shadcn.Button>
          <Shadcn.Button variant="outline" onClick={handleLink}>
            <Lucide.Link />
            在新标签打开
          </Shadcn.Button>
        </div>
      </Shadcn.PopoverContent>
    </Shadcn.Popover>
  )
}
