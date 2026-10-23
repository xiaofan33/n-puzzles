import { lazy, type ComponentType } from 'react'

import { demoMetas } from './demos-meta'
import type { DemoMeta } from '@shared/utils/types'

export type Demo = DemoMeta & {
  id: string
  component: ComponentType
}

// 约定每个演示入口为 demos/<id>/react/index.tsx，展示信息见 demos-meta.ts
const pages = import.meta.glob<{ default: ComponentType }>(
  '/demos/*/react/index.tsx',
)

const idOf = (path: string) => path.split('/')[2]

export const demos: Demo[] = Object.entries(pages)
  .map(([path, load]) => {
    const id = idOf(path)
    const meta = demoMetas[id]
    if (!meta) {
      throw new Error(`演示缺少展示信息：${id}（www/demos-meta.ts）`)
    }
    return { id, ...meta, component: lazy(load) }
  })
  .sort((a, b) => a.id.localeCompare(b.id))
