import { useRef, useState } from 'react'
import { Lucide } from '@shared/components/icons'
import { Shadcn } from '@shared/components/ui'
import { encodeShareData, formatDuration } from '../utils'
import type { ModelProps } from '../model'

export interface ShareData extends ModelProps {
  f: number /** number of flags */
}

const ITEMS = [
  {
    icon: <Lucide.Grid2X2 className="size-5" />,
    text: '宽高',
    getValue: (d: ShareData) => `${d.w} x ${d.h}`,
  },
  {
    icon: <Lucide.Bomb className="size-5" />,
    text: '雷密度',
    getValue: (d: ShareData) => `${((d.m / (d.w * d.h)) * 100).toFixed(2)}%`,
  },
  {
    icon: <Lucide.Flag className="size-5" />,
    text: '已插旗',
    getValue: (d: ShareData) => `${d.f} : ${d.m}`,
  },
  {
    icon: <Lucide.Timer className="size-5" />,
    text: '已用时',
    getValue: (d: ShareData) =>
      d.elapsedMs ? formatDuration(Math.floor(d.elapsedMs / 1000)) : 'N/A',
  },
]

export function Share({ onSnapshot }: { onSnapshot: () => ShareData }) {
  const [data, setData] = useState<ShareData | null>(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const timerRef = useRef<number | null>(null)

  function handleShare() {
    setData(onSnapshot())
    setOpen(true)
  }

  async function handleCopy() {
    const url = buildShareUrl()
    if (!url) return

    try {
      await navigator.clipboard.writeText(url.href)
    } catch {
      return
    }

    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setCopied(false)
      setOpen(false)
    }, 1000)
  }

  function handleLink() {
    const url = buildShareUrl()
    if (!url) return

    window.open(url, '_blank')
  }

  function buildShareUrl() {
    if (!data) return null

    const url = new URL(location.href)
    url.hash = encodeShareData(data)
    return url
  }

  return (
    <Shadcn.Popover open={open} onOpenChange={setOpen}>
      <Shadcn.PopoverTrigger
        render={
          <Shadcn.Button variant="ghost" size="icon-lg" onClick={handleShare} />
        }
      >
        <Lucide.Share2 />
      </Shadcn.PopoverTrigger>
      <Shadcn.PopoverContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">
            已生成当前局面的分享链接
          </div>
          <Shadcn.Separator />
          <div className="mb-2 space-y-2">
            {ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                {item.icon}
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
            {copied ? (
              <>
                <Lucide.Check />
                已复制
              </>
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
