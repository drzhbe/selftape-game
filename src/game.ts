import { CRITERIA, CRITERIA_KEYS, type CriterionKey } from './criteria'
import type { GameState, Scores, Take, Tape, TapeStatus } from './types'

// ---------- XP & levels ----------

export const XP = {
  newTape: 10,
  take: 20,
  video: 5,
  reflection: 10,
  improved: 5,
  bigJump: 10,
  status: { preparing: 0, sent: 30, callback: 60, booked: 150 } as Record<TapeStatus, number>,
}

export interface XpLine {
  amount: number
  reason: string
}

export function takeXp(take: Omit<Take, 'xpEarned'>, previous?: Take): XpLine[] {
  const lines: XpLine[] = [{ amount: XP.take, reason: 'Take scored' }]
  if (take.videoId || take.videoLink) lines.push({ amount: XP.video, reason: 'Video attached' })
  const noteCount = Object.values(take.notes).filter((n) => n && n.trim()).length
  if (take.nextIntent?.trim() || noteCount >= 2) lines.push({ amount: XP.reflection, reason: 'Reflection written' })
  if (previous) {
    for (const c of CRITERIA) {
      const delta = take.scores[c.key] - previous.scores[c.key]
      if (delta >= 2) lines.push({ amount: XP.bigJump, reason: `${c.name} +${delta}` })
      else if (delta === 1) lines.push({ amount: XP.improved, reason: `${c.name} +1` })
    }
  }
  return lines
}

export const totalXp = (s: GameState) => s.xpLog.reduce((sum, e) => sum + e.amount, 0)

const TITLES = [
  'Extra',
  'Background Artist',
  'Featured Extra',
  'Day Player',
  'Co-Star',
  'Guest Star',
  'Recurring',
  'Series Regular',
  'Lead',
  'Star',
]

/** XP needed to reach level L: 0, 100, 300, 600, 1000, … */
const xpForLevel = (level: number) => 50 * level * (level - 1)

export function levelInfo(xp: number) {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  return {
    level,
    title: TITLES[level - 1] ?? 'Legend',
    into: xp - floor,
    span: ceil - floor,
    toNext: ceil - xp,
  }
}

// ---------- Streak (weekly: selftapes come in waves, not every day) ----------

function weekIndex(d: Date) {
  // Weeks since epoch, starting Monday.
  const day = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)
  return Math.floor((day + 3) / 7)
}

export function allTakes(s: GameState): (Take & { tape: Tape })[] {
  return s.tapes
    .flatMap((tape) => tape.takes.map((t) => ({ ...t, tape })))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function weeklyStreak(s: GameState, now = new Date()) {
  const weeks = new Set(allTakes(s).map((t) => weekIndex(new Date(t.createdAt))))
  const current = weekIndex(now)
  const activeThisWeek = weeks.has(current)
  let w = activeThisWeek ? current : current - 1
  let count = 0
  while (weeks.has(w)) {
    count++
    w--
  }
  return { weeks: count, activeThisWeek }
}

// ---------- Insights ----------

export const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export function averages(takes: Take[]): Scores {
  return Object.fromEntries(CRITERIA_KEYS.map((k) => [k, average(takes.map((t) => t.scores[k]))])) as Scores
}

export const takeAverage = (t: Take) => average(CRITERIA_KEYS.map((k) => t.scores[k]))

export interface Insight {
  recentCount: number
  avg: Scores
  weakest: CriterionKey
  strongest: CriterionKey
  /** How many recent takes had this criterion as (tied) lowest score. */
  weakestHits: number
  isPattern: boolean
  trend: Record<CriterionKey, number>
}

const RECENT = 8

export function insight(s: GameState): Insight | null {
  const takes = allTakes(s)
  if (!takes.length) return null
  const recent = takes.slice(-RECENT)
  const avg = averages(recent)
  const sorted = [...CRITERIA_KEYS].sort((a, b) => avg[a] - avg[b])
  const weakest = sorted[0]
  const strongest = sorted[sorted.length - 1]
  const weakestHits = recent.filter((t) => t.scores[weakest] === Math.min(...CRITERIA_KEYS.map((k) => t.scores[k]))).length
  const half = Math.floor(recent.length / 2)
  const earlier = takes.slice(-RECENT * 2, -RECENT)
  const before = earlier.length ? averages(earlier) : averages(recent.slice(0, half || 1))
  const after = earlier.length ? avg : averages(recent.slice(half))
  const trend = Object.fromEntries(CRITERIA_KEYS.map((k) => [k, after[k] - before[k]])) as Record<CriterionKey, number>
  return {
    recentCount: recent.length,
    avg,
    weakest,
    strongest,
    weakestHits,
    isPattern: recent.length >= 3 && weakestHits / recent.length >= 0.5,
    trend,
  }
}

// ---------- Achievements ----------

export interface Achievement {
  id: string
  emoji: string
  name: string
  desc: string
  check: (s: GameState) => boolean
}

const takesOf = (s: GameState) => allTakes(s)

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-tape', emoji: '🎬', name: 'Action!', desc: 'Start your first selftape', check: (s) => s.tapes.length >= 1 },
  { id: 'first-take', emoji: '🪞', name: 'Honest mirror', desc: 'Score your first take', check: (s) => takesOf(s).length >= 1 },
  { id: 'three-takes', emoji: '🔁', name: 'Take three', desc: 'Score 3 takes of the same tape', check: (s) => s.tapes.some((t) => t.takes.length >= 3) },
  {
    id: 'growth',
    emoji: '🌱',
    name: 'Growth spurt',
    desc: 'Improve any criterion by 2+ between takes',
    check: (s) =>
      s.tapes.some((t) => t.takes.some((tk, i) => i > 0 && CRITERIA_KEYS.some((k) => tk.scores[k] - t.takes[i - 1].scores[k] >= 2))),
  },
  {
    id: 'all-rounder',
    emoji: '⭐',
    name: 'All-rounder',
    desc: 'A take with every criterion at 4+',
    check: (s) => takesOf(s).some((t) => CRITERIA_KEYS.every((k) => t.scores[k] >= 4)),
  },
  { id: 'perfect', emoji: '💎', name: 'Nailed it', desc: 'Give yourself an honest 5', check: (s) => takesOf(s).some((t) => CRITERIA_KEYS.some((k) => t.scores[k] === 5)) },
  { id: 'shipped', emoji: '📮', name: 'Into the void', desc: 'Mark a tape as sent', check: (s) => s.tapes.some((t) => t.status !== 'preparing') },
  { id: 'callback', emoji: '📞', name: 'They called back', desc: 'Get a callback', check: (s) => s.tapes.some((t) => t.status === 'callback' || t.status === 'booked') },
  { id: 'booked', emoji: '🏆', name: 'Booked it', desc: 'Book a job', check: (s) => s.tapes.some((t) => t.status === 'booked') },
  { id: 'five-tapes', emoji: '🗂️', name: 'Working actor', desc: 'Send 5 tapes', check: (s) => s.tapes.filter((t) => t.status !== 'preparing').length >= 5 },
  { id: 'ten-takes', emoji: '🎞️', name: 'Reel builder', desc: 'Score 10 takes', check: (s) => takesOf(s).length >= 10 },
  { id: 'reflector', emoji: '✍️', name: 'Reflector', desc: 'Write a next-take intention 5 times', check: (s) => takesOf(s).filter((t) => t.nextIntent?.trim()).length >= 5 },
  { id: 'streak-4', emoji: '🔥', name: 'On fire', desc: '4-week streak', check: (s) => weeklyStreak(s).weeks >= 4 },
  { id: 'focus', emoji: '🎯', name: 'Focused', desc: 'Pick a focus to work on', check: (s) => !!s.focus },
]
