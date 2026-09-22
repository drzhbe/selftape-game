import { useEffect, useRef, useState } from 'react'
import { levelInfo, totalXp } from '../game'
import { play } from '../sound'
import { useGame } from '../store'
import { dismissCelebration, useCelebration } from '../ui'
import { ProgressBar } from './Bits'

const CONFETTI_COLORS = ['#58cc02', '#1cb0f6', '#ff9600', '#ce82ff', '#ff4b4b', '#ffc800']

export function Celebration() {
  const c = useCelebration()
  const s = useGame()
  const [shown, setShown] = useState(0)
  const playedFor = useRef<object | null>(null)

  useEffect(() => {
    if (!c) return
    setShown(0)
    const { reward } = c
    // Guard against StrictMode's double effect run stacking the chime.
    if (playedFor.current !== c) {
      playedFor.current = c
      play(reward.levelAfter > reward.levelBefore ? 'levelUp' : (c.sound ?? 'success'))
    }
    const sparkle = reward.unlocked.length ? setTimeout(() => play('achievement'), 650) : undefined
    const target = reward.xp
    const start = performance.now() + 250
    let raf = 0
    let lastTick = 0
    const tick = (t: number) => {
      const p = Math.max(0, Math.min(1, (t - start) / 700))
      setShown(Math.round(target * p))
      if (p > 0 && p < 1 && t - lastTick > 70) {
        play('xpTick')
        lastTick = t
      }
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(sparkle)
    }
  }, [c])

  if (!c) return null
  const { reward } = c
  const lvl = levelInfo(totalXp(s))
  const levelUp = reward.levelAfter > reward.levelBefore

  return (
    <div className="overlay" role="dialog" aria-modal>
      <div className="confetti" aria-hidden>
        {Array.from({ length: 40 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i % 10) * 0.08}s`,
              animationDuration: `${1.6 + (i % 5) * 0.3}s`,
            }}
          />
        ))}
      </div>
      <div className="celebrate card">
        <div className="celebrate-emoji">{levelUp ? '🚀' : reward.unlocked.length ? '🏅' : '🎉'}</div>
        <h2>{levelUp ? `Level ${reward.levelAfter}!` : c.headline ?? 'Nice work!'}</h2>
        {levelUp && <p className="level-title">You're now a {lvl.title}</p>}
        {reward.xp > 0 && <div className="xp-big">+{shown} XP</div>}
        {reward.lines.length > 0 && (
          <ul className="xp-lines">
            {reward.lines.map((l, i) => (
              <li key={i}>
                <span>{l.reason}</span>
                <b>+{l.amount}</b>
              </li>
            ))}
          </ul>
        )}
        {reward.unlocked.map((a) => (
          <div key={a.id} className="unlock">
            <span className="unlock-emoji">{a.emoji}</span>
            <div>
              <b>Achievement: {a.name}</b>
              <div className="muted small">{a.desc}</div>
            </div>
          </div>
        ))}
        <div className="celebrate-level">
          <div className="row-between small">
            <b>
              Lvl {lvl.level} · {lvl.title}
            </b>
            <span className="muted">{lvl.toNext} XP to next</span>
          </div>
          <ProgressBar value={lvl.into / lvl.span} color="var(--gold)" />
        </div>
        <button className="btn btn-primary btn-block" onClick={() => {
            play('tap')
            dismissCelebration()
          }} autoFocus>
          Continue
        </button>
      </div>
    </div>
  )
}
