import { useSyncExternalStore } from 'react'
import type { SoundName } from './sound'
import type { Reward } from './store'

// The celebration overlay is global so any screen can trigger it.
let current: { reward: Reward; headline?: string; sound?: SoundName } | null = null
const listeners = new Set<() => void>()

export function celebrate(reward: Reward | null, headline?: string, sound?: SoundName) {
  if (!reward || (!reward.xp && !reward.unlocked.length)) return
  current = { reward, headline, sound }
  listeners.forEach((l) => l())
}

export function dismissCelebration() {
  current = null
  listeners.forEach((l) => l())
}

export const useCelebration = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
