import { useEffect, useState, type ReactNode } from 'react'
import { CRITERIA } from '../criteria'
import { levelInfo, totalXp, weeklyStreak } from '../game'
import { go } from '../router'
import { useGame } from '../store'
import type { Scores, TapeStatus } from '../types'
import { setMuted, useMuted } from '../sound'
import { loadVideo } from '../videoStore'

export function ProgressBar({ value, color = 'var(--green)', height = 16 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="bar" style={{ height }}>
      <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  )
}

export function TopBar({ back, title }: { back?: string; title?: ReactNode }) {
  const s = useGame()
  const xp = totalXp(s)
  const lvl = levelInfo(xp)
  const streak = weeklyStreak(s)
  return (
    <header className="topbar">
      {back ? (
        <button className="icon-btn" onClick={() => go(back)} aria-label="Back">
          ←
        </button>
      ) : (
        <a className="logo" href="#/">
          🎬 <span>selftape</span>game
        </a>
      )}
      {title && <div className="topbar-title">{title}</div>}
      <div className="topbar-stats">
        <span className={`stat ${streak.activeThisWeek ? 'fire' : 'cold'}`} title={streak.activeThisWeek ? 'Weekly streak' : 'Score a take this week to keep your streak'}>
          🔥 {streak.weeks}
        </span>
        <a className="stat xp" href="#/progress" title={`${lvl.toNext} XP to level ${lvl.level + 1}`}>
          ⚡ {xp}
        </a>
        <MuteButton />
      </div>
    </header>
  )
}

export function MuteButton() {
  const muted = useMuted()
  return (
    <button className="icon-btn mute" onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute sounds' : 'Mute sounds'} title={muted ? 'Sound off' : 'Sound on'}>
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

export function ScoreBars({ scores, prev, compact }: { scores: Scores; prev?: Scores; compact?: boolean }) {
  return (
    <div className={`score-bars ${compact ? 'compact' : ''}`}>
      {CRITERIA.map((c) => {
        const d = prev ? scores[c.key] - prev[c.key] : 0
        return (
          <div key={c.key} className="score-row" title={`${c.name}: ${scores[c.key]}/5`}>
            <span className="score-emoji">{c.emoji}</span>
            {!compact && <span className="score-name">{c.name}</span>}
            <div className="pips">
              {[1, 2, 3, 4, 5].map((i) => (
                <i key={i} style={i <= scores[c.key] ? { background: c.color } : undefined} />
              ))}
            </div>
            {prev && <Delta d={d} />}
          </div>
        )
      })}
    </div>
  )
}

export function Delta({ d }: { d: number }) {
  if (!d) return <span className="delta zero">·</span>
  return <span className={`delta ${d > 0 ? 'up' : 'down'}`}>{d > 0 ? `+${d}` : d}</span>
}

export const STATUSES: { key: TapeStatus; label: string; emoji: string }[] = [
  { key: 'preparing', label: 'Preparing', emoji: '📝' },
  { key: 'sent', label: 'Sent', emoji: '📮' },
  { key: 'callback', label: 'Callback', emoji: '📞' },
  { key: 'booked', label: 'Booked', emoji: '🏆' },
]

export function StatusPill({ status }: { status: TapeStatus }) {
  const s = STATUSES.find((x) => x.key === status)!
  return (
    <span className={`pill status-${status}`}>
      {s.emoji} {s.label}
    </span>
  )
}

export function Video({ videoId, link }: { videoId?: string; link?: string }) {
  const [url, setUrl] = useState<string>()
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    if (!videoId) return
    let objectUrl: string | undefined
    loadVideo(videoId)
      .then((blob) => {
        if (!blob) return setMissing(true)
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => setMissing(true))
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [videoId])
  if (videoId && url) return <video className="video" src={url} controls playsInline />
  if (videoId && missing) return <p className="muted small">Video file not found in this browser.</p>
  if (link)
    return (
      <a className="video-link" href={link} target="_blank" rel="noreferrer">
        ▶ Open video
      </a>
    )
  return null
}

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
