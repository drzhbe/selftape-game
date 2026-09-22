import { useRef, useState } from 'react'
import { ProgressBar, TopBar } from '../components/Bits'
import { Radar, Sparkline, TrendChart } from '../components/Charts'
import { FocusCard } from '../components/FocusCard'
import { CRITERIA, type CriterionKey } from '../criteria'
import { ACHIEVEMENTS, allTakes, averages, insight, levelInfo, totalXp, weeklyStreak } from '../game'
import { exportData, importData, useGame } from '../store'

export function Progress() {
  const s = useGame()
  const takes = allTakes(s)
  const xp = totalXp(s)
  const lvl = levelInfo(xp)
  const streak = weeklyStreak(s)
  const ins = insight(s)
  const [highlight, setHighlight] = useState<CriterionKey>()
  const fileInput = useRef<HTMLInputElement>(null)

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `selftape-game-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = async (file?: File) => {
    if (!file) return
    if (!confirm('Replace all current data with this backup?')) return
    try {
      importData(await file.text())
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <>
      <TopBar back="/" title="Progress" />
      <main className="page">
        <section className="card">
          <div className="stats-row">
            <div>
              <b>{lvl.level}</b>
              <span>level</span>
            </div>
            <div>
              <b>{xp}</b>
              <span>XP</span>
            </div>
            <div>
              <b>{streak.weeks}🔥</b>
              <span>week streak</span>
            </div>
            <div>
              <b>{takes.length}</b>
              <span>takes</span>
            </div>
            <div>
              <b>{s.tapes.filter((t) => t.status !== 'preparing').length}</b>
              <span>sent</span>
            </div>
          </div>
          <div className="row-between small">
            <b>{lvl.title}</b>
            <span className="muted">
              {lvl.toNext} XP to level {lvl.level + 1}
            </span>
          </div>
          <ProgressBar value={lvl.into / lvl.span} color="var(--gold)" />
        </section>

        <FocusCard />

        {ins && (
          <section className="card">
            <h3>Your acting shape</h3>
            <p className="muted small">Average of your last {ins.recentCount} takes{takes.length > ins.recentCount ? ' vs. all time' : ''}.</p>
            <Radar
              series={[
                ...(takes.length > ins.recentCount ? [{ scores: averages(takes), color: '#afafaf', label: 'All time' }] : []),
                { scores: ins.avg, color: '#1cb0f6', label: 'Recent' },
              ]}
            />
            <div className="crit-table">
              {CRITERIA.map((c) => {
                const t = ins.trend[c.key]
                return (
                  <button
                    key={c.key}
                    className={`crit-row ${highlight === c.key ? 'on' : ''}`}
                    onClick={() => setHighlight(highlight === c.key ? undefined : c.key)}
                  >
                    <span>{c.emoji}</span>
                    <span className="crit-name">{c.name}</span>
                    <Sparkline values={takes.map((tk) => tk.scores[c.key])} color={c.color} />
                    <b>{ins.avg[c.key].toFixed(1)}</b>
                    <span className={`delta ${t > 0.05 ? 'up' : t < -0.05 ? 'down' : 'zero'}`}>
                      {t > 0.05 ? '▲' : t < -0.05 ? '▼' : '·'}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {takes.length > 1 && (
          <section className="card">
            <h3>Every take, over time</h3>
            <p className="muted small">Tap a skill above to highlight it.</p>
            <TrendChart takes={takes.map((t) => t.scores)} highlight={highlight} />
          </section>
        )}

        <section className="card">
          <h3>
            Achievements <span className="muted small">{Object.keys(s.achievements).length}/{ACHIEVEMENTS.length}</span>
          </h3>
          <div className="badges">
            {ACHIEVEMENTS.map((a) => {
              const got = !!s.achievements[a.id]
              return (
                <div key={a.id} className={`badge ${got ? 'got' : ''}`} title={a.desc}>
                  <div className="badge-emoji">{got ? a.emoji : '🔒'}</div>
                  <b>{a.name}</b>
                  <span>{a.desc}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card">
          <h3>Backup</h3>
          <p className="muted small">Everything is stored in this browser. Export a backup now and then (video files aren't included).</p>
          <div className="row gap">
            <button className="btn btn-ghost btn-sm" onClick={download}>
              Export
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
              Import
            </button>
            <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => upload(e.target.files?.[0])} />
          </div>
        </section>
      </main>
    </>
  )
}
