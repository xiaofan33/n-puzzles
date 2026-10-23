import type { DemoMeta } from '@shared/utils/types'

// 所有演示的展示信息，键为 demos/<id> 目录名
export const demoMetas: Record<string, DemoMeta> = {
  '2048': {
    title: '2048',
    description: '滑动方块，合成更大的数字',
  },
  'eight-queens': {
    title: '八皇后',
    description: '摆放八个皇后，任意两个互不攻击',
  },
  'game-of-life': {
    title: '生命游戏',
    description: '康威生命游戏，观察细胞演化',
  },
  'huarong-dao': {
    title: '华容道',
    description: '移动滑块，还原棋盘',
  },
  'lights-out': {
    title: '关灯',
    description: '点击方格，熄灭全部灯光',
  },
  minesweeper: {
    title: '扫雷',
    description: '翻开格子，标记所有地雷',
  },
  'sliding-puzzle': {
    title: '数字华容道',
    description: '移动方块，还原顺序',
  },
}
