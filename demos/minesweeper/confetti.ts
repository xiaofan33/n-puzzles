import confetti, { type Options } from 'canvas-confetti'

export function celebrateWin(delay = 300) {
  const defaults = {
    particleCount: 50,
    origin: { y: 0.7 },
    gravity: 0.75,
    ticks: 600,
  } satisfies Options

  const configs = [
    { spread: 26, startVelocity: 25 },
    { spread: 60, startVelocity: 30 },
    { spread: 100, startVelocity: 35, scalar: 0.9 },
    { spread: 120, startVelocity: 25, scalar: 1.2 },
    { spread: 120, startVelocity: 35 },
  ] satisfies Options[]

  setTimeout(() => {
    try {
      configs.forEach(config => {
        confetti({ ...defaults, ...config, decay: 0.95 })
      })
    } catch (error) {
      console.error('Confetti animation failed:', error)
    }
  }, delay)
}
