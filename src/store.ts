import { useSyncExternalStore } from 'react'
import { track } from './analytics'
import { ACHIEVEMENTS, levelInfo, takeAverage, takeXp, totalXp, XP, type Achievement, type XpLine } from './game'
import { CRITERIA_KEYS, type CriterionKey } from './criteria'
import type { GameState, Take, Tape, TapeStatus } from './types'
import { deleteVideo } from './videoStore'

const KEY = 'selftape-game:v1'

const empty = (): GameState => ({ version: 1, tapes: [], xpLog: [], achievements: {} })

function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...empty(), ...JSON.parse(raw) }
  } catch {
    /* corrupted or unavailable storage — start fresh */
  }
  return empty()
}

let state = load()
const listeners = new Set<() => void>()

function commit(next: GameState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked; keep in memory */
  }
  listeners.forEach((l) => l())
}

export function useGame() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export const getState = () => state

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

/** Result of any action that can earn rewards — drives the celebration screen. */
export interface Reward {
  lines: XpLine[]
  xp: number
  levelBefore: number
  levelAfter: number
  unlocked: Achievement[]
}

function withRewards(next: GameState, lines: XpLine[]): Reward {
  const now = new Date().toISOString()
  const levelBefore = levelInfo(totalXp(state)).level
  next = { ...next, xpLog: [...next.xpLog, ...lines.map((l) => ({ at: now, ...l }))] }
  const unlocked = ACHIEVEMENTS.filter((a) => !next.achievements[a.id] && a.check(next))
  if (unlocked.length) {
    next = { ...next, achievements: { ...next.achievements, ...Object.fromEntries(unlocked.map((a) => [a.id, now])) } }
  }
  commit(next)
  const levelAfter = levelInfo(totalXp(next)).level
  if (levelAfter > levelBefore) track('level_up', { level: levelAfter })
  unlocked.forEach((a) => track('achievement_unlocked', { achievement_id: a.id }))
  return {
    lines,
    xp: lines.reduce((s, l) => s + l.amount, 0),
    levelBefore,
    levelAfter,
    unlocked,
  }
}

const mapTape = (s: GameState, id: string, fn: (t: Tape) => Tape): GameState => ({
  ...s,
  tapes: s.tapes.map((t) => (t.id === id ? fn(t) : t)),
})

export function createTape(fields: Pick<Tape, 'project' | 'role' | 'kind' | 'dueDate' | 'notes'>) {
  const tape: Tape = {
    ...fields,
    id: uid(),
    createdAt: new Date().toISOString(),
    status: 'preparing',
    takes: [],
    rewarded: [],
  }
  track('tape_created', { kind: tape.kind })
  const reward = withRewards({ ...state, tapes: [tape, ...state.tapes] }, [{ amount: XP.newTape, reason: 'New selftape started' }])
  return { tape, reward }
}

export function updateTape(id: string, fields: Partial<Pick<Tape, 'project' | 'role' | 'kind' | 'dueDate' | 'notes'>>) {
  commit(mapTape(state, id, (t) => ({ ...t, ...fields })))
}

export function deleteTape(id: string) {
  const tape = state.tapes.find((t) => t.id === id)
  tape?.takes.forEach((tk) => tk.videoId && deleteVideo(tk.videoId).catch(() => {}))
  commit({ ...state, tapes: state.tapes.filter((t) => t.id !== id) })
}

const STATUS_LABEL: Record<TapeStatus, string> = {
  preparing: 'Preparing',
  sent: 'Sent it! Shipped into the world',
  callback: 'Callback!',
  booked: 'BOOKED!',
}

export function setStatus(id: string, status: TapeStatus): Reward | null {
  const tape = state.tapes.find((t) => t.id === id)
  if (!tape) return null
  const order: TapeStatus[] = ['preparing', 'sent', 'callback', 'booked']
  // Reaching a later status also pays out the earlier ones you skipped.
  const due = order.slice(1, order.indexOf(status) + 1).filter((s) => !tape.rewarded.includes(s))
  track('tape_status_changed', { status, takes: tape.takes.length })
  const next = mapTape(state, id, (t) => ({ ...t, status, rewarded: [...t.rewarded, ...due] }))
  if (!due.length) {
    commit(next)
    return null
  }
  return withRewards(
    next,
    due.map((s) => ({ amount: XP.status[s], reason: STATUS_LABEL[s] })),
  )
}

export function addTake(tapeId: string, draft: Omit<Take, 'id' | 'createdAt' | 'xpEarned'>) {
  const tape = state.tapes.find((t) => t.id === tapeId)!
  const base = { ...draft, id: uid(), createdAt: new Date().toISOString() }
  const lines = takeXp(base, tape.takes[tape.takes.length - 1])
  const take: Take = { ...base, xpEarned: lines.reduce((s, l) => s + l.amount, 0) }
  track('take_scored', {
    take_number: tape.takes.length + 1,
    average: Math.round(takeAverage(take) * 10) / 10,
    has_video: !!(take.videoId || take.videoLink),
    has_intent: !!take.nextIntent,
    ...Object.fromEntries(CRITERIA_KEYS.map((k) => [`score_${k}`, take.scores[k]])),
  })
  const reward = withRewards(
    mapTape(state, tapeId, (t) => ({ ...t, takes: [...t.takes, take] })),
    lines,
  )
  return { take, reward }
}

export function deleteTake(tapeId: string, takeId: string) {
  const take = state.tapes.find((t) => t.id === tapeId)?.takes.find((t) => t.id === takeId)
  if (take?.videoId) deleteVideo(take.videoId).catch(() => {})
  commit(mapTape(state, tapeId, (t) => ({ ...t, takes: t.takes.filter((tk) => tk.id !== takeId) })))
}

export function setFocus(key: CriterionKey, drillIndex = 0) {
  track('focus_set', { criterion: key })
  return withRewards({ ...state, focus: { key, drillIndex, setAt: new Date().toISOString() } }, [])
}

export function clearFocus() {
  commit({ ...state, focus: undefined })
}

export function exportData() {
  return JSON.stringify(state, null, 2)
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as GameState
  if (parsed.version !== 1 || !Array.isArray(parsed.tapes)) throw new Error('Not a Selftape Game backup')
  commit({ ...empty(), ...parsed })
}
