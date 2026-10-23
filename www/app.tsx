import { Suspense, useEffect, useState } from 'react'

import { cn } from 'cn'
import { Lucide } from '@shared/components/icons'
import { buttonVariants } from '@shared/components/ui/button'

import { demos } from './demos'

const random = (() => {
  let seed = 20261023
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
})()

const sketchLines = Array.from({ length: 72 }, () => {
  const [x, y] = [random() * 1200, random() * 1600]
  const angle = (random() - 0.5) * 0.9
  const length = 80 + random() ** 1.6 * 680
  const [x2, y2] = [x + Math.cos(angle) * length, y + Math.sin(angle) * length]
  const bow = (random() - 0.5) * 20
  const [cx, cy] = [
    (x + x2) / 2 - Math.sin(angle) * bow,
    (y + y2) / 2 + Math.cos(angle) * bow,
  ]
  return {
    d: `M${x} ${y}Q${cx} ${cy} ${x2} ${y2}`,
    strokeWidth: 0.6 + random() * 1.2,
    opacity: 0.1 + random() * 0.3,
    offset: [(random() - 0.5) * 3, (random() - 0.5) * 3],
  }
})

export default function App() {
  const [routeId, setRouteId] = useState(() => location.hash.slice(2))

  useEffect(() => {
    const handleHashChange = () => setRouteId(location.hash.slice(2))
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const demo = demos.find(d => d.id === routeId)

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 py-12 sm:px-8 sm:py-16">
      <svg
        aria-hidden
        viewBox="0 0 1200 1600"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none fixed inset-0 -z-10 size-full text-border mask-[radial-gradient(ellipse_at_50%_-10%,black_38%,transparent_78%)]"
      >
        {sketchLines.map(({ d, strokeWidth, opacity, offset }, index) => (
          <g key={index}>
            <path
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={opacity}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={d}
              transform={`translate(${offset[0]} ${offset[1]})`}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth * 0.7}
              strokeLinecap="round"
              opacity={opacity * 0.45}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>

      <header className="flex flex-col gap-3">
        <span className="flex items-center gap-2 text-xs font-medium tracking-[0.28em] text-muted-foreground uppercase">
          <span className="size-1.5 rounded-full bg-foreground" />
          n-puzzles
        </span>
        <h1 className="font-heading text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
          {demo ? demo.title : '益智小游戏合集'}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {demo ? demo.description : '随手可玩的逻辑谜题与模拟演示'}
        </p>
      </header>

      {demo ? (
        <section className="flex flex-1 flex-col gap-6 pt-8">
          <Suspense
            fallback={<p className="text-sm text-muted-foreground">加载中…</p>}
          >
            <demo.component />
          </Suspense>
        </section>
      ) : (
        <nav className="mt-10 flex flex-col sm:mt-12">
          {demos.map(({ id, title, description }, index) => (
            <a
              key={id}
              href={`#/${id}`}
              style={{ animationDelay: `${120 + index * 45}ms` }}
              className="group animate-rise -mx-3 flex items-center gap-4 border-t border-border px-3 py-5 outline-none transition-colors last:border-b hover:bg-muted/60 focus-visible:bg-muted/60 motion-reduce:animate-none sm:gap-6 sm:py-6"
            >
              <span className="w-6 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground transition-colors group-hover:text-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-heading text-base font-medium tracking-tight sm:text-lg">
                  {title}
                </span>
                <span className="text-sm text-muted-foreground">
                  {description}
                </span>
              </span>
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground transition-all duration-300 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background sm:size-8"
              >
                ↗
              </span>
            </a>
          ))}
        </nav>
      )}

      <footer className="mt-10 flex items-center justify-between border-t border-border pt-6 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {demo ? (
          <a
            href="#/"
            aria-label="返回主页"
            title="返回主页"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              '-ml-2',
            )}
          >
            <Lucide.House className="size-5" />
          </a>
        ) : (
          <span>共 {demos.length} 个演示</span>
        )}
        <span>n-puzzles</span>
      </footer>
    </main>
  )
}
