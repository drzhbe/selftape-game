import type { CriterionKey } from './criteria'

export type Scores = Record<CriterionKey, number>

export type TapeStatus = 'preparing' | 'sent' | 'callback' | 'booked'

export interface Take {
  id: string
  createdAt: string
  scores: Scores
  /** Optional per-criterion notes captured while scoring. */
  notes: Partial<Record<CriterionKey, string>>
  /** "What will I try next take?" — shown when the next take starts. */
  nextIntent?: string
  /** IndexedDB key of an attached video file. */
  videoId?: string
  videoLink?: string
  xpEarned: number
}

export interface Tape {
  id: string
  createdAt: string
  project: string
  role: string
  kind: string
  dueDate?: string
  notes?: string
  status: TapeStatus
  takes: Take[]
  /** Statuses that already paid out XP, so toggling can't farm points. */
  rewarded: TapeStatus[]
}

export interface XpEvent {
  at: string
  amount: number
  reason: string
}

export interface GameState {
  version: 1
  tapes: Tape[]
  xpLog: XpEvent[]
  achievements: Record<string, string> // id -> unlockedAt
  focus?: { key: CriterionKey; drillIndex: number; setAt: string }
}
